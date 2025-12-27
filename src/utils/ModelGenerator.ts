import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

// Conversion: 1 inch = 25.4 mm
const INCH_TO_MM = 25.4;

export interface ModelDimensions {
    targetWidthInches: number;   // Width in inches (X dimension)
    targetLengthInches: number;  // Length in inches (Y dimension)
    extrusionDepthMm: number;    // Extrusion height in mm
    baseThicknessMm: number;     // Base plate thickness in mm
    curveSegments: number;       // Number of segments for curves (lower = fewer triangles)
}

export const create3DModel = (
    svgString: string,
    dimensions: ModelDimensions = {
        targetWidthInches: 4,
        targetLengthInches: 5,
        extrusionDepthMm: 3,
        baseThicknessMm: 3,
        curveSegments: 4  // Low default for fewer triangles (~295k or less)
    }
) => {
    const loader = new SVGLoader();
    const svgData = loader.parse(svgString);
    const paths = svgData.paths;
    const group = new THREE.Group();

    if (paths.length === 0) {
        console.warn('No paths found in SVG string');
        return group;
    }

    // Convert target dimensions from inches to mm
    const targetWidthMm = dimensions.targetWidthInches * INCH_TO_MM;
    const targetLengthMm = dimensions.targetLengthInches * INCH_TO_MM;
    const extrusionDepth = dimensions.extrusionDepthMm;
    const baseThickness = dimensions.baseThicknessMm;
    const curveSegments = dimensions.curveSegments;

    // Find bounding box of SVG to determine scale
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    paths.forEach(path => {
        const shapes = SVGLoader.createShapes(path);
        shapes.forEach(shape => {
            const box = new THREE.Box2().setFromPoints(shape.getPoints());
            minX = Math.min(minX, box.min.x);
            minY = Math.min(minY, box.min.y);
            maxX = Math.max(maxX, box.max.x);
            maxY = Math.max(maxY, box.max.y);
        });
    });

    if (minX === Infinity) {
        console.warn('Could not determine bounding box for SVG shapes');
        return group;
    }

    const svgWidth = maxX - minX;
    const svgHeight = maxY - minY;
    const centerX = minX + svgWidth / 2;
    const centerY = minY + svgHeight / 2;

    // Calculate scale factor to fit SVG within target dimensions while preserving aspect ratio
    // This ensures full fidelity - the SVG is scaled uniformly
    const scaleX = targetWidthMm / svgWidth;
    const scaleY = targetLengthMm / svgHeight;
    const scaleFactor = Math.min(scaleX, scaleY); // Use smaller scale to fit within bounds

    let totalTriangles = 0;

    // Extrude each path
    paths.forEach((path) => {
        // Filter out background paths (lighter colors)
        // ImageTracer with 2 colors usually produces one dark and one light
        const color = path.color;
        const brightness = (color.r + color.g + color.b) / 3;
        if (brightness > 0.5) return;

        const shapes = SVGLoader.createShapes(path);
        shapes.forEach((shape) => {
            const geometry = new THREE.ExtrudeGeometry(shape, {
                depth: extrusionDepth,
                bevelEnabled: false,
                curveSegments: curveSegments,  // Controls curve smoothness/triangle count
                steps: 1  // Single step for extrusion depth
            });

            // Center the geometry first
            geometry.translate(-centerX, -centerY, 0);

            // Scale to target dimensions (uniform scaling preserves fidelity)
            geometry.scale(scaleFactor, scaleFactor, 1);

            // Move extrusion UP to sit on top of the base plate
            // Base goes from 0 to baseThickness, extrusion from baseThickness to baseThickness+extrusionDepth
            geometry.translate(0, 0, baseThickness);

            // Count triangles
            const triangleCount = geometry.attributes.position.count / 3;
            totalTriangles += triangleCount;

            const material = new THREE.MeshStandardMaterial({ color: 0x808080 }); // Grey
            const mesh = new THREE.Mesh(geometry, material);
            group.add(mesh);
        });
    });

    // Add base plate sized to the target dimensions
    // Base matches the specified dimensions exactly
    const baseGeometry = new THREE.BoxGeometry(targetWidthMm, targetLengthMm, baseThickness);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 }); // Black
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);

    // Position base so it goes from Z=0 to Z=baseThickness (bottom of model)
    // Extrusion sits on top from Z=baseThickness to Z=baseThickness+extrusionDepth
    baseMesh.position.z = baseThickness / 2;
    group.add(baseMesh);

    // Log triangle count for debugging
    totalTriangles += 12; // Base box has 12 triangles (6 faces × 2 triangles)
    console.log(`Model generated with approximately ${totalTriangles} triangles`);

    // Rotate group to lay flat on XY plane (standard for 3D printing)
    group.rotation.x = -Math.PI / 2;

    return group;
};

