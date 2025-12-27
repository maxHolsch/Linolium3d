import { useState, useCallback, useEffect } from 'react';
import { Upload, Box, FileCode, Loader2, Layers, Gift, Snowflake, Star } from 'lucide-react';
import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { vectorizeImage } from './utils/ImageProcessor';
import { create3DModel } from './utils/ModelGenerator';
import type { ModelDimensions } from './utils/ModelGenerator';
import { generateGCode } from './utils/GCodeGenerator';
import Preview3D from './components/Preview3D';
import PreviewSVG from './components/PreviewSVG';

type ViewMode = 'svg' | '3d';

// Snowflake component for animated snow
const SnowfallEffect = () => {
  const [snowflakes, setSnowflakes] = useState<Array<{ id: number; left: number; delay: number; duration: number; size: number }>>([]);

  useEffect(() => {
    const flakes = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 8 + Math.random() * 12,
      size: 0.5 + Math.random() * 1.5,
    }));
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: `${flake.left}%`,
            fontSize: `${flake.size}rem`,
            animationDuration: `${flake.duration}s, ${flake.duration / 2}s`,
            animationDelay: `${flake.delay}s, ${flake.delay}s`,
          }}
        >
          ❄
        </div>
      ))}
    </div>
  );
};

function App() {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [svgString, setSvgString] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const { svgString: vectorizedSvg } = await vectorizeImage(file);
      setSvgString(vectorizedSvg);
      const newModel = create3DModel(vectorizedSvg, dimensions);
      setModel(newModel);
      setViewMode('3d'); // Default to 3D view after upload
    } catch (err) {
      setError('Failed to process image. Please try a different file.');
    } finally {
      setIsProcessing(false);
    }
  }, [dimensions]);

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
    <div className="min-h-screen text-white font-sans selection:bg-red-500/30" style={{ background: 'linear-gradient(180deg, #0c1a0c 0%, #1a0a0a 50%, #0d1a1a 100%)' }}>
      <SnowfallEffect />

      <header className="christmas-header sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #c41e3a 0%, #8b0000 100%)', border: '2px solid #ffd700' }}>
              <Gift className="w-7 h-7 text-white" />
              <Star className="w-3 h-3 text-yellow-300 absolute top-1 right-1 star-decoration" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight gold-shimmer">🎄 Linolium3D</h1>
              <p className="text-xs text-green-400/80">Holiday Edition ✨</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-2xl animate-pulse">🎅</span>
            <a href="https://github.com" className="text-sm text-red-300 hover:text-yellow-300 transition-colors flex items-center gap-1">
              <Snowflake className="w-4 h-4" />
              Documentation
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 relative">
        {/* Decorative ornaments */}
        <div className="absolute top-0 left-10 text-4xl opacity-20 animate-bounce" style={{ animationDuration: '3s' }}>🎄</div>
        <div className="absolute top-20 right-16 text-3xl opacity-20 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>🎁</div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-8">
            <section className="space-y-4 christmas-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-yellow-300 flex items-center gap-2">
                <span className="text-2xl">🎅</span> 1. Upload Image
              </h2>
              <p className="text-sm text-green-200/70 leading-relaxed">
                Upload a high-contrast image or logo. We'll vectorize it and extrude it for your holiday block print!
              </p>
              <label className="relative group cursor-pointer block">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                />
                <div className="border-2 border-dashed border-red-800/50 group-hover:border-yellow-500/70 rounded-xl p-8 transition-all duration-300 flex flex-col items-center justify-center gap-3" style={{ background: 'linear-gradient(145deg, rgba(139, 0, 0, 0.2) 0%, rgba(0, 100, 0, 0.2) 100%)' }}>
                  {isProcessing ? (
                    <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 text-red-400 group-hover:text-yellow-300 transition-colors" />
                  )}
                  <span className="text-sm font-medium text-red-200 group-hover:text-yellow-200">
                    {isProcessing ? '🎄 Processing...' : '🎁 Click to upload or drag & drop'}
                  </span>
                </div>
              </label>
              {error && <p className="text-xs text-red-400 mt-2">❌ {error}</p>}
            </section>

            {/* Dimension Controls */}
            <section className="space-y-4 christmas-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-yellow-300 flex items-center gap-2">
                <span className="text-2xl">🎄</span> 2. Adjust Dimensions
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-green-300 mb-1.5">Length (inches)</label>
                    <input
                      type="number"
                      min="0.5"
                      max="20"
                      step="0.5"
                      value={dimensions.targetLengthInches}
                      onChange={(e) => updateDimension('targetLengthInches', parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                      style={{ background: 'rgba(139, 0, 0, 0.3)', border: '1px solid rgba(255, 215, 0, 0.3)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-300 mb-1.5">Width (inches)</label>
                    <input
                      type="number"
                      min="0.5"
                      max="20"
                      step="0.5"
                      value={dimensions.targetWidthInches}
                      onChange={(e) => updateDimension('targetWidthInches', parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                      style={{ background: 'rgba(139, 0, 0, 0.3)', border: '1px solid rgba(255, 215, 0, 0.3)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-300 mb-1.5">Base Thickness (mm)</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      step="0.5"
                      value={dimensions.baseThicknessMm}
                      onChange={(e) => updateDimension('baseThicknessMm', parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                      style={{ background: 'rgba(139, 0, 0, 0.3)', border: '1px solid rgba(255, 215, 0, 0.3)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-300 mb-1.5">Extrusion (mm)</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      step="0.5"
                      value={dimensions.extrusionDepthMm}
                      onChange={(e) => updateDimension('extrusionDepthMm', parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                      style={{ background: 'rgba(139, 0, 0, 0.3)', border: '1px solid rgba(255, 215, 0, 0.3)' }}
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-yellow-500/20">
                  <label className="block text-xs font-medium text-green-300 mb-1.5">Curve Detail (lower = fewer triangles)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="12"
                      step="1"
                      value={dimensions.curveSegments}
                      onChange={(e) => updateDimension('curveSegments', parseInt(e.target.value) || 4)}
                      className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                      style={{ background: 'linear-gradient(90deg, #228b22 0%, #c41e3a 100%)' }}
                    />
                    <span className="text-sm text-yellow-300 w-8 text-right">{dimensions.curveSegments}</span>
                  </div>
                  <p className="text-xs text-green-400/60 mt-1">Lower values = fewer triangles (faster processing)</p>
                </div>
                <button
                  onClick={regenerateModel}
                  disabled={!svgString}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-all christmas-btn-secondary"
                >
                  🔄 Apply Dimensions
                </button>
              </div>
            </section>

            <section className="space-y-4 christmas-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-yellow-300 flex items-center gap-2">
                <span className="text-2xl">🎁</span> 3. Export Files
              </h2>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={downloadSTL}
                  disabled={!model}
                  className="flex items-center justify-center gap-2 px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all christmas-btn-secondary"
                >
                  <Box className="w-4 h-4" />
                  Export STL (TinkerCAD)
                </button>
                <button
                  onClick={downloadGCode}
                  disabled={!model}
                  className="flex items-center justify-center gap-2 px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all christmas-btn-primary"
                >
                  <FileCode className="w-4 h-4" />
                  🎄 Generate G-Code
                </button>
              </div>
            </section>

            <div className="p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(0, 100, 0, 0.2) 0%, rgba(139, 0, 0, 0.2) 100%)', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
              <h3 className="text-sm font-semibold text-yellow-400 mb-1 flex items-center gap-2">
                ⭐ Current Settings
              </h3>
              <ul className="text-xs text-green-200/80 space-y-1">
                <li>• Size: {dimensions.targetLengthInches}" × {dimensions.targetWidthInches}"</li>
                <li>• Base: {dimensions.baseThicknessMm}mm</li>
                <li>• Extrusion: {dimensions.extrusionDepthMm}mm</li>
                <li>• Curve Detail: {dimensions.curveSegments}</li>
                <li>• Layer Height: 0.2mm</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-yellow-300 flex items-center gap-2">
                  <span className="text-xl">✨</span> Preview
                </h2>
                <div className="flex rounded-lg p-1" style={{ background: 'rgba(139, 0, 0, 0.3)', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
                  <button
                    onClick={() => setViewMode('svg')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'svg'
                      ? 'text-white shadow-lg'
                      : 'text-red-300 hover:text-yellow-200'
                      }`}
                    style={viewMode === 'svg' ? { background: 'linear-gradient(135deg, #228b22 0%, #006400 100%)' } : {}}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    SVG View
                  </button>
                  <button
                    onClick={() => setViewMode('3d')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === '3d'
                      ? 'text-white shadow-lg'
                      : 'text-red-300 hover:text-yellow-200'
                      }`}
                    style={viewMode === '3d' ? { background: 'linear-gradient(135deg, #c41e3a 0%, #8b0000 100%)' } : {}}
                  >
                    <Box className="w-3.5 h-3.5" />
                    3D View
                  </button>
                </div>
              </div>
              <span className="text-xs text-yellow-500/80 uppercase tracking-widest font-bold flex items-center gap-1">
                <span className="animate-pulse">🔴</span> Live View
              </span>
            </div>

            {viewMode === '3d' ? (
              <Preview3D model={model} />
            ) : (
              <PreviewSVG svgString={svgString} />
            )}
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-8 border-t border-yellow-500/20 mt-12">
        <p className="text-center text-green-400/60 text-sm flex items-center justify-center gap-2">
          <span>🎄</span>
          Built with React, Three.js, and ImageTracer.js
          <span>🎅</span>
          Happy Holidays!
          <span>🎁</span>
        </p>
      </footer>
    </div>
  );
}

export default App;
