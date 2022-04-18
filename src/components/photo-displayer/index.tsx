import { useEffect, useRef, useState } from "react";
import { Imager } from "@/utils/image";
import { Eventer } from "@/utils/eventer";
import { GlobalEventName } from "@/global/global-defination";
import SelectionBox from "@/utils/selectionBox";
import { FilterType, SelectionFilter } from "@/utils/selectionFilter";
import * as d3 from "d3";
import './index.css';

// Define render callback
const renderCallback = () => {
    // Draw the image on canvas
    const canvasElement = document.getElementById('photoDisplayer');
    if (canvasElement == null) { return }

    // Draw the shrinked image first
    Imager.drawImage(canvasElement as HTMLCanvasElement, Imager.imageData)
    .then(() => {
        // Set Shrinked image data
        Imager.setShrinkedImageData(canvasElement as HTMLCanvasElement, true);

        // Draw gray
        Imager.getGrayChannel(true);
        const grayCanvasElement = document.getElementById('grayDisplayer');
        if (grayCanvasElement == null) { return }
        Imager.drawImage(
            grayCanvasElement as HTMLCanvasElement, 
            Imager.shrinkedGrayChannel,
            Imager.shrinkedImageData?.width,
            Imager.shrinkedImageData?.height,
            Imager.shrinkedAlphaChannel as Uint8ClampedArray,
        );
        
        // Draw FFT image
        const time1 = new Date().getTime();
        Imager.imageFFT2(false, true, true)
        .then(() => {
            console.log('Success here, use time', new Date().getTime() - time1);
            
            // Draw kSpace data 
            const kSpaceCanvasElement = document.getElementById('kSpaceDisplayer');
            if (kSpaceCanvasElement == null) { return }
            Imager.drawImage(
                kSpaceCanvasElement as HTMLCanvasElement,
                Imager.kSpaceData,
            );

            // Do reverse fft
            return Imager.imageInversedFFT2()
        })
        .then(() => {
            console.log('Success when inverse done, use time', new Date().getTime() - time1);
            // Draw Inverse
            const inverseFFTCanvasElement = document.getElementById('inverseFFTDisplayer');
            if (inverseFFTCanvasElement== null) { return }
            Imager.drawImage(
                inverseFFTCanvasElement as HTMLCanvasElement,
                Imager.inversedGrayChannel,
                Imager.kSpaceMap.width,
                Imager.kSpaceMap.height,
                Imager.kSpaceMap.alphaChannel as Uint8ClampedArray,
            );
        })
        .catch((error) => {
            console.log(error);
        });
    });
}

// Register render callback
Eventer.addEventListener(GlobalEventName.ImageDataChanged, renderCallback)


