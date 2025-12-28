import cv2
import vtracer
import os

try:
    img = cv2.imread("SampleImage.jpeg")
    if img is None:
        print("SampleImage.jpeg not found")
        exit(1)
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, processed = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY)
    
    cv2.imwrite("test_input.png", processed)
    print("test_input.png written")
    
    vtracer.convert_image_to_svg_py(
        "test_input.png",
        "test_output.svg",
        colormode="binary",
        filter_speckle=2,
        corner_threshold=60,
        path_precision=3
    )
    print("test_output.svg written")
    print(f"File exists: {os.path.exists('test_output.svg')}")
except Exception as e:
    print(f"Test failed: {e}")
