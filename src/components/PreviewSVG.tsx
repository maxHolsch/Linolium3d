import React from 'react';

interface PreviewSVGProps {
    svgString: string | null;
}

const PreviewSVG: React.FC<PreviewSVGProps> = ({ svgString }) => {
    return (
        <div
            className="w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center p-8 relative"
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

            {svgString ? (
                <div
                    className="w-full h-full flex items-center justify-center rounded-lg overflow-hidden relative"
                    style={{
                        backgroundImage: `linear-gradient(45deg, rgba(139, 0, 0, 0.2) 25%, transparent 25%), 
                             linear-gradient(-45deg, rgba(139, 0, 0, 0.2) 25%, transparent 25%), 
                             linear-gradient(45deg, transparent 75%, rgba(139, 0, 0, 0.2) 75%), 
                             linear-gradient(-45deg, transparent 75%, rgba(139, 0, 0, 0.2) 75%)`,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                        backgroundColor: 'rgba(11, 59, 11, 0.3)'
                    }}
                >
                    <div
                        className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto"
                        dangerouslySetInnerHTML={{ __html: svgString }}
                    />
                </div>
            ) : (
                <div className="pointer-events-none flex flex-col items-center">
                    <span className="text-6xl mb-4 animate-bounce">🎁</span>
                    <p className="text-lg font-medium text-yellow-300/80">Upload an image to see SVG preview</p>
                    <p className="text-sm text-green-300/60 mt-1">✨ Unwrap your design! ✨</p>
                </div>
            )}
        </div>
    );
};

export default PreviewSVG;
