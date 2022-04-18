import * as d3 from "d3";

class SelectionBox {
    private svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>;
    private selection: d3.Selection<SVGPathElement, unknown, HTMLElement, any>;
    private boundingArea: Array<Array<number>> | null = null;
    private totalWidth: number;
    private totalHeight: number;

    constructor(svgElement: d3.Selection<d3.BaseType, unknown, HTMLElement, any>, width: number, height: number) {
        this.svg = svgElement;
        this.totalWidth = width;
        this.totalHeight = height;

        // Initial svg path 
        this.selection = svgElement.append("path")
        .attr("class", 'selection')
        .attr("visibility", "hidden");
    }

    private rect(x: number, y: number, width: number, height: number): string {
        return "M" + [x, y] + " l" + [width, 0] + " l" + [0, height] + " l" + [-width, 0] + "z";
    }

    private startSelection(start: [number, number]) {
        this.selection.attr("d", this.rect(start[0], start[0], 0, 0))
        .attr("visibility", "visible");
    }

    private moveSelection (start: [number, number], moved: [number, number]) {
        this.selection.attr("d", this.rect(start[0], start[1], moved[0] - start[0], moved[1] - start[1]));
    }

    private endSelection (start: [number, number], end: [number, number]) {
        this.boundingArea = [start, end];
    }

    // Register mousedown event
    private initialListener() {
        this.svg.on("mousedown", (event) => {
            const start = d3.pointer(event);
            this.startSelection(start);
            this.svg.on("mousemove.selection", (event) => {
                this.moveSelection(start, d3.pointer(event));
            }).on("mouseup.selection", (event) => {
                this.endSelection(start, d3.pointer(event));
                this.svg.on("mousemove.selection", null).on("mouseup.selection", null);
            });
        });
    }


    // Add or Remove the selection listener
    public addOrRemoveSelectionListener(isSelection: boolean): void{
        if (isSelection) {
            this.initialListener();
        } else {
            this.svg.on("mousedown", null);
        }
    }

    /**
     * Return actual bounding area from top_left to bottom_right
     */
    public getBoundingArea(): Array<Array<number>> | null {
        if (this.boundingArea == null) { return null }
        const [start, end] = this.boundingArea;
        
        // Same line
        if (start[0] == end[0] || start[1] == end[1]) {
            return null;
        }

        // Reverse situation
        const minStart = [
            Math.min(start[0], end[0]) / this.totalWidth,
            Math.min(start[1], end[1]) / this.totalHeight,
        ];

        const maxEnd = [
            Math.max(start[0], end[0]) / this.totalWidth,
            Math.max(start[1], end[1]) / this.totalHeight,
        ];

        return [minStart, maxEnd];
    }

    /**
     * Remove rect drawing
     */
    removeRect(): void {
        this.svg.select('.selection')
        .attr('visibility', 'hidden');
    }
}

export default SelectionBox;