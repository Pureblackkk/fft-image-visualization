import { GlobalEventName, RGBCoeffcients, ChannelSplitSectionNum } from "@/src/global/global-defination";
import { Eventer } from "@/src/utils/eventer";
import { Remote, wrap } from 'Comlink';
import ImageProcessWorker, { channel2imageAPI } from "@/src/worker/channel2image.worker";
import FTWorker, { ftAPI } from "@/src/worker/ft.worker";
import FFTWorker, { fftAPI } from "@/src/worker/fft.worker";
import FTInverseWorker, { ftInverseAPI } from '@/src/worker/ftInverse.worker';
import FFTInverseWorker, { fftInverseAPI } from '@/src/worker/fftInverse.worker';

class MyImage {
    private static instance: MyImage;
    private toolCanvas: HTMLCanvasElement = document.createElement('canvas');
    private toolCTX: CanvasRenderingContext2D | null = this.toolCanvas.getContext('2d');

    private channel2imageWorker: Worker = new ImageProcessWorker();
    private channel2imageWorkerAPI = wrap<typeof channel2imageAPI>(this.channel2imageWorker);
    
    // Define fft worker
    private fftWorker = new FFTWorker();
    private fftWorkerAPI = wrap<typeof fftAPI>(this.fftWorker);

    // Define inverse fft worker
    private fftInverseWorker = new FFTInverseWorker();
    private fftInverseWorkerAPI = wrap<typeof fftInverseAPI>(this.fftInverseWorker);

    // Define ft worker related
    private ftWorkerPool: Array<Worker> = [];
    private ftWorkerAPIPool: Array<Remote<{
        channelFT: (start: number, end: number, channelData: Uint8ClampedArray | null, width: number, height: number) => {
            kChannel: Array<number>;
            kSpaceMap: number[][];
        };
    }>> = [];
    
    // Define inverse fft worker related
    private ftInverseWorkerPool: Array<Worker> = [];
    private ftInverseWorkerAPIPool: Array<Remote<{
        channelInverseFT: (start: number, end: number, kSpaceMap: Array<Array<number>>, width: number, height: number) => Array<number>;
    }>> = [];
    
    // A squence of mask, which contains [[LeftUp], [RightBottom]]
    private shiftedKChannel: Uint8ClampedArray | null = null;
    private shiftedKChannelMap: Array<number> | null = null;

    public grayChannel: Uint8ClampedArray | null = null;
    public shrinkedGrayChannel: Uint8ClampedArray | null = null;
    public inversedGrayChannel: Uint8ClampedArray | null = null;
    public alphaChannel: Uint8ClampedArray | null = null;
    public kChannel: Uint8ClampedArray | null = null;
    public shrinkedAlphaChannel: Uint8ClampedArray | null = null;
    public kSpaceData: ImageData | null = null;
    public kSpaceMap: {
        width: number,
        height: number,
        data: Array<Array<number>> | null,
        alphaChannel: Uint8ClampedArray | null,
    } = {
        width: 0, 
        height: 0,
        data: null,
        alphaChannel: null,
    };
    public recoveredImageData: ImageData | null = null;
    public imageData: ImageData | null = null;
    public shrinkedImageData: ImageData | null = null;
    
    public static getInstance(): MyImage {
        if(!this.instance) {
            this.instance = new MyImage();
        }
        return this.instance;
    }

    constructor() {
        if (!MyImage.instance) {
            MyImage.instance = this;

            // Initial FFT Woker Pool
            for (let i = 0; i < ChannelSplitSectionNum; i++) {
                let newWorker = new FTWorker();
                let newWorkerAPI = wrap<typeof ftAPI>(newWorker);
                this.ftWorkerPool.push(newWorker);
                this.ftWorkerAPIPool.push(newWorkerAPI);
                
                let newReverseWorker = new FTInverseWorker();
                let newReverseAPI = wrap<typeof ftInverseAPI>(newReverseWorker);
                this.ftInverseWorkerPool.push(newWorker);
                this.ftInverseWorkerAPIPool.push(newReverseAPI);
            }
        }
        return MyImage.instance; 
    }

