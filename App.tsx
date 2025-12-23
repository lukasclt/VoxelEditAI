import React, { useState, useCallback, useEffect } from 'react';
import { 
  Box, 
  Eraser, 
  Download, 
  Wand2, 
  Trash2, 
  Menu,
  X,
  Loader2,
  Settings,
  ChevronDown
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import VoxelWorld from './components/VoxelWorld';
import { BLOCKS } from './constants';
import { ToolType, VoxelMap } from './types';
import { generateSchemFile, generateClassicSchematicFile } from './services/nbtService';
import { generateStructure } from './services/geminiService';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Cookie Helper
const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

export default function App() {
  const [blocks, setBlocks] = useState<VoxelMap>(new Map());
  const [selectedBlockId, setSelectedBlockId] = useState(BLOCKS[0].id);
  const [tool, setTool] = useState<ToolType>(ToolType.PLACE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Settings & AI State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("xiaomi/mimo-v2-flash:free");
  
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cookies on mount
  useEffect(() => {
    const savedKey = getCookie("openrouter_key");
    const savedModel = getCookie("openrouter_model");
    if (savedKey) setApiKey(savedKey);
    if (savedModel) setModel(savedModel);
  }, []);

  const saveSettings = () => {
    setCookie("openrouter_key", apiKey, 30);
    setCookie("openrouter_model", model, 30);
    setIsSettingsOpen(false);
  };

  const handlePlaceBlock = useCallback((x: number, y: number, z: number) => {
    setBlocks(prev => {
      const newMap = new Map(prev);
      const key = `${x},${y},${z}`;
      newMap.set(key, { x, y, z, blockId: selectedBlockId });
      return newMap;
    });
  }, [selectedBlockId]);

  const handleRemoveBlock = useCallback((x: number, y: number, z: number) => {
    setBlocks(prev => {
      const newMap = new Map(prev);
      const key = `${x},${y},${z}`;
      newMap.delete(key);
      return newMap;
    });
  }, []);

  const handleClear = () => {
    if (confirm("Are you sure you want to clear the world?")) {
      setBlocks(new Map());
    }
  };

  const downloadFile = (data: Uint8Array, filename: string) => {
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportSchem = () => {
    try {
      const compressedData = generateSchemFile(blocks);
      downloadFile(compressedData, `creation_${Date.now()}.schem`);
      setIsExportOpen(false);
    } catch (e) {
      console.error(e);
      alert("Failed to export .schem");
    }
  };

  const handleExportSchematic = () => {
    try {
      const compressedData = generateClassicSchematicFile(blocks);
      downloadFile(compressedData, `creation_${Date.now()}.schematic`);
      setIsExportOpen(false);
    } catch (e) {
      console.error(e);
      alert("Failed to export .schematic");
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    if (!apiKey) {
      setError("API Key missing. Please set it in Settings.");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    try {
      const generatedVoxels = await generateStructure(aiPrompt, apiKey, model);
      
      setBlocks(prev => {
        const newMap = new Map(prev);
        generatedVoxels.forEach(v => {
          const key = `${v.x},${v.y},${v.z}`;
          newMap.set(key, v);
        });
        return newMap;
      });
      
      setIsAiModalOpen(false);
      setAiPrompt("");
    } catch (err: any) {
      setError(err.message || "Failed to generate structure.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-mc-bg text-mc-text font-sans overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-mc-panel border-b border-mc-border flex items-center px-4 justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-mc-accent flex items-center justify-center rounded border border-white/20">
            <Box size={20} className="text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-wide text-white">VoxelEdit AI</h1>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
            title="API Settings"
          >
            <Settings size={20} />
          </button>

          <button 
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium transition-colors"
          >
            <Wand2 size={16} />
            AI Generator
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
            >
              <Download size={16} />
              Export
              <ChevronDown size={14} className="ml-1" />
            </button>
            
            {isExportOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-mc-panel border border-mc-border rounded shadow-xl z-50 py-1">
                <button 
                  onClick={handleExportSchem}
                  className="w-full text-left px-4 py-2 hover:bg-white/5 text-sm"
                >
                  Download .schem (Modern)
                </button>
                <button 
                  onClick={handleExportSchematic}
                  className="w-full text-left px-4 py-2 hover:bg-white/5 text-sm"
                >
                  Download .schematic (Classic)
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <div className={cn(
          "bg-mc-panel border-r border-mc-border w-64 flex flex-col transition-all duration-300 absolute z-20 h-full md:relative",
          !isSidebarOpen && "-translate-x-full md:hidden"
        )}>
          {/* Tools */}
          <div className="p-4 border-b border-mc-border">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Tools</h3>
            <div className="grid grid-cols-4 gap-2">
              <ToolButton 
                active={tool === ToolType.PLACE} 
                onClick={() => setTool(ToolType.PLACE)}
                icon={<Box size={18} />}
                title="Place Block"
              />
              <ToolButton 
                active={tool === ToolType.REMOVE} 
                onClick={() => setTool(ToolType.REMOVE)}
                icon={<Eraser size={18} />}
                title="Remove Block"
              />
              <ToolButton 
                active={false} 
                onClick={handleClear}
                icon={<Trash2 size={18} />}
                title="Clear All"
                variant="danger"
              />
            </div>
          </div>

          {/* Block Palette */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Blocks</h3>
            <div className="grid grid-cols-3 gap-2">
              {BLOCKS.map(block => (
                <button
                  key={block.id}
                  onClick={() => {
                    setSelectedBlockId(block.id);
                    setTool(ToolType.PLACE);
                  }}
                  className={cn(
                    "aspect-square rounded border-2 flex items-center justify-center transition-all hover:scale-105",
                    selectedBlockId === block.id 
                      ? "border-white ring-2 ring-mc-accent/50" 
                      : "border-mc-border hover:border-gray-400"
                  )}
                  style={{ backgroundColor: block.color }}
                  title={block.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Toggle Sidebar Button (Mobile) */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-30 p-2 bg-mc-panel rounded border border-mc-border md:hidden"
          >
            <Menu size={20} />
          </button>
        )}

        {/* 3D Viewport */}
        <div className="flex-1 relative bg-black" onClick={() => setIsExportOpen(false)}>
          <VoxelWorld 
            blocks={blocks}
            selectedBlockId={selectedBlockId}
            tool={tool}
            onPlaceBlock={handlePlaceBlock}
            onRemoveBlock={handleRemoveBlock}
          />
          
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur px-3 py-2 rounded text-xs text-gray-300 pointer-events-none select-none">
            {blocks.size} Blocks Placed
          </div>

           <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur px-3 py-2 rounded text-xs text-gray-300 pointer-events-none select-none">
             LMB: Action | RMB: Rotate | Scroll: Zoom
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-mc-panel border border-mc-border rounded-lg shadow-2xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Settings className="text-gray-400" /> Settings
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">OpenRouter API Key</label>
                <input 
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-or-..."
                  className="w-full bg-mc-bg border border-mc-border rounded p-2 text-white focus:outline-none focus:border-mc-accent"
                />
                <p className="text-xs text-gray-500 mt-1">Stored in cookies.</p>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Model ID</label>
                <input 
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="xiaomi/mimo-v2-flash:free"
                  className="w-full bg-mc-bg border border-mc-border rounded p-2 text-white focus:outline-none focus:border-mc-accent"
                />
                <p className="text-xs text-gray-500 mt-1">Recommended: xiaomi/mimo-v2-flash:free</p>
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  onClick={saveSettings}
                  className="px-4 py-2 bg-mc-accent hover:bg-mc-accentHover text-white rounded font-medium"
                >
                  Save & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-mc-panel border border-mc-border rounded-lg shadow-2xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => setIsAiModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-purple-600 flex items-center justify-center">
                <Wand2 size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Builder</h2>
                <p className="text-xs text-gray-400">Powered by OpenRouter</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What should I build?
                </label>
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., A small cozy cottage with a stone foundation..."
                  className="w-full h-32 bg-mc-bg border border-mc-border rounded p-3 text-white placeholder-gray-500 focus:outline-none focus:border-mc-accent resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-900/30 border border-red-800 rounded text-red-200 text-sm">
                  {error}
                </div>
              )}

              {!apiKey && (
                 <div className="p-3 bg-yellow-900/30 border border-yellow-800 rounded text-yellow-200 text-sm">
                  Please configure your OpenRouter API Key in settings.
                </div>
              )}

              <button 
                onClick={handleAiGenerate}
                disabled={isGenerating || !aiPrompt.trim() || !apiKey}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-bold transition-all flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Structure"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ToolButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  variant?: 'normal' | 'danger';
}

function ToolButton({ active, onClick, icon, title, variant = 'normal' }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "aspect-square rounded flex items-center justify-center transition-colors",
        active 
          ? "bg-mc-accent text-white shadow-inner" 
          : "bg-mc-bg text-gray-400 hover:bg-mc-border hover:text-white",
        variant === 'danger' && !active && "hover:bg-red-900/50 hover:text-red-200"
      )}
    >
      {icon}
    </button>
  );
}
