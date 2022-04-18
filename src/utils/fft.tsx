export interface SpectrumResult {
    magnitude: Array<number>;
    spaceMap: Array<Array<number>>;
}

/**
 * Class for FFT
 */
export class FFT {
    private dataLen: number;
    private reverseTable: Uint32Array | null;
    private sinTable: Float64Array | null;
    private cosTable: Float64Array | null;
    private real: Float64Array | null;
    private imag: Float64Array | null;

    constructor(dataLen: number) {
        this.dataLen = dataLen;
        this.reverseTable = this.constructReverseTable(dataLen);
        if (this.reverseTable === null) {
            this.sinTable = null;
            this.cosTable = null;
            this.real = null;
            this.imag = null;
        } else {
            const sinCosList = this.constructSinCosTable(dataLen);
            this.sinTable = sinCosList[0];
            this.cosTable = sinCosList[1];
            this.real = new Float64Array(dataLen);
            this.imag = new Float64Array(dataLen);
        }
    }

    private constructReverseTable(dataLen: number): Uint32Array | null{
        // Test whether the data length is power of 2
        const roundPower = Math.floor(Math.log2(dataLen));
        if (Math.pow(2, roundPower) !== dataLen) { return null; }

        // Make the reverse table
        const reverseTable = new Uint32Array(dataLen);
        let limit = 1;
        let bit = dataLen >> 1;

        while (limit < dataLen) {
            for (let i = 0; i < limit; i++) {
                reverseTable[i + limit] = reverseTable[i] + bit;
            }

            limit = limit << 1;
            bit = bit >> 1;
        }

        return reverseTable;
    }

    private constructSinCosTable(dataLen: number): Array<Float64Array> {
        const sinTable = new Float64Array(dataLen);
        const cosTable = new Float64Array(dataLen);

        for (let i = 0; i < dataLen; i++) {
            sinTable[i] = Math.sin(-Math.PI / i);
            cosTable[i] = Math.cos(-Math.PI / i);
        }

        return [sinTable, cosTable];
    }

    /**
     * Calculate FFT
     */
    public calculation(dataspaceMap: Array<Array<number>>): void {
       if (this.reverseTable == null 
        || dataspaceMap.length !== this.dataLen 
        || this.real == null 
        || this.imag == null
        || this.cosTable == null
        || this.sinTable == null) {
           return;
       }

       // Init the lowest layer
       for (let i = 0; i < this.dataLen; i++) {
           this.real[i] = dataspaceMap[this.reverseTable[i]][0];
           this.imag[i] = dataspaceMap[this.reverseTable[i]][1];
       }

       // Define params
       let halfSize = 1;
       let phaseShiftStepReal, 
           phaseShiftStepImag, 
           currentPhaseShiftReal,
           currentPhaseShiftImag,
           offset,
           tr,
           ti,
           temReal;
        
        while (halfSize < this.dataLen) {
            phaseShiftStepReal = this.cosTable[halfSize];
            phaseShiftStepImag = this.sinTable[halfSize];

            currentPhaseShiftReal = 1;
            currentPhaseShiftImag = 0;

            for (let fftStep = 0; fftStep < halfSize; fftStep++) {
                let startIndex = fftStep;

                while (startIndex < this.dataLen) {
                    offset = startIndex + halfSize;
                    tr = (currentPhaseShiftReal * this.real[offset]) - (currentPhaseShiftImag * this.imag[offset]);
                    ti = (currentPhaseShiftReal * this.imag[offset]) + (currentPhaseShiftImag * this.real[offset]);
                    
                    this.real[offset] = this.real[startIndex] - tr;
                    this.imag[offset] = this.imag[startIndex] - ti;
                    
                    this.real[startIndex] += tr;
                    this.imag[startIndex] += ti;

                    startIndex += halfSize << 1;
                }
                
                temReal = currentPhaseShiftReal;
                currentPhaseShiftReal = (temReal * phaseShiftStepReal) - (currentPhaseShiftImag * phaseShiftStepImag);
                currentPhaseShiftImag = (temReal * phaseShiftStepImag) + (currentPhaseShiftImag * phaseShiftStepReal);
            }

            halfSize = halfSize << 1;
        }
    }