const PhotoDisplayer = () => {
    const [isSelection, setSelection] = useState(false);
    const [isFilter, setFilter] = useState(false);
    const [isFFT, setFFT] = useState(true);
    const transform = useRef<(isColor: boolean, isShrinked: boolean, isShifted: boolean) => Promise<void>>(Imager.imageFFT2);
    const reverse = useRef<(kSpaceMapData: Array<Array<number>> | null) => Promise<void>>(Imager.imageInversedFFT2);
    const selectionBox = useRef<SelectionBox>();
    const selectionFilter = useRef<SelectionFilter>();

    // Set SVG height and width
    useEffect(() => {
        const canvas = d3.select('#kSpaceDisplayer').node();
        if (canvas == null) { return }
        const boundingBox = (canvas as HTMLElement).getBoundingClientRect()
        const width = boundingBox.width;
        const height = boundingBox.height;
        
        const svg = d3.select('#selectionSVG')
        .attr("width", width)
        .attr("height", height);

        // Register svg object entity
        selectionBox.current = new SelectionBox(svg, width, height);
        selectionFilter.current = new SelectionFilter(svg, width, height);
    }, []);

    // Selection
    const handleSelectionButton = () => {
        // Set selection and filter status
        setSelection(!isSelection);
        setFilter(false);

        // Remove or Add the listener of drawing
        selectionBox.current?.addOrRemoveSelectionListener(!isSelection);
        selectionFilter.current?.displayCircle(false);

        
        // If it confirms the selection, then we draw the inversed image
        if (isSelection) {
            const mask = selectionBox.current?.getBoundingArea();
            if (mask == null) { return }
            const spaceMapData = Imager.getKSpaceMapDataWithMask(mask[0], mask[1]);
            if (spaceMapData == null) { return }

            // Draw the reversed image
            const inverseFFTCanvasElement = document.getElementById('inverseFFTDisplayer');
            if (inverseFFTCanvasElement == null) { return }
            Imager.imageInversedFFT2(spaceMapData)
            .then(() => {
                Imager.drawImage(
                    inverseFFTCanvasElement as HTMLCanvasElement,
                    Imager.inversedGrayChannel,
                    Imager.kSpaceMap.width,
                    Imager.kSpaceMap.height,
                    Imager.kSpaceMap.alphaChannel as Uint8ClampedArray,
                );
            })
            .catch((error) => {
                console.log(error);
            })
        }
    }

    // Circle Filter
    const handleFilterButton = () => {
        // Set filter and selection status
        setFilter(!isFilter);
        setSelection(false);

        // Remove the selection box listener and its drawing
        selectionBox.current?.addOrRemoveSelectionListener(false);
        selectionBox.current?.removeRect();

        // If confirms the filter, we draw the reversed image
        if (isFilter) {
            const filter = selectionFilter.current?.getBoundingArea();
            if (filter == null) { return }
            
            // Get masked space map data
            const spaceMapData = Imager.getKSpaceMapDataWithFilter(filter);
            if (spaceMapData == null) { return }

            // Draw the reversed image
            const inverseFFTCanvasElement = document.getElementById('inverseFFTDisplayer');
            if (inverseFFTCanvasElement == null) { return }

            Imager.imageInversedFFT2(spaceMapData)
            .then(() => {
                Imager.drawImage(
                    inverseFFTCanvasElement as HTMLCanvasElement,
                    Imager.inversedGrayChannel,
                    Imager.kSpaceMap.width,
                    Imager.kSpaceMap.height,
                    Imager.kSpaceMap.alphaChannel as Uint8ClampedArray,
                );
            })
            .catch((error) => {
                console.log(error);
            })
        } else {
            selectionFilter.current?.displayCircle(true);
        }
    }

    // Handle circle filter change
    const handleCircleFilterChange = (type: FilterType, value: string) => {
        const valueNum = parseInt(value);
        selectionFilter.current?.drawCircle(type, valueNum);
    }

    // Handle FFT Switch
    const handleFFTSwitch = () => {
        if (!!isFFT) {
            transform.current = Imager.imageFFT2;
            reverse.current = Imager.imageInversedFFT2
        } else {
            transform.current = Imager.imageFT2;
            reverse.current = Imager.imageInversedFT2;
        }

        setFFT(!isFFT);
    }

    return (
        <div className="displayer-wraper">
            <div className="first-row-displayer">
                {/* <div className="switch-wrap">
                    <Switch checkedChildren="FFT" unCheckedChildren="DFT" checked={isFFT} onChange={handleFFTSwitch}/>
                </div> */}
                <canvas id="photoDisplayer"></canvas>
                <div className="midvline"></div>
                <canvas id="grayDisplayer"></canvas>
            </div>
            <div className="midhline"></div>
            <div className="second-row-displayer">
                <svg className="selection-svg" id="selectionSVG"></svg>
                <div className="buttons-wrap">
                    <div className={isSelection ? "selection-button-done" : "selection-button"} onClick={handleSelectionButton}>
                    </div>
                    <div className="filter-wrap">
                        <div className={isFilter ? "filter-button-done" : "filter-button"} onClick={handleFilterButton}></div>
                        <div className="filter-input" style={{
                            opacity: isFilter? '1' : '0'
                        }}>
                             <div>
                                High Pass:
                                <input type="number" style={{width: '40px'}} onChange={(event) => { handleCircleFilterChange(FilterType.HighPass, event.target.value)}}/>
                            </div>
                            <div>
                                Low Pass:
                                <input type="number" style={{width: '40px'}} onChange={(event) => { handleCircleFilterChange(FilterType.LowPass, event.target.value)}}/>
                            </div>
                        </div>
                    </div>
                </div>
               
                <canvas id="kSpaceDisplayer"></canvas>
                <div className="midvline"></div>
                <canvas id="inverseFFTDisplayer"></canvas>
            </div>
        </div>
    )
}

export default PhotoDisplayer;

