import io
import cv2
import numpy as np
import vtracer
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def otsu_threshold(gray):
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return thresh

def apply_median_filter(gray):
    return cv2.medianBlur(gray, 3)

def apply_adaptive_threshold(gray):
    return cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )

@app.post("/vectorize")
async def vectorize(
    file: UploadFile = File(...),
    turdsize: int = Form(2),
    alphamax: float = Form(1.0),
    optcurve: bool = Form(True),
    opttolerance: float = Form(0.2),
    threshold: int = Form(128),
    manualThreshold: bool = Form(False),
    algorithm: str = Form("otsu")
):
    import os
    import traceback
    
    # Use absolute paths for temp files to avoid any ambiguity
    base_dir = os.path.dirname(os.path.abspath(__file__))
    temp_input = os.path.join(base_dir, "temp_input.png")
    temp_output = os.path.join(base_dir, "temp_output.svg")
    
    try:
        # Read image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {"error": "Invalid image data"}

        # Separate Alpha channel if exists
        if img.shape[2] == 4:
            alpha = img[:, :, 3]
            mask = alpha < 128
            img[mask] = [255, 255, 255, 255]
            img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Apply algorithm
        if algorithm == "adaptive":
            processed = apply_adaptive_threshold(gray)
        else:
            if algorithm == "median-otsu":
                gray = apply_median_filter(gray)
            
            if manualThreshold:
                _, processed = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)
            else:
                processed = otsu_threshold(gray)

        # Ensure design is black for Potrace/vtracer
        black_pixels = np.sum(processed == 0)
        white_pixels = np.sum(processed == 255)
        if black_pixels > white_pixels * 2:
            processed = cv2.bitwise_not(processed)

        # Save processed image for vtracer
        is_success, buffer = cv2.imencode(".png", processed)
        if not is_success:
            return {"error": "Failed to encode image"}
        
        with open(temp_input, "wb") as f:
            f.write(buffer)
            
        print(f"Processing image with algorithm={algorithm}, turdsize={turdsize}")
        
        vtracer.convert_image_to_svg_py(
            temp_input,
            temp_output,
            colormode="binary",
            filter_speckle=int(turdsize),
            corner_threshold=int(alphamax * 60),
            path_precision=3
        )
        
        if not os.path.exists(temp_output):
            return {"error": "vtracer failed to generate SVG output"}

        with open(temp_output, "r") as f:
            svg_string = f.read()
            
        # Modernize SVG for web: ensure viewBox is set and it scales fluidly
        import re
        width = img.shape[1]
        height = img.shape[0]
        
        svg_tag_match = re.search(r'<svg([^>]*)>', svg_string)
        if svg_tag_match:
            attrs = svg_tag_match.group(1)
            attrs = re.sub(r'\s+(width|height|viewBox|style)="[^"]*"', '', attrs)
            new_tag = f'<svg{attrs} width="100%" height="100%" viewBox="0 0 {width} {height}" preserveAspectRatio="xMidYMid meet" style="display:block;margin:auto;">'
            svg_string = svg_string.replace(svg_tag_match.group(0), new_tag, 1)
            
        return {
            "svgString": svg_string,
            "width": width,
            "height": height
        }
    except Exception as e:
        print(f"ERROR during vectorization: {str(e)}")
        traceback.print_exc()
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
