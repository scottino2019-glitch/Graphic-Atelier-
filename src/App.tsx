import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Type, 
  Plus, 
  Trash2, 
  Layers, 
  Download, 
  RotateCcw, 
  Move, 
  Maximize2, 
  RotateCw, 
  Copy,
  ChevronUp,
  ChevronDown,
  Sparkles,
  MousePointer2,
  Settings2,
  FileImage,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Italic,
  Bold,
  Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import domtoimage from 'dom-to-image-more';

// --- TYPES ---
type ElementType = 'text' | 'stationery' | 'shape';

const STICKERS = [
  '🎨', '✍️', '✉️', '📔', '📎', '📌', '🏷️', '🖍️', 
  '🌸', '🌿', '🍄', '🥐', '☕', '🕯️', '🎻', '🏛️',
  '🦋', '🦢', '✨', '🌙', '☁️', '🎈', '🎁', '📸'
];

const TEXTURES = [
  { id: 'none', label: 'Liscio', url: 'none' },
  { id: 'felt', label: 'Granulare', url: `data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='black' fill-opacity='0.25'%3E%3Cpath d='M5 0h1L0 6V5L5 0zM6 5v1H5l1-1z'/%3E%3C/g%3E%3C/svg%3E` },
  { id: 'paper', label: 'Puntinato', url: `data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='12' cy='12' r='1' fill='black' fill-opacity='0.25'/%3E%3C/svg%3E` },
  { id: 'linen', label: 'Lino', url: `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='black' stroke-width='2' stroke-opacity='0.35'%3E%3Cpath d='M0 10h40M0 20h40M0 30h40M10 0v40M20 0v40M30 0v40'/%3E%3C/g%3E%3C/svg%3E` },
  { id: 'grid', label: 'Quadretti', url: `data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='32' height='32' fill='none' stroke='black' stroke-width='1.5' stroke-opacity='0.35'/%3E%3C/svg%3E` },
];

interface CanvasElement {
  id: string;
  type: ElementType | 'emoji';
  x: number;
  y: number;
  rotation: number;
  scale: number;
  content: string; // text or object type
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  letterSpacing?: number;
  lineHeight?: number;
  textAlign?: 'left' | 'center' | 'right';
  isItalic?: boolean;
  isBold?: boolean;
  opacity?: number;
  zIndex: number;
}

// --- UTILS ---
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// --- CONSTANTS ---
const FONTS = [
  { name: 'Playfair Display', family: "'Playfair Display', serif", label: 'Editorial Serif' },
  { name: 'Cormorant Garamond', family: "'Cormorant Garamond', serif", label: 'Classic Garamond' },
  { name: 'Satisfy', family: "'Satisfy', cursive", label: 'Elegant Script' },
  { name: 'Homemade Apple', family: "'Homemade Apple', cursive", label: 'Handwritten' },
  { name: 'Inter', family: "'Inter', sans-serif", label: 'Modern Sans' },
  { name: 'Space Grotesk', family: "'Space Grotesk', sans-serif", label: 'Modern Grotesk' },
  { name: 'Syne', family: "'Syne', sans-serif", label: 'Display Bold' },
  { name: 'JetBrains Mono', family: "'JetBrains Mono', monospace", label: 'Technical Mono' },
];

const COLORS = [
  { name: 'Midnight', hex: '#1A1A1A' },
  { name: 'Paper', hex: '#F9F9F7' },
  { name: 'Blush', hex: '#FF7EB9' },
  { name: 'Sky', hex: '#7EB9FF' },
  { name: 'Sage', hex: '#A8B7A3' },
  { name: 'Cream', hex: '#F2E8CF' },
  { name: 'Lavender', hex: '#E0BBE4' },
  { name: 'Terracotta', hex: '#E2725B' },
  { name: 'Forest', hex: '#2D5A27' },
  { name: 'Gold', hex: '#D4AF37' },
];

const STATIONERY_ASSETS = [
  { id: 'clipboard', label: 'Clipboard', type: 'base' },
  { id: 'notepad', label: 'Note Pad', type: 'base' },
  { id: 'paper_scrap', label: 'Foglio Strappato', type: 'base' },
  { id: 'pencil', label: 'Matita', type: 'deco' },
  { id: 'paperclip', label: 'Graffetta', type: 'deco' },
  { id: 'washi_tape', label: 'Washi Tape', type: 'deco' },
  { id: 'stamp', label: 'Timbro', type: 'deco' },
  { id: 'frame', label: 'Cornice Fine', type: 'shape' },
  { id: 'divider', label: 'Divisore', type: 'shape' },
  { id: 'circle', label: 'Cerchio', type: 'shape' },
  { id: 'unicorn', label: 'Unicorno', type: 'deco' },
  { id: 'rainbow', label: 'Arcobaleno', type: 'deco' },
];

