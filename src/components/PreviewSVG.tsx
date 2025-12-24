import React from 'react';

interface PreviewSVGProps {
    svgString: string | null;
}

const PreviewSVG: React.FC<PreviewSVGProps> = ({ svgString }) => {
    return (
        <div className="w-full h-[500px] bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl flex items-center justify-center p-8">
            {svgString ? (
                <div
                    className="w-full h-full flex items-center justify-center rounded-lg overflow-hidden relative"
                    style={{
                        backgroundImage: `linear-gradient(45deg, #1e293b 25%, transparent 25%), 
                             linear-gradient(-45deg, #1e293b 25%, transparent 25%), 
                             linear-gradient(45deg, transparent 75%, #1e293b 75%), 
                             linear-gradient(-45deg, transparent 75%, #1e293b 75%)`,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                        backgroundColor: '#0f172a'
                    }}
                >
                    <div
                        className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto"
                        dangerouslySetInnerHTML={{ __html: svgString }}
                    />
                </div>
            ) : (
                <div className="text-slate-500 pointer-events-none">
                    <p className="text-lg font-medium">Upload an image to see SVG preview</p>
                </div>
            )}
        </div>
    );
};

export default PreviewSVG;
