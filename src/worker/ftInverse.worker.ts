import { expose } from 'Comlink';

declare const self: any;
export default {} as typeof Worker & { new (): Worker };

export const ftInverseAPI = {
    /**
     * Do inverse fft
     */
    channelInverseFT: (
        start: number,
        end: number,
        kSpaceMap: Array<Array<number>>,
        width: number,
        height: number,
    ): Array<number> => {
        if (kSpaceMap === null) {return []}
        const inversedGrayChannelList: Array<number> = [];

        const getUV = (u: number, v: number) => {
            const index = u * width + v;
            return kSpaceMap[index];
        }

        const calculateSumOnUV = (x: number, y: number) => {
            const totalLen = width * height;
            let sum = 0;

            for (let u = 0; u < height; u++) {
                for (let v = 0; v < width; v++) {
                    const FUV = getUV(u, v);
                    const phi = (width * u * x + height * v * y) * 2 * Math.PI / (totalLen);
                    let tempSum = Math.cos(phi) * FUV[0];
                    tempSum += -1 * Math.sin(phi) * FUV[1];
                    tempSum = tempSum / (totalLen);
                    sum += tempSum;
                }
            }

            return sum;
        }

        // Calculate the f(x, y)
        for (let xy = start; xy < end; xy ++) {
            const x = Math.floor(xy / width);
            const y = xy % width;
            let pointValue = Math.round(calculateSumOnUV(x, y));
            if (pointValue < 0) { pointValue = 0 }
            if (pointValue > 255) { pointValue = 255 }
            inversedGrayChannelList.push(pointValue);
        }

        return inversedGrayChannelList;
    }
}

expose(ftInverseAPI);