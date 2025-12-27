import React, { Suspense } from 'react';
import { Shield } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface Preview3DProps {
    model: THREE.Group | null;
}

const Preview3D: React.FC<Preview3DProps> = ({ model }) => {
    return (
        <div
            className="w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl relative bg-usc-black/20"
            style={{
                border: '1px solid rgba(255, 204, 0, 0.2)',
                boxShadow: '0 0 30px rgba(0, 0, 0, 0.3)'
            }}
        >
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
                    <Shield className="w-16 h-16 text-usc-gold/20 mb-4" />
                    <p className="text-lg font-bold text-usc-gold/50 uppercase tracking-widest">Awaiting Design Upload</p>
                    <p className="text-[10px] text-usc-cardinal font-bold mt-1 uppercase tracking-[0.2em]">Fight On!</p>
                </div>
            )}
        </div>
    );
};

export default Preview3D;
