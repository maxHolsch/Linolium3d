export interface VectorizedData {
  svgString: string;
  width: number;
  height: number;
}

export type SegmentationAlgorithm = 'otsu' | 'median-otsu' | 'adaptive';

export interface VectorizationOptions {
  turdsize: number;
  alphamax: number;
  optcurve: boolean;
  opttolerance: number;
  threshold: number;
  manualThreshold: boolean;
  algorithm: SegmentationAlgorithm;
}

/**
 * Vectorize an image file using the local Python backend
 */
export const vectorizeImage = async (file: File, options?: VectorizationOptions): Promise<VectorizedData> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('turdsize', (options?.turdsize ?? 2).toString());
  formData.append('alphamax', (options?.alphamax ?? 1.0).toString());
  formData.append('optcurve', (options?.optcurve ?? true).toString());
  formData.append('opttolerance', (options?.opttolerance ?? 0.2).toString());
  formData.append('threshold', (options?.threshold ?? 128).toString());
  formData.append('manualThreshold', (options?.manualThreshold ?? false).toString());
  formData.append('algorithm', options?.algorithm ?? 'otsu');

  try {
    const response = await fetch('http://localhost:8000/vectorize', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${errorText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      svgString: data.svgString,
      width: data.width,
      height: data.height,
    };
  } catch (error) {
    console.error('[ImageProcessor] Backend vectorization error:', error);
    throw error;
  }
};
