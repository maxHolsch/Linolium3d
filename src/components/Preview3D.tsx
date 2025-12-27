import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface Preview3DProps {
    model: THREE.Group | null;
}

const Preview3D: React.FC<Preview3DProps> = ({ model }) => {
    return (
        <div
            className="w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl relative"
            style={{
                background: 'linear-gradient(145deg, rgba(11, 59, 11, 0.4) 0%, rgba(139, 0, 0, 0.3) 100%)',
                border: '2px solid rgba(255, 215, 0, 0.3)',
                boxShadow: '0 0 30px rgba(196, 30, 58, 0.2), 0 0 60px rgba(34, 139, 34, 0.1)'
            }}
        >
            {/* Corner decorations */}
            <div className="absolute top-2 left-2 text-xl opacity-60 z-10">🎄</div>
            <div className="absolute top-2 right-2 text-xl opacity-60 z-10">⭐</div>
            <div className="absolute bottom-2 left-2 text-xl opacity-60 z-10">🎁</div>
            <div className="absolute bottom-2 right-2 text-xl opacity-60 z-10">❄️</div>

            <Canvas shadows dpr={[1, 2]}>
                <Suspense fallback={null}>
                    <PerspectiveCamera makeDefault position={[0, 150, 200]} fov={50} />
                    <Stage environment="city" intensity={0.6} shadows={{ type: 'contact', opacity: 0.5, blur: 2 }}>
                        {model && <primitive object={model} />}
                    </Stage>
                    <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
                </Suspense>
            </Canvas>
            {!model && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-6xl mb-4 animate-bounce">🎅</span>
                    <p className="text-lg font-medium text-yellow-300/80">Upload an image to see 3D preview</p>
                    <p className="text-sm text-green-300/60 mt-1">🎄 Create holiday magic! 🎄</p>
                </div>
            )}
        </div>
    );
};

export default Preview3D;