    public initialEventerHandler(): void {
        // Register image data recieving
        Eventer.addEventListener(GlobalEventName.ParseImage, this.recieveImage.bind(this));
    }

    private initialImage(imgURL: string | undefined): void{
        if (this.toolCTX == null || !imgURL) { return }

        const tempImgae = new Image();
        tempImgae.src = imgURL;
        tempImgae.onload = () => {
            // Set tool canvas width and height
            this.toolCanvas.width = tempImgae.width;
            this.toolCanvas.height = tempImgae.height;

            this.toolCTX?.drawImage(tempImgae, 0, 0);

            const imageBuffer = this.toolCTX?.getImageData(
                0,
                0,
                this.toolCanvas.width,
                this.toolCanvas.height,
            );
            
            // Assign image data
            if (!! imageBuffer) {
                this.imageData = imageBuffer;
            }

            // Trigger data changed
            Eventer.dispatchEvent(GlobalEventName.ImageDataChanged);
        }
    }

    private packagingImageData(imgData: ImageData) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = imgData.width;
        tempCanvas.height = imgData.height;
        tempCtx?.putImageData(imgData, 0, 0);

        return new Promise<CanvasImageSource>(resolve => {
            const imageObject = new Image();
            imageObject.onload = () => {resolve(imageObject)};
            imageObject.src = tempCanvas.toDataURL();
        });
    }

    private cropImageData(imgData: ImageData): ImageData {
        const width = imgData.width;
        const height = imgData.height;
        const cropedWidth = Math.pow(2, Math.floor(Math.log2(width)));
        const cropedHeight = Math.pow(2, Math.floor(Math.log2(height)));

        const array = new Uint8ClampedArray(cropedWidth * cropedHeight * 4);
        
        // Make croped array
        const originData = imgData.data;
        for (let i = 0; i < cropedHeight; i++) {
            for (let j = 0; j < cropedWidth; j++) {
                const currentIndex = (i * cropedWidth + j) * 4;
                const index = (i * width + j) * 4;
                array[currentIndex] = originData[index];
                array[currentIndex + 1] = originData[index + 1];
                array[currentIndex + 2] = originData[index + 2];
                array[currentIndex + 3] = originData[index + 3];
            }
        }

        // Make new image data
        return new ImageData(array, cropedWidth, cropedHeight);
    }

    /**
     * Set shrinkedImageData from drawed colorful image
     * @param canvasObject 
     */
    public setShrinkedImageData(canvasObject: HTMLCanvasElement, isCroped: boolean): void {

        const ctx = canvasObject.getContext('2d');
        const imageBuffer = ctx?.getImageData(0, 0, canvasObject.width, canvasObject.height);
        if (!!imageBuffer) { 
            if (!!isCroped) {
                this.shrinkedImageData = this.cropImageData(imageBuffer);
            } else {
                this.shrinkedImageData = imageBuffer;
            }
        }
        console.log('Shrinked image', this.shrinkedImageData);
    }

    /**
     * Get gray channel data
     */
    public getGrayChannel(isShrinked: boolean = true): void {
        const imageData = isShrinked ? this.shrinkedImageData : this.imageData;

        if (imageData == null) { return }

        // Define channel
        const grayChannelList: Array<number> = [];
        const alphaChannelList: Array<number> = [];

        for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i] * RGBCoeffcients.r;
            const g = imageData.data[i + 1] * RGBCoeffcients.g;
            const b = imageData.data[i + 2] * RGBCoeffcients.b;
            const gray = Math.round(r + g + b);
            grayChannelList.push(gray);
            alphaChannelList.push(imageData.data[i + 3]);
        }
        
        if (isShrinked) {
            this.shrinkedGrayChannel = Uint8ClampedArray.from(grayChannelList);
            this.shrinkedAlphaChannel = Uint8ClampedArray.from(alphaChannelList);
        } else {
            this.grayChannel = Uint8ClampedArray.from(grayChannelList);
            this.alphaChannel = Uint8ClampedArray.from(alphaChannelList);
        }
    }

    /**
     * Split kChannel into K section
     */
    private getUVStartAndEnd(channelOrSpace: Uint8ClampedArray | Array<Array<number>>): Array<Array<number>> {
        const channelPieces: Array<Array<number>> = [];

        if (channelOrSpace == null) { return channelPieces }

        // Split channel
        const channelLen = channelOrSpace.length;
        if (channelLen <= ChannelSplitSectionNum) { return [[0, channelLen]] }

        const sectionlSize = Math.ceil(channelLen / ChannelSplitSectionNum);

        for (let i = 0; i < channelLen; i += sectionlSize) {
            channelPieces.push([i, (i + sectionlSize) < channelLen ? (i + sectionlSize) : channelLen]);
        }

        return channelPieces
    }

    /**
     * Shift the k channel to make zero-frequency in zero
     * Note here width and height are fixed to even number
     */
    private shiftKChannel(kChannel: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
        const halfLeftWidth = Math.ceil(width / 2);
        const halfRightWidth = width - halfLeftWidth;
        const halfUpHeight =  Math.ceil(height / 2);
        const halfDownHeight = height - halfUpHeight;

        const shiftedKChannel = [];
        const shiftedKChannelMap = [];
        let startIndex = halfUpHeight * width + halfLeftWidth;
        
        // Fill 1, 2 Quarter field as original 3,4 Quarter field
        for (let y = 0; y < halfDownHeight; y++) {
            for (let x = 0; x < halfRightWidth; x++) {
                shiftedKChannel.push(kChannel[startIndex + x]);
                shiftedKChannelMap.push(startIndex + x);
            }

            for (let x = -halfLeftWidth; x < 0; x++) {
                shiftedKChannel.push(kChannel[startIndex + x]);
                shiftedKChannelMap.push(startIndex + x);
            }

            startIndex += width;
        }

        // Fill 3, 4 Quarter field as original 1,2 Quarter field
        startIndex = halfLeftWidth;
        for (let y = 0; y < halfUpHeight; y++) {
            for (let x = 0; x < halfRightWidth; x++) {
                shiftedKChannel.push(kChannel[startIndex + x]);
                shiftedKChannelMap.push(startIndex + x);
            }

            for (let x = -halfLeftWidth; x < 0; x++) {
                shiftedKChannel.push(kChannel[startIndex + x]);
                shiftedKChannelMap.push(startIndex + x);
            }

            startIndex += width;
        }

        this.shiftedKChannelMap = shiftedKChannelMap;
        return Uint8ClampedArray.from(shiftedKChannel);
    }

    /**
     * Scale the k channel magnitude to make it fit for gray picture
     */
    private scaleKChannel(kChannelList: Array<number>): Array<number> {
        const scaledKChannel: Array<number> = [];
        const minVal = Math.min.apply(null, kChannelList);
        const maxVal = Math.max.apply(null, kChannelList);
        kChannelList.forEach((item) => {
            const scaledValue = Math.round(255 * (item - minVal) / (maxVal - minVal));
            scaledKChannel.push(scaledValue);
        });
        return scaledKChannel;
    }
    
    private recieveImage(message: string) {        
        // Create canvas to parse image
        this.initialImage(message);
    }

    /**
     * Draw the current image on given canvas
     */
    public drawImage (
        canvasObject: HTMLCanvasElement, 
        imageData: ImageData | Uint8ClampedArray | null,
        width?: number,
        height?: number,
        alphaChannel?: Uint8ClampedArray
    ): Promise<void> {
        if (imageData == null) { return Promise.reject()}
        const ctx = canvasObject.getContext('2d');
        if (ctx == null) { return Promise.reject()}
        
        // If image is uint8Array then fullfill it to ImageData
        if (imageData instanceof Uint8ClampedArray) {
            return this.channel2imageWorkerAPI.createImageData({
                channel: imageData,
                width: width as number,
                height: height as number,
                alpha: alphaChannel as Uint8ClampedArray,
            }).then((image: ImageData | null) => {
                if (image == null) { throw new Error('Error in channel2image, ImageData return null!'); }
                return this.packagingImageData(image);
            }).then((image: CanvasImageSource) => {
                ctx.drawImage(
                    image, 
                    0, 0, image.width as number, image.height as number,
                    0, 0, canvasObject.width, canvasObject.height
                );
            }).catch((error) => {
                console.log(error);
            });
        }

        // If image is normal image data then directly draw it
        return this.packagingImageData(imageData).then((image: CanvasImageSource) => {
            ctx.drawImage(
                image, 
                0, 0, image.width as number, image.height as number,
                0, 0, canvasObject.width, canvasObject.height
            );
        });
    }

    /**
     * Do FT2 to image data for getting k-space data
     */
    public imageFT2(isColor: boolean, isShrinked: boolean = true, isShifted: boolean = true): Promise<void> {
        let imageData: ImageData | null = null;
        let alphaChannel: Uint8ClampedArray | null = null;
        let grayChannel: Uint8ClampedArray | null = null;

        if (isShrinked) {
            imageData = this.shrinkedImageData
            alphaChannel = this.shrinkedAlphaChannel;
            grayChannel = this.shrinkedGrayChannel;
        } else {
            imageData = this.imageData;
            alphaChannel = this.alphaChannel;
            grayChannel = this.grayChannel;
        }

        if (imageData == null) { return Promise.reject('No image data found') }

        if (!isColor) {
            // Do fft2 only for grey channel
            if (!grayChannel) { return Promise.reject('No gray channel found') }

            // Split grayChannel
            const channelPieces = this.getUVStartAndEnd(grayChannel);
            if (channelPieces.length == 0) { return Promise.reject('Channel Pieces creation failed!') }

            // Start multiple promise
            const promiseList: Array<Promise<{
                kChannel: Array<number>,
                kSpaceMap: Array<Array<number>>,
            }>> = [];

            // Pre-define height and width
            const width = imageData.width;
            const height = imageData.height;
            
            channelPieces.forEach((startAndEnd, index) => {
                promiseList.push(this.ftWorkerAPIPool[index].channelFT(
                    startAndEnd[0],
                    startAndEnd[1],
                    grayChannel,
                    width,
                    height,
                ));
            });

            return Promise.all(promiseList)
            .then((data) => {
                // Rebuild kChannel and kSpaceMap
                let tempKChannelList: Array<number> = [];
                let tempKSpace: Array<Array<number>>= [];

                data.forEach((item) => {
                    tempKChannelList = tempKChannelList.concat(item.kChannel);
                    tempKSpace = tempKSpace.concat(item.kSpaceMap);
                })

                // Scaled the channel data to fit gray level
                tempKChannelList = this.scaleKChannel(tempKChannelList);
                this.kChannel = Uint8ClampedArray.from(tempKChannelList);

                // Shift the kSpace
                if (isShifted) {
                    this.shiftedKChannel = this.shiftKChannel(this.kChannel, width, height);
                } 
                
                this.kSpaceMap = {
                    height,
                    width,
                    alphaChannel,
                    data: tempKSpace
                };
                
                // Create kSpace image data from k channel
                return this.channel2imageWorkerAPI.createImageData({
                    channel: isShifted ? this.shiftedKChannel as Uint8ClampedArray : this.kChannel,
                    width: imageData?.width as number,
                    height: imageData?.height as number,
                    alpha: alphaChannel as Uint8ClampedArray,
                });
            })
            .then((image: ImageData | null) => {
                if (image == null) { throw new Error('Error in channel2image, ImageData return null!'); }
                this.kSpaceData = image;
            })
            .catch((error) => {
                console.log(error);
            });
        } else {
            return Promise.reject();
        }
    }

    /**
     * Do Inverse FT2 to image for getting inversed gray channel data
     */
    public imageInversedFT2(kSpaceMapData: Array<Array<number>> | null = null): Promise<void> {
        if (kSpaceMapData == null && this.kSpaceMap.data == null) {return Promise.reject()}
        if (kSpaceMapData == null) { kSpaceMapData = this.kSpaceMap?.data as Array<Array<number>> }

        // Split kSpaceMap
        const kSpaceMapPieces = this.getUVStartAndEnd(kSpaceMapData);
        if (kSpaceMapPieces.length == 0) { return Promise.reject('SpaceMap Pieces creation failed!') }

        // Start multiple promise
        const promiseList: Array<Promise<number[]>> = [];
        kSpaceMapPieces.forEach((startAndEnd, index) => {
            promiseList.push(this.ftInverseWorkerAPIPool[index].channelInverseFT(
                startAndEnd[0],
                startAndEnd[1],
                kSpaceMapData as Array<Array<number>>,
                this.kSpaceMap.width,
                this.kSpaceMap.height,
            ));
        });

        return Promise.all(promiseList)
        .then((data) => {
            let tempGrayChannelList: Array<number> = [];

            // Rebuild gray channel
            data.forEach((channelPieces) => {
                tempGrayChannelList = tempGrayChannelList.concat(channelPieces);
            });

            this.inversedGrayChannel = Uint8ClampedArray.from(tempGrayChannelList);
        }).catch(error => {
            console.log(error);
        })
    }

    /**
     * DO FFT2 to image data for getting k-space data
     */
    public imageFFT2(isColor: boolean, isShrinked: boolean = true, isShifted: boolean = true): Promise<void> {
        let imageData: ImageData | null = null;
        let alphaChannel: Uint8ClampedArray | null = null;
        let grayChannel: Uint8ClampedArray | null = null;

        if (isShrinked) {
            imageData = this.shrinkedImageData
            alphaChannel = this.shrinkedAlphaChannel;
            grayChannel = this.shrinkedGrayChannel;
        } else {
            imageData = this.imageData;
            alphaChannel = this.alphaChannel;
            grayChannel = this.grayChannel;
        }

        if (imageData == null) { return Promise.reject('No image data found') }

        const width = imageData?.width;
        const height = imageData?.height;

        if (!isColor) {
            // Do fft2 only for grey channel
            if (!grayChannel) { return Promise.reject('No gray channel found') }

            // Call the worker to calculate the fft
            return this.fftWorkerAPI.channelFFT(grayChannel, width, height)
            .then((data) => {
                if(data.kChannel.length === 0) { throw new Error('FFT calculation failed')}
                

                console.log('fft2 kchannel', data.kChannel);

                // Scaled the channel data to fit gray level
                this.kChannel = Uint8ClampedArray.from(this.scaleKChannel(data.kChannel));

                // Shift the kSpace
                if (isShifted) {
                    this.shiftedKChannel = this.shiftKChannel(this.kChannel, width, height);
                }

                this.kSpaceMap = {
                    height,
                    width,
                    alphaChannel,
                    data: data.kSpaceMap
                };
                
                // Create kSpace image data from k channel
                return this.channel2imageWorkerAPI.createImageData({
                    channel: isShifted ? this.shiftedKChannel as Uint8ClampedArray : this.kChannel,
                    width: imageData?.width as number,
                    height: imageData?.height as number,
                    alpha: alphaChannel as Uint8ClampedArray,
                });
            })
            .then((image: ImageData | null) => {
                if (image == null) { throw new Error('Error in channel2image, ImageData return null!'); }
                this.kSpaceData = image;
            })
            .catch((error) => {
                console.log(error);
            });
        } else {
            return Promise.reject();
        }
    }

    /**
     * Do Inverse FFT2 to image for getting inversed gray channel data
     */
    public imageInversedFFT2(kSpaceMapData: Array<Array<number>> | null = null): Promise<void> {
        if (kSpaceMapData == null && this.kSpaceMap.data == null) {return Promise.reject()}
        if (kSpaceMapData == null) { kSpaceMapData = this.kSpaceMap?.data as Array<Array<number>> }

        return this.fftInverseWorkerAPI.channelInverseFFT(kSpaceMapData, this.kSpaceMap.width, this.kSpaceMap.height)
        .then((data) => {
            console.log('inverse data', data);
            this.inversedGrayChannel = Uint8ClampedArray.from(data);
        }).catch(error => {
            console.log(error);
        })
    }

    /**
     * Return k channel mask when do the selection with bouding box
     */
    public getKSpaceMapDataWithMask(
        leftUp: Array<number>, 
        rightBottom: Array<number>,
        isShrinked: boolean = true,
    ): Array<Array<number>> | null{
        if (this.shiftedKChannelMap == null || this.kSpaceMap.data == null) { return null }
        const width = isShrinked ? this.shrinkedImageData?.width : this.imageData?.width;
        const height = isShrinked ? this.shrinkedImageData?.height: this.imageData?.height;
        if (width == null || height == null) { return null }
        // Copy kSpaceMap
        const copyedKSpaceMapData: Array<Array<number>> = [] 

        let startIndex = Math.round(leftUp[1] * height) * width + Math.round(leftUp[0] * width);
        let mapDict: {[key: string]: number} = {};
        const rectWidth = Math.round((rightBottom[0] - leftUp[0]) * width);
        const rectHeight = Math.round((rightBottom[1] - leftUp[1]) * height);
        
        // Make string key object for looking up
        for (let h = 0; h < rectHeight; h++){
            for (let w = 0; w < rectWidth; w++) {
                const actualIndex = this.shiftedKChannelMap[startIndex + w];
                mapDict[actualIndex.toString()] = 1;
            }
            startIndex += width;
        }

        // Make new SpaceMapData
        this.kSpaceMap.data.forEach((value, index) => {
            let newValue: Array<number> = value;
            if(!(index.toString() in mapDict)) {
                newValue = [0, 0];
            }
            copyedKSpaceMapData.push(newValue);
        })

        return copyedKSpaceMapData;
    }

    /**
     * Return k channel mask when do the filter selection
     */
    public getKSpaceMapDataWithFilter(
        scaledRange: Array<number>,
        isShrinked: boolean = true
    ): Array<Array<number>> | null {
        if (this.shiftedKChannelMap == null || this.kSpaceMap.data == null) { return null }
        const width = isShrinked ? this.shrinkedImageData?.width : this.imageData?.width;
        const height = isShrinked ? this.shrinkedImageData?.height: this.imageData?.height;
        if (width == null || height == null) { return null }

        let mapDict: {[key: string]: number} = {};
        let minEdge = Math.min(width, height);
        const indexDistanceMin = Math.floor(minEdge * scaledRange[0]);
        const indexDistanceMax = Math.floor(minEdge* scaledRange[1]);

        const centerX = width / 2;
        const centerY = height / 2;

        // Make string key object for looking up, here we shrink the looking up area
        const shrinkedSquareLen = indexDistanceMax * 2;
        let shrinkedSquareStartIndex = (centerY - indexDistanceMax) * width + centerX - indexDistanceMax;

        for (let h = 0; h < shrinkedSquareLen; h++) {
            for (let w = 0; w < shrinkedSquareLen; w++) {
                // Find if in the range
                const distance2Center = Math.sqrt(Math.abs(h - indexDistanceMax - 0.5)**2 + Math.abs(w - indexDistanceMax + 0.5)**2);
                if (distance2Center > indexDistanceMin && distance2Center < indexDistanceMax) {
                    const actualIndex = this.shiftedKChannelMap[shrinkedSquareStartIndex + w];
                    mapDict[actualIndex.toString()] = 1;
                }
            }
            shrinkedSquareStartIndex += width;
        }
        
        // Make new SpaceMapData
        const copyedKSpaceMapData = new Array(width * height).fill(null).map(() => new Array(2));
        this.kSpaceMap.data.forEach((value, index) => {
            let newValue: Array<number> = value;
            if(!(index.toString() in mapDict)) {
                newValue = [0, 0];
            }
            copyedKSpaceMapData[index] = newValue;
        })

        return copyedKSpaceMapData
    }
}

export const Imager = MyImage.getInstance();