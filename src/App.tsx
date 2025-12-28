import { useState, useCallback } from 'react';
import * as THREE from 'three';
import { Upload, Box, FileCode, Loader2, Layers, Shield, Sword, Trophy, Brain, Minus, Plus } from 'lucide-react';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { vectorizeImage } from './utils/ImageProcessor';
import type { VectorizationOptions } from './utils/ImageProcessor';
import { create3DModel } from './utils/ModelGenerator';
import type { ModelDimensions } from './utils/ModelGenerator';
import { generateGCode } from './utils/GCodeGenerator';
import Preview3D from './components/Preview3D';
import PreviewSVG from './components/PreviewSVG';

type ViewMode = 'svg' | '3d';



function App() {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [svgString, setSvgString] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // SVG History for Undo/Redo
  const [svgHistory, setSvgHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Vectorization options
  const [vectorOptions, setVectorOptions] = useState<VectorizationOptions>({
    turdsize: 2,
    alphamax: 1.0,
    optcurve: true,
    opttolerance: 0.2,
    threshold: 128,
    manualThreshold: false,
    algorithm: 'otsu'
  });

  // Dimension controls
  const [dimensions, setDimensions] = useState<ModelDimensions>({
    targetLengthInches: 5,      // Y dimension - 5 inches
    targetWidthInches: 4,       // X dimension - 4 inches
    baseThicknessMm: 3,         // Base thickness - 3mm
    extrusionDepthMm: 3,        // Extrusion depth - 3mm
    curveSegments: 4,           // Low for fewer triangles (~295k or less)
  });

  const updateDimension = (key: keyof ModelDimensions, value: number) => {
    setDimensions(prev => ({ ...prev, [key]: value }));
  };

  // Regenerate model when dimensions change
  const regenerateModel = useCallback(() => {
    if (svgString) {
      const newModel = create3DModel(svgString, dimensions);
      setModel(newModel);
    }
  }, [svgString, dimensions]);

  // History helpers
  const pushToHistory = useCallback((newSvg: string) => {
    setSvgHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newSvg);
      // Limit history to 50 items
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => {
      const newIdx = Math.min(prev + 1, 49);
      return newIdx;
    });
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const prevSvg = svgHistory[newIndex];
      setSvgString(prevSvg);
      setHistoryIndex(newIndex);
      const newModel = create3DModel(prevSvg, dimensions);
      setModel(newModel);
    }
  }, [historyIndex, svgHistory, dimensions]);

  const redo = useCallback(() => {
    if (historyIndex < svgHistory.length - 1) {
      const newIndex = historyIndex + 1;
      const nextSvg = svgHistory[newIndex];
      setSvgString(nextSvg);
      setHistoryIndex(newIndex);
      const newModel = create3DModel(nextSvg, dimensions);
      setModel(newModel);
    }
  }, [historyIndex, svgHistory, dimensions]);

  // Re-vectorize when options change
  const reVectorize = useCallback(async (optionsOverride?: VectorizationOptions) => {
    if (!uploadedFile) return;
    setIsProcessing(true);
    try {
      const optionsToUse = optionsOverride || vectorOptions;
      const { svgString: vectorizedSvg } = await vectorizeImage(uploadedFile, optionsToUse);
      setSvgString(vectorizedSvg);
      setSvgHistory([vectorizedSvg]);
      setHistoryIndex(0);
      const newModel = create3DModel(vectorizedSvg, dimensions);
      setModel(newModel);
    } catch (err: any) {
      setError(err.message || 'Failed to re-process image.');
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedFile, vectorOptions, dimensions]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsProcessing(true);
    setError(null);

    try {
      const { svgString: vectorizedSvg } = await vectorizeImage(file, vectorOptions);
      setSvgString(vectorizedSvg);
      setSvgHistory([vectorizedSvg]);
      setHistoryIndex(0);
      const newModel = create3DModel(vectorizedSvg, dimensions);
      setModel(newModel);
      setViewMode('3d');
    } catch (err: any) {
      setError(err.message || 'Failed to process image. Please try a different file.');
    } finally {
      setIsProcessing(false);
    }
  }, [dimensions, vectorOptions]);

  const downloadSTL = () => {
    if (!model) return;
    const exporter = new STLExporter();
    const result = exporter.parse(model, { binary: true });
    const blob = new Blob([result], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'block_print.stl';
    link.click();
  };

  const downloadGCode = () => {
    if (!model) return;
    const gcode = generateGCode(model);
    const blob = new Blob([gcode], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'block_print.gcode';
    link.click();
  };

  return (
    <div className="min-h-screen text-white font-sans selection:bg-red-800/30 overflow-x-hidden" style={{ background: 'linear-gradient(180deg, #1a0202 0%, #000000 50%, #1a0202 100%)' }}>

      <header className="usc-header sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tighter gold-shimmer italic">LINOLIUM3D</h1>
              <p className="text-[10px] text-usc-gold/80 font-bold tracking-[0.2em] uppercase">3D Block Print Generator</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-2xl hover:scale-110 transition-transform cursor-default">✌️</span>
            <a href="https://github.com" className="text-xs font-bold text-usc-gold hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest">
              <Brain className="w-3.5 h-3.5" />
              Docs
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-24 relative mt-8">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
          {/* Left Column: Controls */}
          <div className="lg:col-span-3 space-y-8">
            <section className="space-y-4 usc-card rounded-2xl p-6">
              <h2 className="text-lg font-bold text-usc-gold flex items-center gap-2 uppercase tracking-tight">
                <Shield className="w-5 h-5" /> 1. Upload Design
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                Upload your logo or custom artwork. We'll vectorize and extrude it for a custom 3D print!
              </p>
              <label className="relative group cursor-pointer block">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                />
                <div className="border-2 border-dashed border-usc-cardinal/30 group-hover:border-usc-gold/50 rounded-xl p-8 transition-all duration-300 flex flex-col items-center justify-center gap-3" style={{ background: 'linear-gradient(145deg, rgba(153, 0, 0, 0.05) 0%, rgba(255, 204, 0, 0.05) 100%)' }}>
                  {isProcessing ? (
                    <Loader2 className="w-8 h-8 text-usc-gold animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 text-usc-cardinal group-hover:text-usc-gold transition-colors" />
                  )}
                  <span className="text-sm font-bold text-gray-300 group-hover:text-usc-gold uppercase tracking-wider">
                    {isProcessing ? 'Processing...' : 'Click to upload design'}
                  </span>
                </div>
              </label>
              {error && <p className="text-xs text-red-400 mt-2">❌ {error}</p>}
            </section>

            {/* Dimension Controls */}
            <section className="space-y-4 usc-card rounded-2xl p-6">
              <h2 className="text-lg font-bold text-usc-gold flex items-center gap-2 uppercase tracking-tight">
                <Sword className="w-5 h-5" /> 2. Print Specs
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Length (in)</label>
                    <input
                      type="number"
                      min="0.5"
                      max="20"
                      step="0.5"
                      value={dimensions.targetLengthInches}
                      onChange={(e) => updateDimension('targetLengthInches', parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-usc-gold focus:border-transparent transition-all"
                      style={{ background: 'rgba(153, 0, 0, 0.1)', border: '1px solid rgba(255, 204, 0, 0.2)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Width (in)</label>
                    <input
                      type="number"
                      min="0.5"
                      max="20"
                      step="0.5"
                      value={dimensions.targetWidthInches}
                      onChange={(e) => updateDimension('targetWidthInches', parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-usc-gold focus:border-transparent transition-all"
                      style={{ background: 'rgba(153, 0, 0, 0.1)', border: '1px solid rgba(255, 204, 0, 0.2)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Base (mm)</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      step="0.5"
                      value={dimensions.baseThicknessMm}
                      onChange={(e) => updateDimension('baseThicknessMm', parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-usc-gold focus:border-transparent transition-all"
                      style={{ background: 'rgba(153, 0, 0, 0.1)', border: '1px solid rgba(255, 204, 0, 0.2)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Extrusion (mm)</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      step="0.5"
                      value={dimensions.extrusionDepthMm}
                      onChange={(e) => updateDimension('extrusionDepthMm', parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-usc-gold focus:border-transparent transition-all"
                      style={{ background: 'rgba(153, 0, 0, 0.1)', border: '1px solid rgba(255, 204, 0, 0.2)' }}
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-usc-gold/10">
                  <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Detail Level</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="12"
                      step="1"
                      value={dimensions.curveSegments}
                      onChange={(e) => updateDimension('curveSegments', parseInt(e.target.value) || 4)}
                      className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer bg-usc-grey"
                      style={{ accentColor: 'var(--usc-gold)' }}
                    />
                    <span className="text-sm font-bold text-usc-gold w-8 text-right">{dimensions.curveSegments}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase">Lower = Faster Processing</p>
                </div>
                <button
                  onClick={regenerateModel}
                  disabled={!svgString}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold text-white transition-all usc-btn-secondary uppercase tracking-widest"
                >
                  🔄 Update 3D Geometry
                </button>
              </div>
            </section>

            <section className="space-y-4 usc-card rounded-2xl p-6">
              <h2 className="text-lg font-bold text-usc-gold flex items-center gap-2 uppercase tracking-tight">
                <Trophy className="w-5 h-5" /> 3. Export Files
              </h2>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={downloadSTL}
                  disabled={!model}
                  className="flex items-center justify-center gap-2 px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition-all usc-btn-secondary uppercase tracking-widest"
                >
                  <Box className="w-4 h-4" />
                  Export STL
                </button>
                <button
                  onClick={downloadGCode}
                  disabled={!model}
                  className="flex items-center justify-center gap-2 px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition-all usc-btn-primary uppercase tracking-widest"
                >
                  <FileCode className="w-4 h-4" />
                  Generate G-Code
                </button>
              </div>
            </section>

            <div className="p-4 rounded-xl border border-usc-gold/10 bg-usc-black/40">
              <h3 className="text-xs font-bold text-usc-gold mb-1 flex items-center gap-2 uppercase tracking-widest">
                ⚔️ Current Config
              </h3>
              <ul className="text-[10px] text-gray-400 space-y-1 uppercase tracking-wider font-semibold">
                <li>• Size: {dimensions.targetLengthInches}" × {dimensions.targetWidthInches}"</li>
                <li>• Base: {dimensions.baseThicknessMm}mm</li>
                <li>• Depth: {dimensions.extrusionDepthMm}mm</li>
                <li>• Detail: {dimensions.curveSegments}</li>
                <li>• Layer: 0.2mm</li>
              </ul>
            </div>
          </div>

          {/* Middle Column: Preview */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-usc-gold flex items-center gap-2 uppercase tracking-tight">
                  <span className="text-xl">✨</span> Preview
                </h2>
                <div className="flex rounded-lg p-1 bg-usc-black/50 border border-usc-gold/20">
                  <button
                    onClick={() => setViewMode('svg')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'svg'
                      ? 'text-white shadow-lg bg-usc-grey'
                      : 'text-gray-500 hover:text-usc-gold'
                      }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    SVG View
                  </button>
                  <button
                    onClick={() => setViewMode('3d')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === '3d'
                      ? 'text-white shadow-lg bg-usc-cardinal'
                      : 'text-gray-500 hover:text-usc-gold'
                      }`}
                  >
                    <Box className="w-3.5 h-3.5" />
                    3D View
                  </button>
                </div>
              </div>
              <span className="text-[10px] text-usc-gold/80 uppercase tracking-[0.2em] font-black flex items-center gap-1">
                <span className="animate-pulse">🔴</span> System Active
              </span>
            </div>

            {viewMode === '3d' ? (
              <Preview3D model={model} />
            ) : (
              <PreviewSVG
                svgString={svgString}
                onSvgUpdate={(newSvg) => {
                  setSvgString(newSvg);
                  pushToHistory(newSvg);
                  const newModel = create3DModel(newSvg, dimensions);
                  setModel(newModel);
                }}
                onUndo={undo}
                onRedo={redo}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < svgHistory.length - 1}
              />
            )}
          </div>

          {/* Right Column: Refinement */}
          <div className="lg:col-span-3 space-y-4">
            <section className="space-y-4 usc-card rounded-2xl p-6">
              <h2 className="text-lg font-bold text-usc-gold flex items-center gap-2 uppercase tracking-tight">
                <Layers className="w-5 h-5" /> SVG Refinement
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">
                    Segmentation Algorithm
                  </label>
                  <select
                    value={vectorOptions.algorithm}
                    onChange={(e) => {
                      const nextOptions = {
                        ...vectorOptions,
                        algorithm: e.target.value as any
                      };
                      setVectorOptions(nextOptions);
                      reVectorize(nextOptions);
                    }}
                    className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-usc-gold focus:border-transparent transition-all"
                    style={{ background: 'rgba(153, 0, 0, 0.1)', border: '1px solid rgba(255, 204, 0, 0.2)' }}
                  >
                    <option value="otsu" className="bg-usc-black">Standard Otsu (Fast)</option>
                    <option value="median-otsu" className="bg-usc-black">Median + Otsu (No Noise)</option>
                    <option value="adaptive" className="bg-usc-black">Adaptive Gaussian (Gradients)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">
                    Threshold (B&W) {vectorOptions.manualThreshold ? '(Manual)' : '(Auto)'}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const newVal = Math.max(0, vectorOptions.threshold - 1);
                        const nextOptions = { ...vectorOptions, threshold: newVal, manualThreshold: true };
                        setVectorOptions(nextOptions);
                        reVectorize(nextOptions);
                      }}
                      className="p-1 rounded-md hover:bg-usc-cardinal/20 text-usc-gold transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      step="1"
                      value={vectorOptions.threshold}
                      onChange={(e) => setVectorOptions(prev => ({
                        ...prev,
                        threshold: parseInt(e.target.value),
                        manualThreshold: true
                      }))}
                      onMouseUp={() => reVectorize()}
                      onTouchEnd={() => reVectorize()}
                      className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer bg-usc-grey"
                      style={{ accentColor: 'var(--usc-gold)' }}
                    />
                    <button
                      onClick={() => {
                        const newVal = Math.min(255, vectorOptions.threshold + 1);
                        const nextOptions = { ...vectorOptions, threshold: newVal, manualThreshold: true };
                        setVectorOptions(nextOptions);
                        reVectorize(nextOptions);
                      }}
                      className="p-1 rounded-md hover:bg-usc-gold/20 text-usc-gold transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-usc-gold w-8 text-right text-mono">{vectorOptions.threshold}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">
                    Turd Size (Noise)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const newVal = Math.max(0, vectorOptions.turdsize - 1);
                        const nextOptions = { ...vectorOptions, turdsize: newVal };
                        setVectorOptions(nextOptions);
                        reVectorize(nextOptions);
                      }}
                      className="p-1 rounded-md hover:bg-usc-cardinal/20 text-usc-gold transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={vectorOptions.turdsize}
                      onChange={(e) => setVectorOptions(prev => ({
                        ...prev,
                        turdsize: parseInt(e.target.value)
                      }))}
                      onMouseUp={() => reVectorize()}
                      onTouchEnd={() => reVectorize()}
                      className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer bg-usc-grey"
                      style={{ accentColor: 'var(--usc-gold)' }}
                    />
                    <button
                      onClick={() => {
                        const newVal = Math.min(100, vectorOptions.turdsize + 1);
                        const nextOptions = { ...vectorOptions, turdsize: newVal };
                        setVectorOptions(nextOptions);
                        reVectorize(nextOptions);
                      }}
                      className="p-1 rounded-md hover:bg-usc-gold/20 text-usc-gold transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-usc-gold w-8 text-right text-mono">{vectorOptions.turdsize}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-usc-gold/10 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                    Auto-updating on release
                  </span>
                  {isProcessing && <Loader2 className="w-3.5 h-3.5 text-usc-gold animate-spin" />}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-8 border-t border-usc-gold/10 mt-12">
        <p className="text-center text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-4">
          Crafted with Passion for 3D Printing
        </p>
      </footer>
    </div>
  );
}

export default App;
