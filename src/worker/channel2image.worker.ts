import { Channel2ImageData } from "@/global/global-defination";
import { expose } from 'Comlink';

declare const self: any;
export default {} as typeof Worker & { new (): Worker };

export const channel2imageAPI = {
    createImageData: (channel2imageData: Channel2ImageData): ImageData | null => {
        if (!channel2imageData) { return null }

        const { channel, width, height, alpha } = channel2imageData;

        let newImageDataList: Array<number>= [];
        channel.forEach((item, index) => {
            newImageDataList.push(item);
            newImageDataList.push(item);
            newImageDataList.push(item);
            newImageDataList.push(alpha[index] as number);
        })
    
        const newImageData = Uint8ClampedArray.from(newImageDataList);
        return new ImageData(newImageData, width as number, height as number);
    } 
}

expose(channel2imageAPI);