// --- COMPONENTS: REALISTIC STATIONERY ---
const StationeryGraphic = ({ type, color }: { type: string, color?: string }) => {
  switch (type) {
    case 'frame':
      return (
        <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="380" height="380" stroke={color || '#1A1A1A'} strokeWidth="1" />
          <rect x="2" y="2" width="396" height="396" stroke={color || '#1A1A1A'} strokeWidth="0.5" strokeOpacity="0.3" />
        </svg>
      );
    case 'divider':
      return (
        <svg width="300" height="40" viewBox="0 0 300 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="20" x2="300" y2="20" stroke={color || '#1A1A1A'} strokeWidth="1" />
          <circle cx="150" cy="20" r="4" fill={color || '#1A1A1A'} />
          <circle cx="150" cy="20" r="8" stroke={color || '#1A1A1A'} strokeWidth="0.5" />
        </svg>
      );
    case 'circle':
       return (
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="98" stroke={color || '#1A1A1A'} strokeWidth="0.5" />
          <circle cx="100" cy="100" r="60" fill={color || '#1A1A1A'} fillOpacity="0.05" />
        </svg>
      );
    case 'clipboard':
      return (
        <svg width="340" height="440" viewBox="0 0 340 440" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="340" height="440" rx="8" fill="#FFFFFF" />
          <rect x="2" y="2" width="336" height="436" rx="6" fill="#FCE7F3" stroke="#F9A8D4" strokeWidth="2" />
          <rect x="20" y="20" width="300" height="400" rx="4" fill="#FCE7F3" />
          {/* Solid white paper */}
          <rect x="40" y="50" width="260" height="340" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
          <path d="M120 15H220V45H120V15Z" fill="#D1D5DB" stroke="black" strokeWidth="2" />
          <path d="M130 5H210C215.523 5 220 9.47715 220 15V25H120V15C120 9.47715 124.477 5 130 5Z" fill="#9CA3AF" />
          {[...Array(15)].map((_, i) => (
            <line key={i} x1="55" y1={90 + i * 20} x2="285" y2={90 + i * 20} stroke="#F9FAFB" strokeWidth="1.5" />
          ))}
          <circle cx="170" cy="20" r="4" fill="white" fillOpacity="0.4" />
        </svg>
      );
    case 'notepad':
      return (
        <svg width="280" height="340" viewBox="0 0 280 340" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="280" height="340" rx="2" fill="#FFFFFF" />
          <rect x="5" y="5" width="270" height="330" rx="2" fill={color || '#FFFFFF'} stroke="#E5E7EB" strokeWidth="1" />
          <path d="M5 5H275V35H5V5Z" fill="#FFB7C5" />
          {[...Array(14)].map((_, i) => (
            <line key={i} x1="20" y1={60 + i * 20} x2="260" y2={60 + i * 20} stroke="#F3F4F6" strokeWidth="1" />
          ))}
          <circle cx="140" cy="20" r="5" fill="white" fillOpacity="0.6" />
          <rect x="20" y="50" width="4" height="270" fill="#FFEDF4" />
        </svg>
      );
    case 'pencil':
      return (
        <svg width="220" height="18" viewBox="0 0 220 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="190" height="18" rx="2" fill={color || '#FF7EB9'} />
          <path d="M190 0L220 9L190 18V0Z" fill="#FFD4B2" />
          <path d="M214 6L220 9L214 12V6Z" fill="#1A1A1A" />
          <rect width="190" height="2" y="4" fill="white" fillOpacity="0.3" />
        </svg>
      );
    case 'paper_scrap':
      return (
        <svg width="300" height="200" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 5L295 8L290 192L4 185L12 140L2 100L9 60L5 5Z" fill="#FFFFFF" />
          <path d="M5 5L295 8L290 192L4 185L12 140L2 100L9 60L5 5Z" fill={color || '#FFFFFF'} stroke="#D1D5DB" strokeWidth="1.5" />
          <path d="M5 5L20 8L35 5L50 8L65 5L80 8L95 5L110 8L125 5L140 8L155 5L170 8L185 5L200 8L215 5L230 8L245 5L260 8L275 5L295 8" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />
          {[...Array(6)].map((_, i) => (
             <line key={i} x1="30" y1={40 + i * 25} x2="270" y2={40 + i * 25} stroke="#F3F4F6" strokeWidth="1" />
          ))}
        </svg>
      );
    case 'washi_tape':
      return (
        <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.8 }}>
          <rect width="120" height="40" fill={color || '#7EB9FF'} fillOpacity="0.6" />
          <path d="M0 0L5 10L0 20L5 30L0 40H120L115 30L120 20L115 10L120 0H0Z" fill={color || '#7EB9FF'} />
          <rect x="10" y="10" width="100" height="20" stroke="white" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.5" />
        </svg>
      );
    case 'stamp':
      return (
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.7 }}>
          <rect x="5" y="5" width="90" height="90" rx="45" stroke={color || '#1A1A1A'} strokeWidth="4" strokeDasharray="2 2" />
          <circle cx="50" cy="50" r="38" stroke={color || '#1A1A1A'} strokeWidth="2" />
          <text x="50" y="45" fontSize="10" fontFamily="sans-serif" fontWeight="bold" fill={color || '#1A1A1A'} textAnchor="middle" transform="rotate(-10 50 50)">OFFICIAL</text>
          <text x="50" y="60" fontSize="12" fontFamily="serif" italic="true" fill={color || '#1A1A1A'} textAnchor="middle" transform="rotate(-10 50 50)">Studio Atelier</text>
          <path d="M20 50Q50 20 80 50" stroke={color || '#1A1A1A'} strokeWidth="1" fill="none" />
        </svg>
      );
    case 'paperclip':
      return (
        <svg width="25" height="60" viewBox="0 0 25 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.5 60C17.747 60 22 55.747 22 50.5V10C22 4.47715 17.5228 0 12 0C6.47715 0 2 4.47715 2 10V50.5C2 52.433 3.567 54 5.5 54C7.433 54 9 52.433 9 50.5V10C9 8.34315 10.3431 7 12 7C13.6569 7 15 8.34315 15 10V50.5C15 51.8807 16.1193 53 17.5 53C18.8807 53 20 51.8807 20 50.5V10C20 5.85786 16.6421 2.5 12.5 2.5C8.35786 2.5 5 5.85786 5 10V45" stroke={color || "black"} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'unicorn':
      return (
        <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
          <circle cx="70" cy="70" r="60" fill="white" />
          <path d="M70 10V30M110 30L95 40M30 30L45 40" stroke="#FFD700" strokeWidth="4" strokeLinecap="round" />
          <rect x="50" y="60" width="40" height="30" rx="10" fill="#E0BBE4" fillOpacity="0.2" />
          <circle cx="55" cy="65" r="4" fill="black" />
          <circle cx="85" cy="65" r="4" fill="black" />
          <path d="M60 85C60 85 65 90 70 90C75 90 80 85 80 85" stroke="#FF7EB9" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'rainbow':
      return (
        <svg width="160" height="100" viewBox="0 0 160 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
           <path d="M10 90C10 51.3401 41.3401 20 80 20C118.66 20 150 51.3401 150 90" stroke="#FF7EB9" strokeWidth="12" />
           <path d="M25 90C25 59.6243 49.6243 35 80 35C110.376 35 135 59.6243 135 90" stroke="#7EB9FF" strokeWidth="12" />
           <path d="M40 90C40 67.9086 57.9086 50 80 50C102.091 50 120 67.9086 120 90" stroke="#00FFBD" strokeWidth="12" />
        </svg>
      );
    default:
      return <div>?</div>;
  }
};

