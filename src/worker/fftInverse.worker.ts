import { expose } from 'Comlink';
import { FFT } from '@/utils/fft';

declare const self: any;
export default {} as typeof Worker & { new (): Worker };

export const fftInverseAPI = {
    /**
     * Do inverse fft
     */
    channelInverseFFT: (
        kSpaceMap: Array<Array<number>>,
        width: number,
        height: number,
    ): Array<number> => {
        if (kSpaceMap === null) {return []}
        const inversedGrayChannelList: Array<number> = Array(width * height);

        // Define FFT object
        const rowFFT = new FFT(width);
        const columnFFT = new FFT(height);

        // Do Inverse for column
        const rowArray = new Array(height).fill(null).map(
            () => new Array(width).fill(null).map(() => new Array(2))
        );

        for (let w = 0; w < width; w++) {
            // Get each column
            const colArray = new Array(height);
            let rowIndex = 0;

            for (let index = w; index < kSpaceMap.length; index += width) {
                colArray[rowIndex] = kSpaceMap[index];
                rowIndex += 1;
            }

            // DO column inverse FFT
            columnFFT.reverse(colArray);

            // Get result
            const result = columnFFT.getReverseData(false);
            if (result == null) {return []}

            // Copy mid result to array
            rowArray.forEach((row, idx) => {
                row[w][0] = (result as Array<Array<number>>)[idx][0];
                row[w][1] = (result as Array<Array<number>>)[idx][1];
            })
        }
        
        // Do Inverse for row
        for (let h = 0; h < height; h++) {
            const rowData = rowArray[h];
            rowFFT.reverse(rowData);
            const result = rowFFT.getReverseData(true);
            if (result == null) {return []}

            // Make the final result
            result.forEach((value, idx) => {
                inversedGrayChannelList[(h + 1) * width - idx - 1] = value as number;
            })
        }
        
        return inversedGrayChannelList;
    }
}

expose(fftInverseAPI);