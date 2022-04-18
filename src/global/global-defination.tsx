export enum GlobalEventName {
    ParseImage = 'ParseImage',
    ImageDataChanged = 'ImageDataChanged',
    SelectionConfirmed = 'SelectionConfirmed',
}

export enum RGBCoeffcients {
    r = 0.299,
    g = 0.587,
    b = 0.114,
}

export interface Channel2ImageData {
    channel: Uint8ClampedArray;
    width: number;
    height: number;
    alpha: Uint8ClampedArray;
}

export const ChannelSplitSectionNum = 10;