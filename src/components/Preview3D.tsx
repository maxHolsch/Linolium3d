import React, { useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface Preview3DProps {
    model: THREE.Group | null;
}

const Preview3D: React.FC<Preview3DProps> = ({ model }) => {
    return (
        <div className="w-full h-[500px] bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
            <Canvas shadows dpr={[1, 2]}>
                <Suspense fallback={null}>
                    <PerspectiveCamera makeDefault position={[0, 150, 200]} fov={50} />
                    <Stage environment="city" intensity={0.6} contactShadow={true} shadowBias={-0.0015}>
                        {model && <primitive object={model} />}
                    </Stage>
                    <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
                </Suspense>
            </Canvas>
            {!model && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 pointer-events-none">
                    <p className="text-lg font-medium">Upload an image to see 3D preview</p>
                </div>
            )}
        </div>
    );
};

export default Preview3D;
