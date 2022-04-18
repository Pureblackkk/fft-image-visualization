import { expose } from 'Comlink';

declare const self: any;
export default {} as typeof Worker & { new (): Worker };


export const ftAPI = {
    /**
     * Do fft for single channel
     */
    channelFT: (start: number, end: number, channelData: Uint8ClampedArray | null, width: number, height: number): {
        kChannel: Array<number>,
        kSpaceMap: Array<Array<number>>,
    } => {
        if (channelData === null) {return {kChannel: [], kSpaceMap: []}}
        const kChannelList: Array<number> = [];
        const kSpaceMap: Array<Array<number>> = [];

        const getXY = (x: number, y: number) => {
            const index = x * width + y;
            return channelData[index];
        }

        const calculateSumOnXY = (u: number, v: number) => {
            let realPart = 0;   
            let imaginaryPart = 0;
            const totalLen = width * height;

            for (let x = 0; x < height; x++) {
                for (let y = 0; y < width; y++) {
                    const phi = (width * u * x + height * v * y) * 2 * Math.PI / (totalLen);
                    const fXY = getXY(x, y);
                    realPart += Math.cos(phi) * fXY;
                    imaginaryPart += -Math.sin(phi) * fXY;
                }
            }

            return { realPart, imaginaryPart };
        }

        const startTime = new Date().getTime();

        // Calculate the F(u, v)
        for (let uv = start; uv < end; uv ++) {
            const u = Math.floor(uv / width);
            const v = uv % width;
            const { realPart, imaginaryPart } = calculateSumOnXY(u, v);
            let magnitude = Math.round(Math.sqrt(realPart**2 + imaginaryPart**2));
            magnitude = Math.log(magnitude + 1);

            kChannelList.push(magnitude);
            kSpaceMap.push([realPart, imaginaryPart]);
        }

        const endTime = new Date().getTime();
        return {
            kChannel: kChannelList,
            kSpaceMap,
        };
    }
}

expose(ftAPI);