// --- MAIN APP ---
export default function App() {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [format, setFormat] = useState<'portrait' | 'square'>('portrait');
  const [bgColor, setBgColor] = useState('#F9F9F7');
  const [texture, setTexture] = useState(TEXTURES[2].url);
  const [isExporting, setIsExporting] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.4);
  const [dragState, setDragState] = useState<{ id: string; startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  // Canvas Dimensions
  const canvasWidth = 1080;
  const canvasHeight = format === 'portrait' ? 1350 : 1080;

  // Core Management
  const addText = () => {
    const newElement: CanvasElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      x: (canvasWidth / 2) - 150,
      y: (canvasHeight / 2) - 200, // Higher for better visibility
      rotation: 0,
      scale: 1,
      content: 'NUOVO_TESTO',
      color: '#1A1A1A',
      fontSize: 64,
      fontFamily: FONTS[0].family,
      letterSpacing: -2,
      lineHeight: 1,
      textAlign: 'center',
      zIndex: 5000 + elements.length
    };
    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
  };

  const addAsset = (assetId: string) => {
    const asset = STATIONERY_ASSETS.find(a => a.id === assetId);
    if (!asset) return;
    
    // Position intelligently based on type
    const x = (canvasWidth / 2) - (asset.type === 'base' ? 170 : 80);
    const y = (canvasHeight / 2) - (asset.type === 'base' ? 220 : 150);

    const newElement: CanvasElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'stationery',
      x: x + (Math.random() * 20 - 10),
      y: y + (Math.random() * 20 - 10),
      rotation: asset.type === 'deco' ? (Math.random() * 30 - 15) : 0,
      scale: 1,
      content: asset.id,
      zIndex: asset.type === 'base' ? 100 + elements.length : 6000 + elements.length
    };
    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
  };

  const addEmoji = (emoji: string) => {
    const newElement: CanvasElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'emoji',
      x: (canvasWidth / 2) - 40,
      y: (canvasHeight / 2) - 150,
      rotation: Math.random() * 40 - 20,
      scale: 2,
      content: emoji,
      zIndex: 7000 + elements.length
    };
    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
  };

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => (el.id === id ? { ...el, ...updates } : el)));
  };

  const changeLayer = (id: string, direction: 'up' | 'down') => {
    setElements(prev => {
      const items = [...prev].sort((a, b) => a.zIndex - b.zIndex);
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return prev;

      if (direction === 'up' && index < items.length - 1) {
        // Swap Z-Index
        const currentZ = items[index].zIndex;
        const nextZ = items[index + 1].zIndex;
        items[index].zIndex = nextZ;
        items[index + 1].zIndex = currentZ;
      } else if (direction === 'down' && index > 0) {
        const currentZ = items[index].zIndex;
        const prevZ = items[index - 1].zIndex;
        items[index].zIndex = prevZ;
        items[index - 1].zIndex = currentZ;
      }
      return [...items];
    });
  };

  // Drag Interaction
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (isExporting) return;
    e.stopPropagation();
    const el = elements.find(item => item.id === id);
    if (!el) return;
    
    setSelectedId(id);
    setDragState({
      id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: el.x,
      initialY: el.y
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const visualWidth = rect.width;
    const actualWidth = canvasWidth;
    const multiplier = actualWidth / visualWidth;

    const dx = (e.clientX - dragState.startX) * multiplier;
    const dy = (e.clientY - dragState.startY) * multiplier;
    
    updateElement(dragState.id, {
      x: dragState.initialX + dx,
      y: dragState.initialY + dy
    });
  }, [dragState, canvasWidth]);

  useEffect(() => {
    const handleMouseUp = () => setDragState(null);
    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, handleMouseMove]);

  // Combined Export Utility
  const handleExport = async () => {
    if (!canvasRef.current) return;
    
    // Hide UI and reset selection for a clean capture
    const prevZoom = zoom;
    const prevSelected = selectedId;
    
    setIsExporting(true);
    setSelectedId(null);
    
    // Wait for state updates to propagate
    await new Promise(r => setTimeout(r, 100));
    
    // Set zoom to 1 for 1:1 pixel capture
    setZoom(1);
    
    // Wait for zoom animation to settle
    await new Promise(r => setTimeout(r, 800));
    
    try {
      const dataUrl = await toPng(canvasRef.current, {
        width: canvasWidth,
        height: canvasHeight,
        style: {
          transform: 'none',
          left: '0',
          top: '0',
          margin: '0',
          padding: '0',
          isolation: 'isolate',
          backgroundColor: bgColor
        },
        backgroundColor: bgColor,
        pixelRatio: 2,
        skipFonts: false,
      });

      const fileName = `art-atelier-${Date.now()}.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export Error:', err);
      // Fallback to dom-to-image-more if html-to-image fails
      try {
        const dataUrl = await domtoimage.toPng(canvasRef.current, {
          width: canvasWidth,
          height: canvasHeight,
          quality: 1,
        });
        const link = document.createElement('a');
        link.download = `art-atelier-fallback-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (innerErr) {
        alert('Impossibile completare l\'esportazione. Riprova.');
      }
    } finally {
      // Restore state
      setZoom(prevZoom);
      setSelectedId(prevSelected);
      setIsExporting(false);
    }
  };

  const clearCanvas = () => {
    if (isConfirmingClear) {
      setElements([]);
      setSelectedId(null);
      setIsConfirmingClear(false);
    } else {
      setIsConfirmingClear(true);
      setTimeout(() => setIsConfirmingClear(false), 3000);
    }
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F9F9F7] text-[#1A1A1A] font-sans">
      {/* Header */}
      <header className="h-16 border-b border-black flex items-center justify-between px-8 shrink-0 bg-white z-[60]">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-black rounded-sm flex items-center justify-center transform -rotate-6">
              <Sparkles className="text-white w-4 h-4" />
            </div>
            <span className="font-bold tracking-tighter text-xl">GRAPHIC_ATELIER.v1</span>
          </div>
          <nav className="hidden lg:flex gap-8 text-[11px] uppercase tracking-[0.3em] font-bold opacity-30">
            <span className="text-black opacity-100 border-b border-black pb-1 cursor-default">Main Workspace</span>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={clearCanvas}
            className={cn(
              "flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest transition-all py-2.5 px-5 border rounded-sm",
              isConfirmingClear 
                ? "bg-red-500 border-red-500 text-white shadow-inner" 
                : "bg-white border-black/10 text-black/40 hover:text-black hover:border-black"
            )}
          >
            <RotateCcw size={14} className={isConfirmingClear ? "animate-spin" : ""} /> 
            {isConfirmingClear ? 'CONFERMA?' : 'Svuota Tavolo'}
          </button>
          <button 
            onClick={handleExport}
            className="editorial-button-primary flex items-center gap-2 text-[10px] py-2 px-6"
          >
            {isExporting ? 'Processing...' : 'Export Production'} <Download size={14} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Left: Creation */}
        <aside className="w-80 border-r border-black flex flex-col shrink-0 bg-white z-50">
          {/* Workspace Controls moved to top of sidebar for visibility */}
          <div className="p-6 border-b border-black bg-gray-50">
            <label className="editorial-label block mb-4 italic">00 / Canvas Setup</label>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-1 text-center">
                <button 
                  onClick={() => setFormat('portrait')}
                  className={cn(
                    "px-2 py-2 border text-[9px] uppercase font-black tracking-tighter transition-all",
                    format === 'portrait' ? "bg-black text-white border-black" : "bg-white border-black/10 opacity-40 hover:opacity-100"
                  )}
                >
                  Portrait (4:5)
                </button>
                <button 
                  onClick={() => setFormat('square')}
                  className={cn(
                    "px-2 py-2 border text-[9px] uppercase font-black tracking-tighter transition-all",
                    format === 'square' ? "bg-black text-white border-black" : "bg-white border-black/10 opacity-40 hover:opacity-100"
                  )}
                >
                  Square (1:1)
                </button>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                {COLORS.map(c => (
                  <button 
                    key={c.hex}
                    onClick={() => setBgColor(c.hex)}
                    className={cn(
                      "w-8 h-8 rounded-full border border-black/20 transition-all",
                      bgColor === c.hex ? "ring-2 ring-black ring-offset-2 scale-110 shadow-lg" : "opacity-80 hover:opacity-100 hover:scale-105"
                    )}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
              
              <div className="grid grid-cols-5 gap-1">
                {TEXTURES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTexture(t.url)}
                    className={cn(
                      "px-1 py-1.5 border text-[7px] uppercase font-bold tracking-tighter transition-all truncate",
                      texture === t.url ? "bg-black text-white border-black" : "bg-white border-black/5 opacity-40 hover:opacity-100"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Base Materials */}
            <div className="p-6 border-b border-black">
              <label className="editorial-label block mb-4 italic">01 / Foundation</label>
              <div className="grid grid-cols-1 gap-2">
                {STATIONERY_ASSETS.filter(a => a.type === 'base').map(asset => (
                  <button 
                    key={asset.id}
                    onClick={() => addAsset(asset.id)}
                    className="w-full flex items-center justify-between p-4 border border-black/10 hover:border-black transition-all group"
                  >
                    <span className="text-[10px] uppercase font-bold tracking-widest">{asset.label}</span>
                    <Plus size={14} className="opacity-20 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>

            {/* Decorations */}
            <div className="p-6 border-b border-black">
              <label className="editorial-label block mb-4 italic">02 / Elements</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={addText}
                  className="w-full flex flex-col items-center gap-3 p-4 border border-black/10 hover:border-black transition-all group"
                >
                  <Type size={20} />
                  <span className="text-[10px] uppercase font-bold tracking-widest">Text</span>
                </button>
                {STATIONERY_ASSETS.filter(a => a.type === 'deco').map(asset => (
                  <button 
                    key={asset.id}
                    onClick={() => addAsset(asset.id)}
                    className="w-full flex flex-col items-center gap-3 p-4 border border-black/10 hover:border-black transition-all group"
                  >
                    <FileImage size={20} />
                    <span className="text-[10px] uppercase font-bold tracking-widest">{asset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Geometry / Shapes */}
            <div className="p-6 border-b border-black">
              <label className="editorial-label block mb-4 italic">02.1 / Geometry</label>
              <div className="grid grid-cols-3 gap-2">
                {STATIONERY_ASSETS.filter(a => a.type === 'shape').map(asset => (
                  <button 
                    key={asset.id}
                    onClick={() => addAsset(asset.id)}
                    className="aspect-square flex flex-col items-center justify-center p-2 border border-black/5 hover:border-black transition-all"
                  >
                    <div className="w-6 h-6 border border-black/20 rounded-sm mb-2" />
                    <span className="text-[8px] uppercase font-bold text-center leading-tight">{asset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stickers */}
            <div className="p-6 border-b border-black">
              <label className="editorial-label block mb-4 italic">02.5 / Stickers</label>
              <div className="grid grid-cols-4 gap-2">
                {STICKERS.map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => addEmoji(emoji)}
                    className="aspect-square flex items-center justify-center p-2 border border-black/5 hover:border-black transition-all text-xl"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Node Hierarchy */}
            <div className="p-6">
              <label className="editorial-label block mb-4 italic">04 / Layers</label>
              <div className="space-y-1">
                {elements.slice().reverse().map((el) => (
                  <div 
                    key={el.id}
                    onClick={() => setSelectedId(el.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 border text-[10px] uppercase font-bold transition-all cursor-pointer",
                      selectedId === el.id ? "bg-black text-white border-black" : "border-black/5 hover:border-black/20"
                    )}
                  >
                    <span className="truncate max-w-[120px]">{el.type === 'text' ? el.content : el.content}</span>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); changeLayer(el.id, 'up'); }} className="opacity-40 hover:opacity-100"><ChevronUp size={12}/></button>
                      <button onClick={(e) => { e.stopPropagation(); changeLayer(el.id, 'down'); }} className="opacity-40 hover:opacity-100"><ChevronDown size={12}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Global Canvas Render Area */}
        <section className="flex-1 bg-[#EBEBE8] p-8 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Visual Guides */}
          {!isExporting && (
            <>
              <div className="absolute top-8 left-12 editorial-label italic select-none opacity-20">
                Studio_Instance // v1.0
              </div>
              <div className="absolute bottom-8 right-12 text-[9px] opacity-20 font-mono tracking-tighter uppercase select-none">
                {canvasWidth} x {canvasHeight} PX | {format.toUpperCase()}
              </div>
            </>
          )}

          <div className="absolute bottom-8 left-12 flex items-center gap-4 z-50">
             <button onClick={() => setZoom(Math.max(0.1, zoom - 0.05))} className="p-2 bg-white border border-black hover:bg-black hover:text-white transition-colors"><Minus size={14}/></button>
             <span className="text-[10px] font-bold w-12 text-center uppercase tracking-widest">{Math.round(zoom * 100)}%</span>
             <button onClick={() => setZoom(Math.min(1, zoom + 0.05))} className="p-2 bg-white border border-black hover:bg-black hover:text-white transition-colors"><Plus size={14}/></button>
          </div>

          <div 
            className="flex-1 overflow-auto bg-[#D1D1CB] p-20 flex items-start justify-center min-h-0 relative"
          >
            <div 
              ref={canvasRef}
              data-canvas="true"
              style={{ 
                backgroundColor: bgColor,
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                transition: isExporting ? 'none' : 'transform 0.3s ease-out',
                isolation: 'isolate'
              }}
              className={cn(
                "shadow-[80px_80px_150px_-40px_rgba(0,0,0,0.15)] relative flex-shrink-0 select-none overflow-hidden",
                isExporting && "is-exporting"
              )}
              onClick={() => setSelectedId(null)}
            >
                <div 
                  className="absolute inset-0 pointer-events-none z-0" 
                  style={{ 
                    backgroundColor: bgColor,
                    backgroundImage: texture !== 'none' ? `url("${texture}")` : 'none',
                    backgroundBlendMode: 'multiply',
                    backgroundSize: texture.includes('felt') ? '400px 400px' : '48px 48px'
                  }} 
                />

              <div className="absolute inset-0 pointer-events-none z-[10] bg-gradient-to-tr from-black/[0.04] to-transparent" />
              
              <AnimatePresence>
                {[...elements].sort((a, b) => a.zIndex - b.zIndex).map((el) => (
                    <motion.div
                      key={el.id}
                      onMouseDown={(e) => handleMouseDown(e, el.id)}
                      onClick={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
                      className={cn(
                        "absolute cursor-move group transition-shadow",
                        selectedId === el.id && !isExporting ? "ring-2 ring-black ring-offset-[8px] ring-offset-transparent" : "",
                        el.type === 'stationery' && el.content !== 'divider' && "shadow-xl",
                        el.type === 'emoji' && "shadow-md rounded-full bg-white/10"
                      )}
                    style={{
                      left: el.x,
                      top: el.y,
                      transform: `rotate(${el.rotation}deg) scale(${el.scale})`,
                      zIndex: el.zIndex,
                      opacity: el.opacity ?? 1,
                      transformOrigin: 'center center'
                    }}
                  >
                    {el.type === 'text' ? (
                      <div 
                        style={{ 
                          color: el.color, 
                          fontSize: el.fontSize, 
                          fontFamily: el.fontFamily,
                          letterSpacing: `${el.letterSpacing}px`,
                          lineHeight: el.lineHeight,
                          textAlign: el.textAlign,
                          fontStyle: el.isItalic ? 'italic' : 'normal',
                          fontWeight: el.isBold ? '700' : '400',
                          whiteSpace: 'pre-wrap',
                          minWidth: '100px'
                        }}
                        className="p-8 leading-none select-none"
                      >
                        {el.content}
                      </div>
                    ) : el.type === 'emoji' ? (
                      <div className="p-4 text-6xl flex items-center justify-center drop-shadow-md select-none">
                        {el.content}
                      </div>
                    ) : (
                      <div className="p-8 select-none">
                        <StationeryGraphic type={el.content} color={el.color} />
                      </div>
                    )}

                    {/* Selection Box Handles */}
                    {selectedId === el.id && !isExporting && (
                       <>
                         <div className="canvas-handle top-0 left-0" />
                         <div className="canvas-handle top-0 right-0" style={{ left: '100%' }} />
                         <div className="canvas-handle bottom-0 left-0" style={{ top: '100%' }} />
                         <div className="canvas-handle bottom-0 right-0" style={{ top: '100%', left: '100%' }} />
                       </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Sidebar Right: Parameters */}
        <aside className="w-80 border-l border-black flex flex-col shrink-0 bg-white z-50">
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 mb-8 opacity-40">
              <Settings2 size={14} />
              <label className="editorial-label block uppercase">Proprietà Elemento</label>
            </div>
            {selectedElement ? (
              <div className="space-y-10">
                {/* Header for selected element */}
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase font-black bg-black text-white px-2 py-1">
                    {selectedElement.type.toUpperCase()}_{selectedElement.id.substring(0,4)}
                  </div>
                  <button 
                    onClick={() => {
                      setElements(elements.filter(el => el.id !== selectedId));
                      setSelectedId(null);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 px-3 border border-red-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {/* Text Specifics */}
                {selectedElement.type === 'text' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold opacity-40">Message_Input</label>
                       <textarea 
                        value={selectedElement.content}
                        onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                        className="w-full bg-gray-50 border border-black/10 p-4 font-serif text-lg focus:outline-none focus:border-black resize-none h-32"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold opacity-40">Font_Family</label>
                      <div className="space-y-1">
                        {FONTS.map(f => (
                          <button
                            key={f.name}
                            onClick={() => updateElement(selectedElement.id, { fontFamily: f.family })}
                            className={cn(
                              "w-full text-left p-3 border transition-colors text-[11px]",
                              selectedElement.fontFamily === f.family ? "bg-black text-white" : "hover:bg-gray-100 border-black/5"
                            )}
                            style={{ fontFamily: f.family }}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                       <button 
                        onClick={() => updateElement(selectedElement.id, { isBold: !selectedElement.isBold })}
                        className={cn("p-3 border flex justify-center", selectedElement.isBold ? "bg-black text-white" : "border-black/5")}
                       >
                         <Bold size={16} />
                       </button>
                       <button 
                        onClick={() => updateElement(selectedElement.id, { isItalic: !selectedElement.isItalic })}
                        className={cn("p-3 border flex justify-center", selectedElement.isItalic ? "bg-black text-white" : "border-black/5")}
                       >
                         <Italic size={16} />
                       </button>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] uppercase font-bold opacity-40">Allineamento</label>
                      <div className="flex gap-1 bg-gray-50 p-1 border border-black/5">
                        {(['left', 'center', 'right'] as const).map(align => (
                          <button
                            key={align}
                            onClick={() => updateElement(selectedElement.id, { textAlign: align })}
                            className={cn(
                              "flex-1 p-2 flex justify-center transition-colors",
                              selectedElement.textAlign === align ? "bg-black text-white" : "hover:bg-gray-200"
                            )}
                          >
                            {align === 'left' && <AlignLeft size={16} />}
                            {align === 'center' && <AlignCenter size={16} />}
                            {align === 'right' && <AlignRight size={16} />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-black/5">
                      <div>
                        <div className="flex justify-between text-[10px] uppercase mb-4"><span>Interlinea</span><span>{selectedElement.lineHeight}</span></div>
                        <div className="h-[1px] bg-black/10 relative">
                          <input 
                            type="range" min="0.5" max="3" step="0.1" 
                            value={selectedElement.lineHeight} 
                            onChange={(e) => updateElement(selectedElement.id, { lineHeight: parseFloat(e.target.value) })}
                            className="w-full absolute -top-1.5 accent-black h-4 cursor-pointer" 
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] uppercase mb-4"><span>Tracking</span><span>{selectedElement.letterSpacing}px</span></div>
                        <div className="h-[1px] bg-black/10 relative">
                          <input 
                            type="range" min="-10" max="40" step="1" 
                            value={selectedElement.letterSpacing} 
                            onChange={(e) => updateElement(selectedElement.id, { letterSpacing: parseInt(e.target.value) })}
                            className="w-full absolute -top-1.5 accent-black h-4 cursor-pointer" 
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] uppercase mb-4"><span>Font_Size</span><span>{selectedElement.fontSize}px</span></div>
                        <div className="h-[1px] bg-black/10 relative">
                          <input 
                            type="range" min="12" max="300" step="1" 
                            value={selectedElement.fontSize} 
                            onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                            className="w-full absolute -top-1.5 accent-black h-4 cursor-pointer" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transform (Shared) */}
                <div className="space-y-8 pt-8 border-t border-black">
                   <div className="space-y-2">
                     <div className="flex justify-between text-[10px] uppercase mb-4"><span>Rotation</span><span>{selectedElement.rotation}°</span></div>
                     <div className="h-[1px] bg-black/10 relative">
                        <input 
                          type="range" min="0" max="360" step="1" 
                          value={selectedElement.rotation} 
                          onChange={(e) => updateElement(selectedElement.id, { rotation: parseInt(e.target.value) })}
                          className="w-full absolute -top-1.5 accent-black h-4 cursor-pointer" 
                        />
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] uppercase font-bold opacity-40">Scale_Factor</label>
                     <div className="flex gap-2">
                        <button onClick={() => updateElement(selectedId!, { scale: Math.max(0.1, selectedElement.scale - 0.1) })} className="flex-1 p-3 border border-black/10 hover:border-black flex justify-center"><Minus size={14}/></button>
                        <button onClick={() => updateElement(selectedId!, { scale: selectedElement.scale + 0.1 })} className="flex-1 p-3 border border-black/10 hover:border-black flex justify-center"><Plus size={14}/></button>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] uppercase font-bold opacity-40">Opacità</label>
                     <div className="h-[1px] bg-black/10 relative">
                        <input 
                          type="range" min="0" max="1" step="0.01" 
                          value={selectedElement.opacity ?? 1} 
                          onChange={(e) => updateElement(selectedElement.id, { opacity: parseFloat(e.target.value) })}
                          className="w-full absolute -top-1.5 accent-black h-4 cursor-pointer" 
                        />
                     </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-bold opacity-40">Color_Palette</label>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map(c => (
                        <button 
                          key={c.hex}
                          onClick={() => updateElement(selectedElement.id, { color: c.hex })}
                          className={cn(
                            "w-7 h-7 rounded-full border border-black transition-all active:scale-95",
                            selectedElement.color === c.hex && "scale-110 ring-2 ring-black ring-offset-2"
                          )}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 flex flex-col gap-2">
                    <button 
                      onClick={() => {
                        const newEl = { ...selectedElement, id: Math.random().toString(36).substr(2, 9), x: selectedElement.x + 30, y: selectedElement.y + 30, zIndex: elements.length + 100 };
                        setElements([...elements, newEl]);
                        setSelectedId(newEl.id);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-4 border border-black uppercase text-[10px] font-black tracking-widest hover:bg-black hover:text-white transition-all"
                    >
                      <Copy size={14} /> Duplicate Layout Node
                    </button>
                    <button 
                      onClick={() => { setElements(elements.filter(el => el.id !== selectedId)); setSelectedId(null); }}
                      className="w-full flex items-center justify-center gap-2 py-4 border border-red-500 text-red-500 uppercase text-[10px] font-black tracking-widest hover:bg-red-50 transition-all mt-2"
                    >
                      <Trash2 size={14} /> Remove Permanently
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-10">
                <div className="p-8 border border-dashed border-black/10 text-center bg-gray-50 uppercase">
                  <MousePointer2 className="mx-auto mb-4 opacity-10" size={32} />
                  <p className="text-[10px] font-black tracking-widest opacity-30">Seleziona un elemento<br/>per editarne le proprietà</p>
                </div>
                
                <div className="space-y-8 pt-10 border-t border-black/5">
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-bold opacity-40 italic">Configurazione Canvas</label>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                       <button 
                        onClick={() => setFormat('portrait')}
                        className={cn(
                          "px-2 py-3 border text-[9px] uppercase font-black transition-all",
                          format === 'portrait' ? "bg-black text-white border-black" : "bg-white border-black/10 opacity-50"
                        )}
                      >
                        4:5 Story
                      </button>
                      <button 
                        onClick={() => setFormat('square')}
                        className={cn(
                          "px-2 py-3 border text-[9px] uppercase font-black transition-all",
                          format === 'square' ? "bg-black text-white border-black" : "bg-white border-black/10 opacity-50"
                        )}
                      >
                        1:1 Square
                      </button>
                    </div>

                    <div className="space-y-4 pt-6 text-center">
                      <div className="flex justify-between text-[9px] uppercase font-black opacity-30"><span>Sfondo</span><span>{COLORS.find(c => c.hex === bgColor)?.name}</span></div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {COLORS.map(c => (
                          <button 
                            key={c.hex}
                            onClick={() => setBgColor(c.hex)}
                            className={cn(
                              "w-6 h-6 rounded-full border border-black transition-all active:scale-95",
                              bgColor === c.hex && "ring-2 ring-black ring-offset-2 scale-110"
                            )}
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <div className="flex justify-between text-[9px] uppercase font-black opacity-30"><span>Texture Globale</span></div>
                      <div className="grid grid-cols-2 gap-1">
                        {TEXTURES.map(t => (
                          <button
                            key={t.id}
                            onClick={() => setTexture(t.url)}
                            className={cn(
                              "px-2 py-2 border text-[9px] uppercase font-black tracking-widest transition-all",
                              texture === t.url ? "bg-black text-white" : "bg-white hover:bg-gray-50 border-black/10"
                            )}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Footer Status */}
      <footer className="h-10 border-t border-black px-8 flex items-center justify-between shrink-0 bg-black text-white text-[9px] uppercase tracking-[0.4em] font-black">
        <div className="flex gap-12">
          <span className="flex items-center gap-3">
             <span className="w-1.5 h-1.5 bg-[#00FFBD] rounded-full shadow-[0_0_10px_#00FFBD]"></span>
             Engine: Studio_Manuale_v4.2
          </span>
          <span className="opacity-40">Objects: {elements.length}</span>
          <span className="opacity-40 hidden md:inline">Z-Depth: Managed</span>
        </div>
        <div className="opacity-30">
           © MMXXVI TYPO GRAPHIC ATELIER.SYSTEMS
        </div>
      </footer>

      {/* Exporting Overlay */}
      <AnimatePresence>
        {isExporting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/90 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center"
          >
             <div className="w-64 h-0.5 bg-black/10 overflow-hidden relative mb-6">
                <motion.div 
                  className="absolute inset-0 bg-black"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                />
             </div>
             <span className="text-[12px] uppercase font-black tracking-[0.6em] animate-pulse">Encoding High Density Design Unit...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
