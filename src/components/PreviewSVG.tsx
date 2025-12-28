import React, { useState, useRef } from 'react';
import { Layers, Eraser, MousePointer2, Undo2, Redo2 } from 'lucide-react';

interface PreviewSVGProps {
    svgString: string | null;
    onSvgUpdate?: (newSvgString: string) => void;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
}

const PreviewSVG: React.FC<PreviewSVGProps> = ({
    svgString,
    onSvgUpdate,
    onUndo,
    onRedo,
    canUndo,
    canRedo
}) => {
    const [isRemovalMode, setIsRemovalMode] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const svgContainerRef = useRef<HTMLDivElement>(null);

    const removeElement = (element: SVGElement) => {
        const pathElement = element.closest('path, polygon, rect, circle, ellipse') as SVGElement | null;
        if (pathElement && pathElement.ownerSVGElement) {
            pathElement.remove();
            return true;
        }
        return false;
    };

    const handleSvgInteraction = (e: React.MouseEvent) => {
        if (!isRemovalMode || !svgString) return;

        if (removeElement(e.target as SVGElement)) {
            const updatedSvgString = svgContainerRef.current?.querySelector('svg')?.outerHTML;
            if (updatedSvgString && onSvgUpdate) {
                onSvgUpdate(updatedSvgString);
            }
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isRemovalMode) {
            setIsDragging(true);
            handleSvgInteraction(e);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isRemovalMode && isDragging) {
            handleSvgInteraction(e);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div
            className="w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center p-4 relative bg-slate-900/40"
            onMouseLeave={handleMouseUp}
            style={{
                border: '1px solid rgba(255, 204, 0, 0.2)',
                boxShadow: '0 0 30px rgba(0, 0, 0, 0.3)'
            }}
        >
            {svgString && (
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <div className="flex bg-slate-800 rounded-lg p-1 border border-usc-gold/20 mr-2">
                        <button
                            onClick={onUndo}
                            disabled={!canUndo}
                            className={`p-1.5 rounded-md transition-all ${canUndo ? 'text-usc-gold hover:bg-slate-700' : 'text-gray-600 cursor-not-allowed'}`}
                            title="Undo (Ctrl+Z)"
                        >
                            <Undo2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onRedo}
                            disabled={!canRedo}
                            className={`p-1.5 rounded-md transition-all ${canRedo ? 'text-usc-gold hover:bg-slate-700' : 'text-gray-600 cursor-not-allowed'}`}
                            title="Redo (Ctrl+Y)"
                        >
                            <Redo2 className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={() => setIsRemovalMode(false)}
                        className={`p-2 rounded-lg transition-all ${!isRemovalMode ? 'bg-usc-gold text-black shadow-lg' : 'bg-slate-800 text-usc-gold hover:bg-slate-700'}`}
                        title="Selection Mode"
                    >
                        <MousePointer2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsRemovalMode(true)}
                        className={`p-2 rounded-lg transition-all ${isRemovalMode ? 'bg-usc-cardinal text-white shadow-lg' : 'bg-slate-800 text-usc-gold hover:bg-slate-700'}`}
                        title="Removal Mode (Click items to remove)"
                    >
                        <Eraser className="w-4 h-4" />
                    </button>
                </div>
            )}

            {svgString ? (
                <div
                    className="w-full h-full flex items-center justify-center rounded-lg overflow-hidden relative shadow-inner"
                    style={{
                        backgroundColor: '#ffffff',
                    }}
                >
                    <div
                        ref={svgContainerRef}
                        className={`w-full h-full p-8 flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:drop-shadow-sm ${isRemovalMode ? 'cursor-crosshair [&_path:hover]:fill-red-500/50 [&_path:hover]:stroke-red-500 [&_path]:transition-colors [&_path]:cursor-pointer' : ''}`}
                        dangerouslySetInnerHTML={{ __html: svgString }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
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
