declare module 'imagetracerjs' {
    const ImageTracer: {
        imageToSVG: (url: string, callback: (svg: string) => void, options?: any) => void;
        imagedataToSVG: (imageData: ImageData, options?: any) => string;
        // Add other methods if needed
    };
    export default ImageTracer;
}
