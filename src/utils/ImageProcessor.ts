import ImageTracer from 'imagetracerjs';

export interface VectorizedData {
  svgString: string;
  width: number;
  height: number;
}

export const vectorizeImage = (file: File): Promise<VectorizedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgSrc = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          // Scale down if image is too large to avoid performance issues
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
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Grayscale and Contrast enhancement
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;

          // Calculate average brightness for adaptive thresholding
          let totalBrightness = 0;
          for (let i = 0; i < data.length; i += 4) {
            totalBrightness += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          }
          const avgBrightness = totalBrightness / (data.length / 4);

          // Use average as threshold, but clamp it to avoid pure black/white results
          const threshold = Math.max(30, Math.min(225, avgBrightness));

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            let gray = 0.299 * r + 0.587 * g + 0.114 * b;

            // Binary thresholding based on average
            gray = gray > threshold ? 255 : 0;

            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
            data[i + 3] = 255; // Ensure alpha is fully opaque
          }
          ctx.putImageData(imageData, 0, 0);

          const options = {
            ltres: 0.5,
            qtres: 0.5,
            pathomit: 0, // Keep all paths, even tiny ones
            rightangleenhance: true,
            colorsampling: 1,
            numberofcolors: 2,
            mincolorratio: 0.001,
            colorquantcycles: 1,
            scale: 1,
            simplifytolerance: 0,
            roundcoords: 1,
            lcpr: 0,
            qcpr: 0,
            desc: false,
            viewbox: true
          };

          const svgString = ImageTracer.imagedataToSVG(imageData, options);

          resolve({
            svgString,
            width: width,
            height: height
          });
        } catch (error) {
          console.error('Vectorization error:', error);
          reject(error);
        }
      };
      img.onerror = (err) => {
        console.error('Image load error:', err);
        reject(new Error('Failed to load image'));
      };
      img.src = imgSrc;
    };
    reader.onerror = (err) => {
      console.error('FileReader error:', err);
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
};
