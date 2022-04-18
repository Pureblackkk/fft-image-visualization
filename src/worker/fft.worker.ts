import { expose } from 'Comlink';
import { SpectrumResult, FFT } from '@/utils/fft';

declare const self: any;
export default {} as typeof Worker & { new (): Worker };

export const fftAPI = {
    /**
     * Do fft for single channel
     */
    channelFFT: (channelData: Uint8ClampedArray | null, width: number, height: number): {
        kChannel: Array<number>,
        kSpaceMap: Array<Array<number>>,
    } => {
        if (channelData === null) {return {kChannel: [], kSpaceMap: []}}
        const kChannelList: Array<number> = new Array(width * height);
        const kSpaceMap: Array<Array<number>> = new Array(width * height);
        
        // Define FFT object
        const rowFFT = new FFT(width);
        const columnFFT = new FFT(height);

        // Do FFT for row
        const colArray = new Array(width).fill(null).map(
            () => new Array(height).fill(null).map(() => new Array(2))
        );

        for (let h = 0; h < height; h++) {
            // Get each row
            const rowData = channelData.slice(h * width, (h + 1) * width);
            const rowSpaceMap = new Array(width).fill(null).map(() => new Array(2));
            for (let index = 0; index < width; index++) {
                rowSpaceMap[index][0] = rowData[index];
                rowSpaceMap[index][1] = 0;
            }

            rowFFT.calculation(rowSpaceMap);

            const result = rowFFT.getSpectrum(false);
            if (result == null) {return {kChannel: [], kSpaceMap: []}}

            // Copy mid result to array
            colArray.forEach((col, idx) => { 
                col[h][0] = (result as Array<Array<number>>)[idx][0];
                col[h][1] = (result as Array<Array<number>>)[idx][1];
            });
        }
              
        // Do FFT for column
        for (let col = 0; col < width; col++) {
            // Get each column
            const colData = colArray[col];
            columnFFT.calculation(colData);
            const result = columnFFT.getSpectrum(true);
            if (result == null) {return {kChannel: [], kSpaceMap: []}}

            // Make the final result
            (result as SpectrumResult).magnitude.forEach((value, index) => {
                kChannelList[index * width + col] = value;
            });

            (result as SpectrumResult).spaceMap.forEach((value, index) => {
                kSpaceMap[index * width + col] = value;
            })
        }

        return {
            kChannel: kChannelList,
            kSpaceMap,
        };
    }
}



expose(fftAPI);