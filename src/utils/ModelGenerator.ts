import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

export const create3DModel = (svgString: string, extrusionDepth: number = 3, baseThickness: number = 2) => {
    const loader = new SVGLoader();
    const svgData = loader.parse(svgString);
    const paths = svgData.paths;
    const group = new THREE.Group();

    if (paths.length === 0) {
        console.warn('No paths found in SVG string');
        return group;
    }

    // Find bounding box to center and scale
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

    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = minX + width / 2;
    const centerY = minY + height / 2;

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
            });

            // Center the geometry
            geometry.translate(-centerX, -centerY, 0);

            const material = new THREE.MeshStandardMaterial({ color: 0x808080 }); // Grey
            const mesh = new THREE.Mesh(geometry, material);
            group.add(mesh);
        });
    });

    // Add base plate
    const baseGeometry = new THREE.BoxGeometry(width + 10, height + 10, baseThickness);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 }); // Black
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);

    // Position base below the extrusion
    baseMesh.position.z = -baseThickness / 2;
    group.add(baseMesh);

    // Rotate group to lay flat on XY plane (standard for 3D printing)
    group.rotation.x = -Math.PI / 2;

    return group;
};
