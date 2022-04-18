import * as d3 from "d3";

enum FilterType {
    LowPass = 'LowPass',
    HighPass = 'HighPass',
}

class SelectionFilter {
    private svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>;
    private lowPassCircle: d3.Selection<SVGCircleElement, unknown, HTMLElement, any>;
    private highPassCircle: d3.Selection<SVGCircleElement, unknown, HTMLElement, any>;
    private lowPassRadius: number = 0;
    private highPassRadius: number = 0;
    private totalWidth: number;
    private totalHeight: number;
    private maxRadius: number;

    constructor(svgElement: d3.Selection<d3.BaseType, unknown, HTMLElement, any>, width: number, height: number) {
        this.svg = svgElement;
        this.totalWidth = width;
        this.totalHeight = height;
        this.maxRadius = Math.floor(Math.min(this.totalWidth, this.totalHeight) / 2);

        // Initial svg path
        const centerX = width / 2;
        const cenetY = height / 2;

        this.lowPassCircle = svgElement.append("circle")
        .attr("class", 'lowPassCircle')
        .attr("visibility", "hidden")
        .attr("cx", centerX)
        .attr("cy", cenetY)
        .attr("r", this.lowPassRadius);

        this.highPassCircle = svgElement.append("circle")
        .attr("class", 'highPassCircle')
        .attr("visibility", "hidden")
        .attr("cx", centerX)
        .attr("cy", cenetY)
        .attr("r", this.highPassRadius);

        // Init event handler
        this.initialListener();
    }

    private recieveInput(lowPassPx: number, highPassPx: number) {
        return null;
    }

    // Register mousedown event
    private initialListener() {

    }

    /**
     * Draw the circle according to the filter type
     */
    public drawCircle(filterType: FilterType, value: number) {
        if (value > this.maxRadius) {
            value = this.maxRadius;
        }

        if (value < 0) {
            value = 0;
        }

        // Draw low pass circle
        if (filterType == FilterType.LowPass) {
            this.lowPassRadius = Math.min(value, this.highPassRadius);
            this.lowPassCircle.attr('r', this.lowPassRadius);
        }

        // Draw high pass circle
        if (filterType == FilterType.HighPass) {
            this.highPassRadius = Math.max(value, this.lowPassRadius);
            this.highPassCircle.attr('r', this.highPassRadius);
        }
    }

    /**
     * Display cirlce or hide the circle
     */
    public displayCircle(isDisplay: boolean) {
        this.lowPassCircle.attr("visibility", isDisplay ? "visible" : "hidden");
        this.highPassCircle.attr("visibility", isDisplay ? "visible" : "hidden")
    }

    /**
     * Get scaled bounding area, eg. the range of distance to the center
     * Here it defined by the max edge of the svg
     */
    public getBoundingArea(): Array<number> | null{
        if (this.lowPassRadius == this.highPassRadius) {
            return null;
        }

        const refEdge = Math.min(this.totalHeight, this.totalWidth);
        let lowScaledRatio = this.lowPassRadius / refEdge;
        let highScaledRatio = this.highPassRadius / refEdge;

        lowScaledRatio = lowScaledRatio > 0.5 ? 0.5 : lowScaledRatio;
        highScaledRatio = highScaledRatio > 0.5 ? 0.5 : highScaledRatio;
        
        return [lowScaledRatio, highScaledRatio];
    }   
}

export { FilterType, SelectionFilter }