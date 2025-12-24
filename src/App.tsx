import { useState, useCallback } from 'react';
import { Upload, Download, Box, FileCode, Loader2, Eye, Layers } from 'lucide-react';
import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { vectorizeImage } from './utils/ImageProcessor';
import { create3DModel } from './utils/ModelGenerator';
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

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const { svgString: vectorizedSvg } = await vectorizeImage(file);
      setSvgString(vectorizedSvg);
      const newModel = create3DModel(vectorizedSvg);
      setModel(newModel);
      setViewMode('3d'); // Default to 3D view after upload
    } catch (err) {
      setError('Failed to process image. Please try a different file.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Box className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Linolium3D</h1>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com" className="text-sm text-slate-400 hover:text-white transition-colors">Documentation</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-8">
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-200">1. Upload Image</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Upload a high-contrast image or logo. We'll vectorize it and extrude it by 3mm for your block print.
              </p>
              <label className="relative group cursor-pointer block">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                />
                <div className="border-2 border-dashed border-slate-800 group-hover:border-indigo-500/50 bg-slate-900/50 rounded-xl p-8 transition-all duration-300 flex flex-col items-center justify-center gap-3">
                  {isProcessing ? (
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  )}
                  <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200">
                    {isProcessing ? 'Processing...' : 'Click to upload or drag & drop'}
                  </span>
                </div>
              </label>
              {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-200">2. Export Files</h2>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={downloadSTL}
                  disabled={!model}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all border border-slate-700 hover:border-slate-600"
                >
                  <Box className="w-4 h-4" />
                  Export STL (TinkerCAD)
                </button>
                <button
                  onClick={downloadGCode}
                  disabled={!model}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20"
                >
                  <FileCode className="w-4 h-4" />
                  Generate G-Code
                </button>
              </div>
            </section>

            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
              <h3 className="text-sm font-semibold text-indigo-400 mb-1">Print Settings</h3>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• Extrusion: 3mm</li>
                <li>• Base Plate: 2mm</li>
                <li>• Layer Height: 0.2mm</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-slate-200">Preview</h2>
                <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                  <button
                    onClick={() => setViewMode('svg')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'svg'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    SVG View
                  </button>
                  <button
                    onClick={() => setViewMode('3d')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === '3d'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    <Box className="w-3.5 h-3.5" />
                    3D View
                  </button>
                </div>
              </div>
              <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Live View</span>
            </div>

            {viewMode === '3d' ? (
              <Preview3D model={model} />
            ) : (
              <PreviewSVG svgString={svgString} />
            )}
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-8 border-t border-slate-900 mt-12">
        <p className="text-center text-slate-600 text-sm">
          Built with React, Three.js, and ImageTracer.js
        </p>
      </footer>
    </div>
  );
}

export default App;