    /**
     * Inverse FFT
     */
    public reverse(data: Array<Array<number>>): void {
        if (this.reverseTable == null 
            || this.cosTable == null
            || this.sinTable == null
            || this.real == null
            || this.imag == null) {
               return;
        }

        if (data.length !== this.dataLen) {throw new Error('Size not match')}

        for (let index = 0; index < this.dataLen; index++) {
            this.real[index] = data[index][0]
            this.imag[index] = data[index][1] * -1;
        }

        const revserReal = new Float64Array(this.dataLen);
        const reverseImag = new Float64Array(this.dataLen);

        for (let index = 0; index < this.dataLen; index++) {
            revserReal[index] = this.real[this.reverseTable[index]];
            reverseImag[index] = this.imag[this.reverseTable[index]];
        }
        
        this.real = revserReal;
        this.imag = reverseImag;

        // Define params
        let halfSize = 1,
            phaseShiftStepReal,
            phaseShiftStepImag,
            currentPhaseShiftReal,
            currentPhaseShiftImag,
            offset,
            tr,
            ti,
            tmpReal;
        
        // Reverse FFT
        while (halfSize < this.dataLen) {
            phaseShiftStepReal = this.cosTable[halfSize];
            phaseShiftStepImag = this.sinTable[halfSize];

            currentPhaseShiftReal = 1;
            currentPhaseShiftImag = 0;

            for (let fftStep = 0; fftStep < halfSize; fftStep++) {
                let startIndex = fftStep;

                while (startIndex < this.dataLen) {
                    offset = startIndex + halfSize;
                    tr = (currentPhaseShiftReal * this.real[offset]) - (currentPhaseShiftImag * this.imag[offset]);
                    ti = (currentPhaseShiftReal * this.imag[offset]) + (currentPhaseShiftImag * this.real[offset]);
                    
                    this.real[offset] = this.real[startIndex] - tr;
                    this.imag[offset] = this.imag[startIndex] - ti;
                    
                    this.real[startIndex] += tr;
                    this.imag[startIndex] += ti;

                    startIndex += halfSize << 1;
                }
                
                tmpReal = currentPhaseShiftReal;
                currentPhaseShiftReal = (tmpReal * phaseShiftStepReal) - (currentPhaseShiftImag * phaseShiftStepImag);
                currentPhaseShiftImag = (tmpReal * phaseShiftStepImag) + (currentPhaseShiftImag * phaseShiftStepReal);
            }

            halfSize = halfSize << 1;
        }
    }

    /**
     * Get value and Spectrum
     */
    public getSpectrum(isFull: boolean = false): Array<Array<number>> | SpectrumResult | null{
        if (this.real == null || this.imag == null) {
            return null;
        }

        const len = this.dataLen;

        const spaceMap = [];
        for (let index = 0; index < len; index++) {
            spaceMap.push([this.real[index], this.imag[index]]);
        }

        if (!isFull) {
            return spaceMap;
        }

        const magnitude = [];
        for(let index = 0; index < len; index++) {
            // Calculate the magnitude
            magnitude.push(
                Math.log((Math.sqrt(this.real[index]**2 + this.imag[index]**2)) + 1)
            );
        }

        return {
            magnitude,
            spaceMap,
        }
    }

    /**
     * Get reverse data
     */
    public getReverseData(isFull: boolean = false): Array<Array<number>> | Float64Array | null {
        if (this.real == null || this.imag == null) {
            return null
        }

        // Return only real part
        if (!!isFull) {
            const data = new Float64Array(this.dataLen);
            for (let index = 0; index < this.dataLen; index++) {
                data[index] = this.real[index] / this.dataLen;
            }
    
            return data;
        }

        // Return both real and imag part
        const data = new Array(this.dataLen).fill(null).map(() => new Array(2));
        for (let index = 0; index < this.dataLen; index++) {
            data[index][0] = this.real[index] / this.dataLen;
            data[index][1] = this.imag[index] / this.dataLen;
        }

        return data;
    }
}