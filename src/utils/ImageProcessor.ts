import { potrace, init } from 'esm-potrace-wasm';

export interface VectorizedData {
  svgString: string;
  width: number;
  height: number;
}

// Initialize Potrace WASM module once
let potraceInitialized = false;
async function ensurePotraceInit(): Promise<void> {
  if (!potraceInitialized) {
    await init();
    potraceInitialized = true;
  }
}

/**
 * Apply Otsu's thresholding to find optimal binary threshold
 * This is more robust than simple average-based thresholding
 */
function otsuThreshold(imageData: ImageData): number {
  const histogram = new Array(256).fill(0);
  const data = imageData.data;

  // Build grayscale histogram
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    histogram[gray]++;
  }

  const totalPixels = data.length / 4;

  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let maxVariance = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;

    wF = totalPixels - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];

    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const variance = wB * wF * (mB - mF) * (mB - mF);

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }

  return threshold;
}

/**
 * Apply binary thresholding to image data
 */
function applyThreshold(imageData: ImageData, threshold: number): void {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const value = gray > threshold ? 255 : 0;

    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255;
  }
}

/**
 * Invert image colors if the image is mostly dark
 * This ensures dark designs on light backgrounds work correctly
 */
function maybeInvertImage(imageData: ImageData): void {
  const data = imageData.data;
  let blackPixels = 0;
  let whitePixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i] === 0) blackPixels++;
    else whitePixels++;
  }

  // If more black than white, the image might be inverted
  // Potrace traces BLACK regions, so we want the design to be black
  // For a typical logo on white background, we want to trace the logo (dark parts)
  // If the image is mostly black, invert it
  if (blackPixels > whitePixels * 2) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
  }
}

/**
 * Vectorize an image file to SVG using Potrace
 */
export const vectorizeImage = async (file: File): Promise<VectorizedData> => {
  // Ensure Potrace is initialized
  await ensurePotraceInit();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const imgSrc = e.target?.result as string;
      const img = new Image();

      img.onload = async () => {
        try {
          // Scale down large images for performance
          const maxDim = 1024;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = (height / width) * maxDim;
              width = maxDim;
            } else {
              width = (width / height) * maxDim;
              height = maxDim;
            }
          }

          width = Math.round(width);
          height = Math.round(height);

          // Draw image to canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Fill with white background first (for transparent PNGs)
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Get image data and preprocess
          const imageData = ctx.getImageData(0, 0, width, height);

          // Apply Otsu's thresholding for optimal binarization
          const threshold = otsuThreshold(imageData);
          console.log(`[ImageProcessor] Otsu threshold: ${threshold}`);

          applyThreshold(imageData, threshold);

          // Check if we need to invert
          maybeInvertImage(imageData);

          // Put processed image back to canvas for Potrace
          ctx.putImageData(imageData, 0, 0);

          // Use Potrace to vectorize - pass canvas as ImageBitmapSource
          const svg = await potrace(canvas, {
            turdsize: 2,        // Suppress speckles smaller than this
            alphamax: 1.0,      // Corner threshold (0 = sharp, 1.334 = smooth)
            optcurve: true,     // Optimize curves
            opttolerance: 0.2,  // Curve optimization tolerance
            color: '#000000',   // Path fill color
            background: 'transparent'
          });

          // Validate SVG has content
          if (!svg || svg.length < 100) {
            console.warn('[ImageProcessor] SVG appears empty or too small:', svg?.length);
          }

          // Check if SVG has actual path data
          const hasPath = svg.includes('<path') && svg.includes(' d="');
          if (!hasPath) {
            console.warn('[ImageProcessor] SVG has no path elements');
          }

          console.log(`[ImageProcessor] Generated SVG with ${svg.length} characters`);

          resolve({
            svgString: svg,
            width,
            height
          });

        } catch (error) {
          console.error('[ImageProcessor] Vectorization error:', error);
          reject(error);
        }
      };

      img.onerror = (err) => {
        console.error('[ImageProcessor] Image load error:', err);
        reject(new Error('Failed to load image'));
      };

      img.src = imgSrc;
    };

    reader.onerror = (err) => {
      console.error('[ImageProcessor] FileReader error:', err);
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};
