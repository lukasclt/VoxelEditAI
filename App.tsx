import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  ChevronDown,
  MessageSquare,
  Send
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import VoxelWorld from './components/VoxelWorld';
import { BLOCKS } from './constants';
import { ToolType, VoxelMap, ChatMessage } from './types';
import { generateSchemFile, generateClassicSchematicFile } from './services/nbtService';
import { editStructure } from './services/geminiService';

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
  const [isChatOpen, setIsChatOpen] = useState(true); // New Chat Sidebar State
  
  // Settings & AI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("xiaomi/mimo-v2-flash:free");
  
  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! I can help you build. Try "Build a house" or "Change the roof to red wool".' }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load cookies on mount
  useEffect(() => {
    const savedKey = getCookie("openrouter_key");
    const savedModel = getCookie("openrouter_model");
    if (savedKey) setApiKey(savedKey);
    if (savedModel) setModel(savedModel);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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

  const handleChatSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;
    if (!apiKey) {
      setChatMessages(prev => [...prev, { role: 'system', content: '⚠️ Please set your OpenRouter API Key in Settings first.' }]);
      return;
    }

    const userMsg = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsGenerating(true);

    try {
      // Convert Map to Array for API
      const currentVoxels = Array.from(blocks.values());
      
      const result = await editStructure(currentVoxels, userMsg, apiKey, model);
      
      // Update World
      setBlocks(prev => {
        const newMap = new Map(); // Replace completely based on AI response to support deletions/edits correctly
        result.voxels.forEach(v => {
          const key = `${v.x},${v.y},${v.z}`;
          newMap.set(key, v);
        });
        return newMap;
      });

      setChatMessages(prev => [...prev, { role: 'assistant', content: result.message }]);

    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: 'system', content: `Error: ${err.message}` }]);
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
          <h1 className="font-bold text-lg tracking-wide text-white hidden sm:block">VoxelEdit AI</h1>
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
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={cn(
              "p-2 rounded transition-colors flex items-center gap-2",
              isChatOpen ? "bg-purple-600/20 text-purple-400" : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
            title="Toggle AI Chat"
          >
            <MessageSquare size={20} />
            <span className="text-sm font-medium hidden md:inline">AI Chat</span>
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
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
        {/* Left Sidebar (Tools) */}
        <div className={cn(
          "bg-mc-panel border-r border-mc-border w-16 md:w-64 flex flex-col transition-all duration-300 z-20 shrink-0",
          !isSidebarOpen && "-translate-x-full absolute h-full md:relative md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden"
        )}>
          {/* Tools */}
          <div className="p-2 md:p-4 border-b border-mc-border">
            <h3 className="hidden md:block text-xs font-bold text-gray-400 uppercase mb-3">Tools</h3>
            <div className="flex flex-col md:grid md:grid-cols-4 gap-2">
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
          <div className="flex-1 overflow-y-auto p-2 md:p-4 custom-scrollbar">
            <h3 className="hidden md:block text-xs font-bold text-gray-400 uppercase mb-3">Blocks</h3>
            <div className="flex flex-col md:grid md:grid-cols-3 gap-2">
              {BLOCKS.map(block => (
                <button
                  key={block.id}
                  onClick={() => {
                    setSelectedBlockId(block.id);
                    setTool(ToolType.PLACE);
                  }}
                  className={cn(
                    "aspect-square rounded border-2 flex items-center justify-center transition-all hover:scale-105 relative group",
                    selectedBlockId === block.id 
                      ? "border-white ring-2 ring-mc-accent/50" 
                      : "border-mc-border hover:border-gray-400"
                  )}
                  style={{ backgroundColor: block.color }}
                  title={block.name}
                >
                   {/* Tooltip for collapsed view */}
                   <span className="md:hidden absolute left-full ml-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
                      {block.name}
                   </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Toggle Left Sidebar Button (Mobile) */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-30 p-2 bg-mc-panel rounded border border-mc-border md:hidden"
          >
            <Menu size={20} />
          </button>
        )}

        {/* 3D Viewport */}
        <div className="flex-1 relative bg-black min-w-0" onClick={() => setIsExportOpen(false)}>
          <VoxelWorld 
            blocks={blocks}
            selectedBlockId={selectedBlockId}
            tool={tool}
            onPlaceBlock={handlePlaceBlock}
            onRemoveBlock={handleRemoveBlock}
          />
          
          <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-auto flex justify-between pointer-events-none">
             <div className="bg-black/50 backdrop-blur px-3 py-2 rounded text-xs text-gray-300 select-none">
               LMB: Action | RMB: Rotate
             </div>
             <div className="bg-black/50 backdrop-blur px-3 py-2 rounded text-xs text-gray-300 select-none ml-2">
              {blocks.size} Blocks
             </div>
          </div>
        </div>

        {/* Right Sidebar (Chat AI) */}
        <div className={cn(
           "bg-mc-panel border-l border-mc-border w-80 flex flex-col transition-all duration-300 absolute right-0 h-full z-20 md:relative",
           !isChatOpen && "translate-x-full md:w-0 md:translate-x-0 md:border-l-0"
        )}>
          <div className="p-4 border-b border-mc-border bg-mc-bg/50 flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <Wand2 size={16} className="text-purple-400" />
              AI Builder
            </h2>
            <button onClick={() => setIsChatOpen(false)} className="md:hidden text-gray-400">
              <X size={18} />
            </button>
          </div>
          
          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {chatMessages.map((msg, i) => (
              <div key={i} className={cn(
                "flex flex-col max-w-[90%]",
                msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
              )}>
                <div className={cn(
                  "px-3 py-2 rounded-lg text-sm",
                  msg.role === 'user' 
                    ? "bg-purple-600 text-white rounded-br-none" 
                    : msg.role === 'system'
                    ? "bg-red-900/50 text-red-200 border border-red-800"
                    : "bg-mc-bg border border-mc-border text-gray-200 rounded-bl-none"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 size={14} className="animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-mc-panel border-t border-mc-border">
            <form onSubmit={handleChatSubmit} className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ex: Add a stone roof..."
                disabled={isGenerating}
                className="w-full bg-mc-bg border border-mc-border rounded-lg pl-3 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={!chatInput.trim() || isGenerating}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-purple-400 hover:text-white hover:bg-purple-600 rounded-md transition-all disabled:opacity-0"
              >
                <Send size={16} />
              </button>
            </form>
            <p className="text-[10px] text-gray-500 mt-2 text-center">
              AI can modify existing blocks. Be specific!
            </p>
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
