import React from 'react';
import { Layers } from 'lucide-react';

interface PreviewSVGProps {
    svgString: string | null;
}

const PreviewSVG: React.FC<PreviewSVGProps> = ({ svgString }) => {
    return (
        <div
            className="w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center p-8 relative bg-usc-black/20"
            style={{
                border: '1px solid rgba(255, 204, 0, 0.2)',
                boxShadow: '0 0 30px rgba(0, 0, 0, 0.3)'
            }}
        >
            {svgString ? (
                <div
                    className="w-full h-full flex items-center justify-center rounded-lg overflow-hidden relative"
                    style={{
                        backgroundImage: `linear-gradient(45deg, rgba(153, 0, 0, 0.05) 25%, transparent 25%), 
                             linear-gradient(-45deg, rgba(153, 0, 0, 0.05) 25%, transparent 25%), 
                             linear-gradient(45deg, transparent 75%, rgba(153, 0, 0, 0.05) 75%), 
                             linear-gradient(-45deg, transparent 75%, rgba(153, 0, 0, 0.05) 75%)`,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                        backgroundColor: 'rgba(17, 17, 17, 0.3)'
                    }}
                >
                    <div
                        className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto"
                        dangerouslySetInnerHTML={{ __html: svgString }}
                    />
                </div>
            ) : (
                <div className="pointer-events-none flex flex-col items-center">
                    <Layers className="w-16 h-16 text-usc-gold/20 mb-4" />
                    <p className="text-lg font-bold text-usc-gold/50 uppercase tracking-widest">Awaiting SVG Vector</p>
                    <p className="text-[10px] text-usc-cardinal font-bold mt-1 uppercase tracking-[0.2em]">Ready for Production</p>
                </div>
            )}
        </div>
    );
};

export default PreviewSVG;
