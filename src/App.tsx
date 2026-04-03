import React, { useState, useRef, useEffect } from 'react';
import { Upload, Moon, Sun, Loader2, Search, Hand, MousePointer2, Compass, Book, Wand2, Sparkles, Trash2, Undo, Download, RotateCcw } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { ANALYSIS, IMAGE_GEN, ANALYSIS_FALLBACK, IMAGE_GEN_FALLBACK } from './constants';

// --- Constants for Discrete Parameters ---
const ANGLES = ['12:00', '1:30', '3:00', '04:30', '06:00', '07:30', '09:00', '10:30'];

const ALTITUDES = [
  { label: "-2.0m (Worm's Eye View)", value: -2.0 },
  { label: "0m (Low Angle View)", value: 0 },
  { label: "1.6m (Eye Level View)", value: 1.6 },
  { label: "10m (Low Aerial View)", value: 10 },
  { label: "50m (Mid Aerial View)", value: 50 },
  { label: "150m (Bird's Eye View)", value: 150 },
  { label: "200m (High Angle Orbit)", value: 200 },
  { label: "300m (Top-Down Aerial View)", value: 300 }
];

const LENSES = [
  { label: "23mm (Tilt-Shift Lens)", value: 23 },
  { label: "24mm (Wide Lens)", value: 24 },
  { label: "32mm (Aerial Lens)", value: 32 },
  { label: "35mm (Wide Standard Lens)", value: 35 },
  { label: "45mm (Standard Lens)", value: 45 },
  { label: "50mm (Normal Lens)", value: 50 },
  { label: "85mm (Short Telephoto Lens)", value: 85 },
  { label: "110mm (Macro Lens)", value: 110 }
];

const TIMES = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

// --- 5-IVSP Protocol Helper ---
// --- 5-IVSP Protocol Helper ---
const determineScenario = (angleStr: string, altitude: number, lens: number) => {
  if (altitude > 150) return '[Scenario B] Aerial View (High Altitude): Phase One + 32mm';
  if (lens > 85) return '[Scenario C] Detail View (Macro): 110mm Macro';
  if (angleStr === '04:30' || angleStr === '07:30') return '[Scenario D] General View (Quarter): 45mm Standard';
  return '[Scenario A] Street View: Fujifilm GFX 100S + 23mm Tilt-Shift';
};

// V70/V71: Map 5-IVSP Angle to 3x3 Cross Layout Slots
// NEW Cross Layout: Row0=[_,REAR,_], Row1=[LEFT,TOP,RIGHT], Row2=[_,FRONT,_]
const getElevationSlot = (angle: string): { row: number; col: number; label: string }[] => {
  if (angle === '06:00') return [{ row: 2, col: 1, label: 'FRONT' }];
  if (angle === '12:00') return [{ row: 0, col: 1, label: 'REAR' }];
  if (angle === '3:00')  return [{ row: 1, col: 2, label: 'RIGHT' }];
  if (angle === '09:00') return [{ row: 1, col: 0, label: 'LEFT' }];
  // Corner angles → composite (both adjacent faces)
  if (angle === '1:30')  return [{ row: 0, col: 1, label: 'REAR' },  { row: 1, col: 2, label: 'RIGHT' }];
  if (angle === '04:30') return [{ row: 1, col: 2, label: 'RIGHT' }, { row: 2, col: 1, label: 'FRONT' }];
  if (angle === '07:30') return [{ row: 2, col: 1, label: 'FRONT' }, { row: 1, col: 0, label: 'LEFT' }];
  if (angle === '10:30') return [{ row: 1, col: 0, label: 'LEFT' },  { row: 0, col: 1, label: 'REAR' }];
  return [{ row: 2, col: 1, label: 'FRONT' }];
};

// V70: Crop a single elevation cell from the 3x3 Cross Layout sheet
const cropElevationFromSheet = (sheetDataUrl: string, slot: { row: number; col: number; label: string }): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const cellW = Math.floor(img.width / 3);
      const cellH = Math.floor(img.height / 3);
      const canvas = document.createElement('canvas');
      canvas.width = cellW;
      canvas.height = cellH;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context unavailable')); return; }
      ctx.drawImage(img, slot.col * cellW, slot.row * cellH, cellW, cellH, 0, 0, cellW, cellH);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = sheetDataUrl;
  });
};


// SVG-based Viewpoint Diagram Component
const SitePlanDiagram = ({ angle, lens, isAnalyzing, analysisStep, visibleV0Index }: { 
  angle: string, 
  lens: number, 
  isAnalyzing: boolean, 
  analysisStep: string, 
  visibleV0Index?: number | null 
}) => {
  // Mapping clock-face strings to degrees
  const angleMap: Record<string, number> = {
    '12:00': 0, '1:30': 45, '3:00': 90, '04:30': 135,
    '06:00': 180, '07:30': 225, '09:00': 270, '10:30': 315
  };

  const rotation = angleMap[angle] !== undefined ? angleMap[angle] : 180;
  const radius = 90; // Circular orbit radius
  const cx = 100;
  const cy = 100;

  // Calculate Camera Position on the orbit
  const rad = (rotation - 90) * (Math.PI / 180);
  const cameraX = cx + radius * Math.cos(rad);
  const cameraY = cy + radius * Math.sin(rad);

  return (
    <div className="w-full aspect-square relative flex items-center justify-center overflow-hidden transition-colors duration-300">
      {/* Central Building Representation */}
      <div className="absolute w-[80%] h-[80%] flex items-center justify-center z-0">
        <div className="relative w-[60%] h-[40%] bg-black dark:bg-white flex items-center justify-center z-0 overflow-hidden border border-white/50">
          {/* Diagonal Pattern Overlay */}
          <div className="absolute inset-0 opacity-50 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,white_2px,white_4px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,black_2px,black_4px)]" />
        </div>
      </div>

      {/* Optical Orbit and Camera Tracker */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full z-10 pointer-events-none">
        {/* Orbit Path (Dashed Circle) */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none" stroke="currentColor" strokeWidth="1"
          strokeDasharray="8 4"
          className="text-black/30 dark:text-white/30"
        />

        {/* Camera Visual Target (Dot) */}
        <g transform={`translate(${cameraX}, ${cameraY}) rotate(${rotation})`}>
          <circle cx="0" cy="0" r="4.0" fill="currentColor" className="text-black dark:text-white" />
        </g>
      </svg>
      
      {/* Analyzing Overlay */}
      {isAnalyzing && (
        <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-30 transition-colors duration-300">
          <Loader2 size={32} className="animate-spin mb-3" />
          <p className="font-display text-xs uppercase tracking-widest text-center px-4">{analysisStep || 'Analyzing...'}</p>
        </div>
      )}
    </div>
  );
};

// --- IndexedDB Persistence Utilities ---
const DB_NAME = 'cai-canvas-db';
const DB_VERSION = 1;
const STORE_CANVAS = 'canvasState';
const STATE_KEY = 'current';

const openDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_CANVAS);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const dbSave = async (data: any) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CANVAS, 'readwrite');
    tx.objectStore(STORE_CANVAS).put(data, STATE_KEY);
    await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
    db.close();
  } catch (e) { console.warn('[IndexedDB] Save failed:', e); }
};

const dbLoad = async (): Promise<any> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CANVAS, 'readonly');
    const result = await new Promise<any>((res, rej) => {
      const req = tx.objectStore(STORE_CANVAS).get(STATE_KEY);
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
    db.close();
    return result;
  } catch (e) { console.warn('[IndexedDB] Load failed:', e); return null; }
};

interface CanvasItem {
  id: string;
  type: 'upload' | 'generated';
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  // V74: Metadata linking
  motherId: string | null;
  parameters: {
    angleIndex: number;
    altitudeIndex: number;
    lensIndex: number;
    timeIndex: number;
    analyzedOpticalParams?: any | null;
    elevationParams?: any | null;
    sitePlanImage?: string | null;
    architecturalSheetImage?: string | null;
    elevationImages?: Record<string, string> | null;
    bldgRatio?: { width: number; depth: number; height: number } | null;
  } | null;
}

export default function App() {
  // --- State ---
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Drag & Resize Refs (Ref 기반 — stale closure 방지)
  const isDraggingItemRef = useRef(false);
  const isResizingItemRef = useRef(false);
  const isDraggingPanRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0, itemX: 0, itemY: 0 });
  const resizeCornerRef = useRef({ dx: 1, dy: 1 });
  // Keep State for render (cursor CSS)
  const [isDraggingItem, setIsDraggingItem] = useState(false);
  const [isResizingItem, setIsResizingItem] = useState(false);
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  

  // PRD Parameters
  const [prompt, setPrompt] = useState('');
  const [angleIndex, setAngleIndex] = useState<number>(4); // 06:00
  const [altitudeIndex, setAltitudeIndex] = useState<number>(2); // 1.6m
  const [lensIndex, setLensIndex] = useState<number>(0); // 23mm
  const [timeIndex, setTimeIndex] = useState<number>(2); // 12:00
  const [elevationParams, setElevationParams] = useState<any>(null);
  
  // Analyzed (Read-only) Parameters for UI Display
  const [analyzedOpticalParams, setAnalyzedOpticalParams] = useState<{
    angle: string;
    altitude: string;
    lens: string;
    time: string;
  } | null>(null);
  
  // UI State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sitePlanImage, setSitePlanImage] = useState<string | null>(null);
  const [architecturalSheetImage, setArchitecturalSheetImage] = useState<string | null>(null);

  // V25: Extended UI State
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [visibleV0Index, setVisibleV0Index] = useState<number | null>(null);

  // Zoom & Pan State
  const [canvasZoom, setCanvasZoom] = useState(100);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [focusMode, setFocusMode] = useState<'all' | 'target'>('all');
  const [canvasMode, setCanvasMode] = useState<'select' | 'pan'>('select');

  // V75: Item-bound Library State
  const [openLibraryItemId, setOpenLibraryItemId] = useState<string | null>(null);

  // V75: History State for Undo
  const [historyStates, setHistoryStates] = useState<CanvasItem[][]>([]);
  const handleUndo = () => {
    if (historyStates.length > 0) {
      setCanvasItems(historyStates[historyStates.length - 1]);
      setHistoryStates(prev => prev.slice(0, -1));
      setSelectedItemId(null); // Optional: clear selection on undo
    }
  };

  // Touch State Refs
  const lastTouchDist = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number, y: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLElement>(null); // V54: Absolute ref for canvas section

  // V74: Responsive Scale State
  const [appScale, setAppScale] = useState(1);

  // --- Effects ---
  // V74: Synchronize selected item's parameters to UI panels, and reset on deselect
  useEffect(() => {
    if (!selectedItemId) {
      // Background click -> Reset to default empty state
      setAngleIndex(4);
      setAltitudeIndex(2);
      setLensIndex(0);
      setTimeIndex(2);
      setAnalyzedOpticalParams(null);
      setElevationParams(null);
      setSitePlanImage(null);
      setArchitecturalSheetImage(null);
      return;
    }

    const item = canvasItems.find(i => i.id === selectedItemId);
    if (item && item.parameters) {
      // Object-oriented state sync
      setAngleIndex(item.parameters.angleIndex);
      setAltitudeIndex(item.parameters.altitudeIndex);
      setLensIndex(item.parameters.lensIndex);
      setTimeIndex(item.parameters.timeIndex);
      setAnalyzedOpticalParams(item.parameters.analyzedOpticalParams || null);
      setElevationParams(item.parameters.elevationParams || null);
      setSitePlanImage(item.parameters.sitePlanImage || null);
      setArchitecturalSheetImage(item.parameters.architecturalSheetImage || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItemId]); // only trigger on selection change

  useEffect(() => {
    // Determine the scale based on a reference resolution (e.g., 1440x900 or 1920x1080)
    const updateScale = () => {
      const baseWidth = 1440;
      const baseHeight = 900;
      const widthRatio = window.innerWidth / baseWidth;
      const heightRatio = window.innerHeight / baseHeight;
      // Scale to fit within the viewport (maintains aspect ratio, leaves letterboxing if window is not 16:10)
      const scale = Math.min(widthRatio, heightRatio);
      setAppScale(scale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // --- IndexedDB Auto-Load on Mount ---
  const [dbLoaded, setDbLoaded] = useState(false);
  useEffect(() => {
    dbLoad().then((saved) => {
      if (saved) {
        if (Array.isArray(saved.canvasItems)) setCanvasItems(saved.canvasItems);
        if (typeof saved.canvasZoom === 'number') setCanvasZoom(saved.canvasZoom);
        if (saved.canvasOffset) setCanvasOffset(saved.canvasOffset);
        console.log('%c[IndexedDB] Canvas state restored successfully.', 'color: #047857; font-weight: bold;');
      }
      setDbLoaded(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- IndexedDB Auto-Save on Change ---
  useEffect(() => {
    if (!dbLoaded) return; // Don't save until initial load is done
    const timer = setTimeout(() => {
      dbSave({ canvasItems, canvasZoom, canvasOffset });
      console.log('%c[IndexedDB] Canvas state auto-saved.', 'color: #1d4ed8;');
    }, 800); // 800ms debounce
    return () => clearTimeout(timer);
  }, [canvasItems, canvasZoom, canvasOffset, dbLoaded]);


  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // --- Handlers ---
  const ZOOM_STEPS_BUTTON = [10, 25, 50, 75, 100, 125, 150];

  const zoomStep = (dir: 1 | -1) => {
    setCanvasZoom(prev => {
      if (dir === 1) {
        const next = ZOOM_STEPS_BUTTON.find(v => v > prev);
        return next !== undefined ? next : 150;
      } else {
        const next = [...ZOOM_STEPS_BUTTON].reverse().find(v => v < prev);
        return next !== undefined ? next : 10;
      }
    });
  };



  const handleFocus = () => {
    if (canvasItems.length === 0) {
      setCanvasZoom(100);
      setCanvasOffset({ x: 0, y: 0 });
      return;
    }

    if (focusMode === 'all') {
      // Fit All
      const minX = Math.min(...canvasItems.map(i => i.x));
      const minY = Math.min(...canvasItems.map(i => i.y));
      const maxX = Math.max(...canvasItems.map(i => i.x + i.width));
      const maxY = Math.max(...canvasItems.map(i => i.y + i.height));
      
      const width = maxX - minX;
      const height = maxY - minY;
      const cx = minX + width / 2;
      const cy = minY + height / 2;
      
      const padding = 100;
      // V54: Panel is overlay so viewport = full window width
      const sectionW = window.innerWidth;
      const sectionH = window.innerHeight;
      
      const scaleX = (sectionW - padding) / width;
      const scaleY = (sectionH - padding) / height;
      const scale = Math.min(scaleX, scaleY, 1) * 100; // max zoom 100%
      
      setCanvasZoom(Math.max(scale, 10)); // min zoom 10
      setCanvasOffset({ 
        x: -cx * (scale / 100), 
        y: -cy * (scale / 100) 
      });
      setFocusMode('target');
    } else {
      // Focus Target (selected or last)
      const targetItem = selectedItemId 
        ? canvasItems.find(i => i.id === selectedItemId) 
        : canvasItems[canvasItems.length - 1];
        
      if (targetItem) {
        const cx = targetItem.x + targetItem.width / 2;
        const cy = targetItem.y + targetItem.height / 2;
        
        setCanvasZoom(100);
        setCanvasOffset({ 
          x: -cx, 
          y: -cy 
        });
      }
      setFocusMode('all');
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Web Zoom (No Ctrl needed as per user request for Miro-style)
    e.preventDefault();
    const zoomFactor = -e.deltaY * 0.1;
    setCanvasZoom(prev => Math.min(Math.max(prev + zoomFactor, 10), 150));
  };

  const getCanvasCoords = (clientX: number, clientY: number) => {
    const scale = canvasZoom / 100;
    
    // V55: Use ABSOLUTE screen center as the fixed origin.
    // This is the most robust way to ensure selection calibration 
    // matches the visual center of the fullscreen canvas.
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    
    return {
      x: (clientX - cx - canvasOffset.x) / scale,
      y: (clientY - cy - canvasOffset.y) / scale
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const isUIInteraction = (e.target as HTMLElement).closest('.pointer-events-auto');
    if (isUIInteraction) return;

    const coords = getCanvasCoords(e.clientX, e.clientY);

    if (canvasMode === 'pan') {
      // In Pan mode, clicking ANYTHING (including images) leads to Panning.
      isDraggingPanRef.current = true;
      setIsDraggingPan(true);
      dragStartRef.current = { x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    // --- Select Mode ---

    // 1. Check Resize Handles first (if an item is selected)
    if (selectedItemId) {
      const item = canvasItems.find(i => i.id === selectedItemId);
      if (item) {
        const scale = canvasZoom / 100;
        const hitRadius = 15 / scale;

        // 4 corner definitions: position + resize direction multipliers
        const corners = [
          { x: item.x,              y: item.y,               dx: -1, dy: -1, cursor: 'nwse-resize' }, // top-left
          { x: item.x + item.width, y: item.y,               dx:  1, dy: -1, cursor: 'nesw-resize' }, // top-right
          { x: item.x,              y: item.y + item.height, dx: -1, dy:  1, cursor: 'nesw-resize' }, // bottom-left
          { x: item.x + item.width, y: item.y + item.height, dx:  1, dy:  1, cursor: 'nwse-resize' }, // bottom-right
        ];

        for (const corner of corners) {
          const dist = Math.hypot(coords.x - corner.x, coords.y - corner.y);
          if (dist < hitRadius) {
            isResizingItemRef.current = true;
            setIsResizingItem(true);
            resizeCornerRef.current = { dx: corner.dx, dy: corner.dy };
            resizeStartRef.current = { x: coords.x, y: coords.y, width: item.width, height: item.height, itemX: item.x, itemY: item.y };
            e.currentTarget.setPointerCapture(e.pointerId);
            return;
          }
        }
      }
    }

    // 2. Check Image Click for Selection/Drag
    const clickedItem = [...canvasItems].reverse().find(item => 
      coords.x >= item.x && coords.x <= item.x + item.width &&
      coords.y >= item.y && coords.y <= item.y + item.height
    );

    if (clickedItem) {
      setSelectedItemId(clickedItem.id);
      isDraggingItemRef.current = true;
      setIsDraggingItem(true);
      dragOffsetRef.current = { x: coords.x - clickedItem.x, y: coords.y - clickedItem.y };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    // 3. Background click in Select Mode → Panning
    setSelectedItemId(null);
    setOpenLibraryItemId(null); // V81: Close library on background click
    isDraggingPanRef.current = true;
    setIsDraggingPan(true);
    dragStartRef.current = { x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);

    if (isDraggingPanRef.current) {
      setCanvasOffset({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    } else if (isDraggingItemRef.current && selectedItemId) {
      setCanvasItems(prev => prev.map(item => 
        item.id === selectedItemId 
          ? { ...item, x: coords.x - dragOffsetRef.current.x, y: coords.y - dragOffsetRef.current.y }
          : item
      ));
    } else if (isResizingItemRef.current && selectedItemId) {
      const dx = coords.x - resizeStartRef.current.x;
      const dy = coords.y - resizeStartRef.current.y;
      const aspect = resizeStartRef.current.width / resizeStartRef.current.height;

      setCanvasItems(prev => prev.map(item => {
        if (item.id !== selectedItemId) return item;

        // Width changes: right corner → expand right, left corner → expand left (flip sign)
        const rawDeltaW = dx * resizeCornerRef.current.dx;
        const newWidth = Math.max(resizeStartRef.current.width + rawDeltaW, 50);
        const newHeight = newWidth / aspect;

        // Position: left corners move x; top corners move y
        const newX = resizeCornerRef.current.dx === -1
          ? resizeStartRef.current.itemX + (resizeStartRef.current.width - newWidth)
          : resizeStartRef.current.itemX;
        const newY = resizeCornerRef.current.dy === -1
          ? resizeStartRef.current.itemY + (resizeStartRef.current.height - newHeight)
          : resizeStartRef.current.itemY;

        return { ...item, x: newX, y: newY, width: newWidth, height: newHeight };
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingPanRef.current = false;
    isDraggingItemRef.current = false;
    isResizingItemRef.current = false;
    setIsDraggingPan(false);
    setIsDraggingItem(false);
    setIsResizingItem(false);
    if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  // --- Tablet Touch Handlers ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      };
      lastTouchDist.current = dist;
      lastTouchCenter.current = { x: center.x - canvasOffset.x, y: center.y - canvasOffset.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      // 1. Pinch Zoom
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      if (lastTouchDist.current !== null) {
        const delta = (dist - lastTouchDist.current) * 0.5;
        setCanvasZoom(prev => Math.min(Math.max(prev + delta, 10), 150));
      }
      lastTouchDist.current = dist;

      // 2. Two-Finger Pan (Absolute screen coordinates for smoothness)
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      };
      if (lastTouchCenter.current !== null) {
        setCanvasOffset({
          x: center.x - lastTouchCenter.current.x,
          y: center.y - lastTouchCenter.current.y
        });
      }
    }
  };

  const handleTouchEnd = () => {
    lastTouchDist.current = null;
    lastTouchCenter.current = null;
  };

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        
        // Load image to get dimensions for initial canvas item
        const img = new Image();
        img.onload = () => {
          const newItemId = `item-${Date.now()}`;
          // Calculate Y position: Place below the bottom-most item if exists
          let newY = -img.height / 2;
          let newX = -img.width / 2;
          
          if (canvasItems.length > 0) {
            const bottomMostItem = canvasItems.reduce((prev, current) => 
              (prev.y + prev.height > current.y + current.height) ? prev : current
            );
            newY = bottomMostItem.y + bottomMostItem.height + 40;
            newX = bottomMostItem.x; // Align with the bottom-most item's X
          }

          const newItem: CanvasItem = {
            id: newItemId,
            type: 'upload',
            src: base64Image,
            x: newX,
            y: newY,
            width: img.width,
            height: img.height,
            motherId: newItemId, // V74: acts as its own mother
            parameters: null // V74: filled post-analysis
          };

          setHistoryStates(prevH => [...prevH, canvasItems]);
          setCanvasItems(prev => [...prev, newItem]);
          setSelectedItemId(newItemId);
          setSitePlanImage(null);

        };
        img.src = base64Image;
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeViewpoint = async (base64Image: string, itemId?: string) => {
    setIsAnalyzing(true);
    try {
      // Phase 1 & 2: Structural & Viewpoint Analysis using gemini-3.1-pro-preview
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

      // [V10] Image Pre-Processing: Regenerate image via AI for better internal interpretation
      // (Proposal 3: regenerated image used internally only, canvas still shows original)
      let analysisImageBase64 = base64Image; // fallback to original
      try {
        const regenBase64Data = base64Image.split(',')[1];
        const regenMimeType = base64Image.split(';')[0].split(':')[1];
        const regenResult = await ai.models.generateContent({
          model: IMAGE_GEN,
          contents: {
            parts: [
              { inlineData: { data: regenBase64Data, mimeType: regenMimeType } },
              { text: 'Reproduce this architectural image exactly as-is. Output a pixel-perfect copy with identical composition, lighting, materials, and geometry. No modifications.' },
            ],
          },
        });
        const regenParts = regenResult.candidates?.[0]?.content?.parts || [];
        const regenImagePart = regenParts.find((p: any) => p.inlineData);
        if (regenImagePart?.inlineData) {
          analysisImageBase64 = `data:${regenImagePart.inlineData.mimeType};base64,${regenImagePart.inlineData.data}`;
          console.log('%c[V10] Image Pre-Processing complete. Using regenerated image for analysis.', 'color: #7c3aed; font-weight: bold;');
        }
      } catch (regenErr) {
        console.warn('[V10] Image Pre-Processing failed, using original:', regenErr);
      }

      const analysisPrompt = `
        [Meta-Cognitive Directive]
        You are an 'Architectural Logic Engine' (Protocol A). 
        TASK: Reverse-engineer the exact camera viewpoint (Angle, Altitude, Lens) and time from the provided image.

        [VISUAL ANCHOR DEFINITIONS]
        - FRONT FACADE: Identified by the primary entrance, main lobby glazing, large-scale signage, or the most complex architectural feature.
        - SIDE/REAR FACADE: Characterized by repetitive window patterns, secondary service doors, or simpler materiality.

        [ANGLE CLOCK-FACE DICTIONARY - STRICT IF-THEN RULES]
        Reference Building Center: 06:00 (Front Facade).
        1. IF (Center of image is FRONT face-on) → THEN 06:00.
        2. IF (Center of image is RIGHT face-on) → THEN 03:00.
        3. IF (Center of image is LEFT face-on) → THEN 09:00.
        4. IF (Center of image is REAR face-on) → THEN 12:00.
        5. IF (Left part of image is FRONT && Right part is RIGHT) → THEN 04:30 (Front-Right Corner).
        6. IF (Left part of image is LEFT && Right part is FRONT) → THEN 07:30 (Front-Left Corner).
        7. IF (Left part of image is RIGHT && Right part is REAR) → THEN 01:30 (Rear-Right Corner).
        8. IF (Left part of image is REAR && Right part is LEFT) → THEN 10:30 (Rear-Left Corner).

        [ANTI-MORPHOLOGY FILTER]
        In the 'elevation_views' and 'elevation_parameters' sections, you MUST NOT use architecture-specific shape nouns (e.g., "Wall", "Window", "Roof"). 
        Instead, describe them only by their optical and material properties (e.g., "70% Reflective Silver Metallic Surface", "Punching Ratio 0.4", "Glazing Type: Low-E").

        [OUTPUT JSON SCHEMA]
        Return ALL fields in JSON:
        {
          "visual_reasoning": "Identify Left and Right visible facades first, then match to Dictionary Rule #X.",
          "angle": "One of: 12:00, 1:30, 3:00, 04:30, 06:00, 07:30, 09:00, 10:30",
          "altitude_index": "0-7",
          "lens_index": "0-7",
          "time_index": "0-7",
          "site_plan_hint": "Building footprint description",
          "elevation_views": {
            "Front": {
              "meta": { "Target_View": "Front", "Normal_Vector": "(0,-1,0)", "Dependency_Status": "MASTER" },
              "1_Geometry_MASTER": {
                "A-1_Bounding_Proportions": { "Scale_X_Z": "", "Mass_Articulation": "" },
                "A-2_Structural_Grid": { "Grid_Module": "", "Wrap_Around_Rules": "N/A" },
                "A-3_Depth_Extrusions": { "Extrusion_Z": "", "Setback_Z": "" },
                "A-4_Voids_Openings": { "Punching_Ratio": "", "Zoning_Align": "N/A" },
                "A-5_Specific_Features": { "Roof_and_Base": "" }
              },
              "2_Property_SLAVE": {
                "B-1_Primary_Materiality": { "Base_Color": "", "PBR_Values": "", "Texture_Detail": "" },
                "B-2_Optical_Glazing": { "Glass_Type": "", "Optical_Index": "" },
                "B-3_Secondary_Elements": { "Frame_Material": "" },
                "B-4_Illumination_Shadows": { "Shadow_Intensity": "", "Directional_Light": "" },
                "B-5_Aging_Weathering": { "Weathering_State": "" }
              }
            },
            "Top": {
              "meta": { "Target_View": "Top", "Normal_Vector": "(0,0,1)", "Dependency_Status": "SLAVE" },
              "1_Geometry_MASTER": {
                "A-1_Bounding_Proportions": { "Scale_X_Z": "", "Mass_Articulation": "" },
                "A-2_Structural_Grid": { "Grid_Module": "", "Wrap_Around_Rules": "" },
                "A-3_Depth_Extrusions": { "Extrusion_Z": "N/A", "Setback_Z": "" },
                "A-4_Voids_Openings": { "Punching_Ratio": "N/A", "Zoning_Align": "" },
                "A-5_Specific_Features": { "Roof_and_Base": "" }
              },
              "2_Property_SLAVE": {
                "B-1_Primary_Materiality": { "Base_Color": "", "PBR_Values": "", "Texture_Detail": "" },
                "B-2_Optical_Glazing": { "Glass_Type": "N/A", "Optical_Index": "N/A" },
                "B-3_Secondary_Elements": { "Frame_Material": "" },
                "B-4_Illumination_Shadows": { "Shadow_Intensity": "", "Directional_Light": "" },
                "B-5_Aging_Weathering": { "Weathering_State": "" }
              }
            },
            "Right": {
              "meta": { "Target_View": "Right", "Normal_Vector": "(1,0,0)", "Dependency_Status": "SLAVE" },
              "1_Geometry_MASTER": {
                "A-1_Bounding_Proportions": { "Scale_X_Z": "", "Mass_Articulation": "" },
                "A-2_Structural_Grid": { "Grid_Module": "", "Wrap_Around_Rules": "" },
                "A-3_Depth_Extrusions": { "Extrusion_Z": "", "Setback_Z": "" },
                "A-4_Voids_Openings": { "Punching_Ratio": "", "Zoning_Align": "" },
                "A-5_Specific_Features": { "Roof_and_Base": "" }
              },
              "2_Property_SLAVE": {
                "B-1_Primary_Materiality": { "Base_Color": "", "PBR_Values": "", "Texture_Detail": "" },
                "B-2_Optical_Glazing": { "Glass_Type": "", "Optical_Index": "" },
                "B-3_Secondary_Elements": { "Frame_Material": "" },
                "B-4_Illumination_Shadows": { "Shadow_Intensity": "", "Directional_Light": "" },
                "B-5_Aging_Weathering": { "Weathering_State": "" }
              }
            },
            "Left": {
              "meta": { "Target_View": "Left", "Normal_Vector": "(-1,0,0)", "Dependency_Status": "SLAVE" },
              "1_Geometry_MASTER": {
                "A-1_Bounding_Proportions": { "Scale_X_Z": "", "Mass_Articulation": "" },
                "A-2_Structural_Grid": { "Grid_Module": "", "Wrap_Around_Rules": "" },
                "A-3_Depth_Extrusions": { "Extrusion_Z": "", "Setback_Z": "" },
                "A-4_Voids_Openings": { "Punching_Ratio": "", "Zoning_Align": "" },
                "A-5_Specific_Features": { "Roof_and_Base": "" }
              },
              "2_Property_SLAVE": {
                "B-1_Primary_Materiality": { "Base_Color": "", "PBR_Values": "", "Texture_Detail": "" },
                "B-2_Optical_Glazing": { "Glass_Type": "", "Optical_Index": "" },
                "B-3_Secondary_Elements": { "Frame_Material": "" },
                "B-4_Illumination_Shadows": { "Shadow_Intensity": "", "Directional_Light": "" },
                "B-5_Aging_Weathering": { "Weathering_State": "" }
              }
            },
            "Rear": {
              "meta": { "Target_View": "Rear", "Normal_Vector": "(0,1,0)", "Dependency_Status": "SLAVE" },
              "1_Geometry_MASTER": {
                "A-1_Bounding_Proportions": { "Scale_X_Z": "", "Mass_Articulation": "" },
                "A-2_Structural_Grid": { "Grid_Module": "", "Wrap_Around_Rules": "" },
                "A-3_Depth_Extrusions": { "Extrusion_Z": "N/A", "Setback_Z": "" },
                "A-4_Voids_Openings": { "Punching_Ratio": "", "Zoning_Align": "" },
                "A-5_Specific_Features": { "Roof_and_Base": "" }
              },
              "2_Property_SLAVE": {
                "B-1_Primary_Materiality": { "Base_Color": "", "PBR_Values": "", "Texture_Detail": "" },
                "B-2_Optical_Glazing": { "Glass_Type": "", "Optical_Index": "" },
                "B-3_Secondary_Elements": { "Frame_Material": "" },
                "B-4_Illumination_Shadows": { "Shadow_Intensity": "", "Directional_Light": "" },
                "B-5_Aging_Weathering": { "Weathering_State": "" }
              }
            }
          },
          "bldg_ratio": {
            "width": 10,
            "depth": 8,
            "height": 15
          }
        }
      `;

      // Use regenerated image (V10) for analysis if available, fallback to original
      const base64Data = analysisImageBase64.split(',')[1];
      const mimeType = analysisImageBase64.split(';')[0].split(':')[1];

      const runAnalysis = async (modelName: string) => {
        const result = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              { inlineData: { data: base64Data, mimeType: mimeType } },
              { text: analysisPrompt },
            ],
          },
        });

        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const jsonStr = responseText.match(/\{[\s\S]*\}/)?.[0];
        if (!jsonStr) throw new Error("No JSON returned from model");

        const data = JSON.parse(jsonStr);

        // [DEVELOPER INSPECTION] 5-View AEPL Schema per 전개도작성 가이드라인 §2 & §3
        const views = data.elevation_views;
        const VIEW_ORDER = ['Front', 'Top', 'Right', 'Left', 'Rear'];
        const VIEW_COLORS: Record<string, string> = { Front: '#047857', Top: '#1d4ed8', Right: '#7c3aed', Left: '#b45309', Rear: '#b91c1c' };
        const VIEW_VECTORS: Record<string, string> = { Front: '(0,-1,0)', Top: '(0,0,1)', Right: '(1,0,0)', Left: '(-1,0,0)', Rear: '(0,1,0)' };

        console.log('%c========================================================', 'color: #1d4ed8; font-weight: bold;');
        console.log('%c[DEVELOPER LOG] C CHANGE VIEWPOINT — AEPL 5-VIEW SCHEMA', 'color: #1d4ed8; font-weight: bold; font-size: 14px;');
        console.log('%c[Reference: 전개도작성 가이드라인 §2 View Sequence Standards + §3 Elevation Parameter Schema]', 'color: #1d4ed8;');
        console.log('%c========================================================', 'color: #1d4ed8; font-weight: bold;');

        // Soft Gate: check all 5 views present
        const missingViews = VIEW_ORDER.filter(v => !views?.[v]);
        if (missingViews.length > 0) {
          console.warn(`%c[SOFT GATE WARNING] Missing views: ${missingViews.join(', ')}. Proceeding to PHASE 2 with available data.`, 'color: #d97706; font-weight: bold;');
        } else {
          console.log('%c[GATE ✓] All 5 views present — Proceeding to PHASE 2.', 'color: #047857; font-weight: bold;');
        }

        VIEW_ORDER.forEach(viewKey => {
          const v = views?.[viewKey];
          if (!v) { console.warn(`[${viewKey}] Not present in response.`); return; }
          const col = VIEW_COLORS[viewKey];
          const vec = VIEW_VECTORS[viewKey];
          console.groupCollapsed(`%c▶ ${viewKey} Elevation  |  Normal: ${vec}  |  Status: ${v.meta?.Dependency_Status ?? '-'}`, `color: ${col}; font-weight: bold;`);
          console.log('%c  [Part A] 1_Geometry_MASTER (Shape Anchor):', `color: ${col}; font-weight: bold;`);
          console.dir(v['1_Geometry_MASTER'], { depth: null });
          console.log('%c  [Part B] 2_Property_SLAVE (Data Binder):', `color: ${col}; font-weight: bold;`);
          console.dir(v['2_Property_SLAVE'], { depth: null });
          console.groupEnd();
        });

        console.log('%c========================================================', 'color: #1d4ed8; font-weight: bold;');

        const aIdx = ANGLES.indexOf(data.angle);
        if (aIdx !== -1) setAngleIndex(aIdx);
        if (data.altitude_index !== undefined) setAltitudeIndex(Number(data.altitude_index));
        if (data.lens_index !== undefined) setLensIndex(Number(data.lens_index));
        if (data.time_index !== undefined) setTimeIndex(Number(data.time_index));
        
        const analyzedOpt = {
          angle: data.angle,
          altitude: ALTITUDES[Number(data.altitude_index) || 0]?.label || 'N/A',
          lens: LENSES[Number(data.lens_index) || 0]?.label || 'N/A',
          time: TIMES[Number(data.time_index) || 0] || 'N/A'
        };
        setAnalyzedOpticalParams(analyzedOpt);
        
        // Update the newly uploaded Mother item with the analyzed data
        const newParams = {
          angleIndex: aIdx !== -1 ? aIdx : 4,
          altitudeIndex: Number(data.altitude_index) || 2,
          lensIndex: Number(data.lens_index) || 0,
          timeIndex: Number(data.time_index) || 2,
          analyzedOpticalParams: analyzedOpt,
          elevationParams: data.elevation_parameters || null,
          bldgRatio: data.bldg_ratio || null,  // [V11] numeric proportions for artboard grid
          sitePlanImage: null,
          architecturalSheetImage: null
        };

        setCanvasItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, parameters: newParams } : item
        ));
        
        // After parameter analysis, trigger site plan generation with extracted params for synthesis
        // Forward the entire elevation_views as the structured elevation parameters
        const elevForPhase2 = data.elevation_views || data.elevation_parameters || null;
        await generateSitePlan(base64Image, elevForPhase2, itemId);
        return true;
      };

      try {
        await runAnalysis(ANALYSIS);
      } catch (primaryError) {
        console.warn(`Primary model (${ANALYSIS}) failed, retrying with fallback...`, primaryError);
        const success = await runAnalysis(ANALYSIS_FALLBACK);
        if (!success) throw new Error("Fallback failed");
      }

    } catch (err) {
      console.warn("Analysis failed completely, using defaults", err);
      alert("분석 API 호출이 실패하거나 할당량(Quota)을 초과했습니다. 기본값으로 세팅됩니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };


  const generateSitePlan = async (base64Image: string, extractedParams?: any, itemId?: string) => {
    setAnalysisStep('generating_sheet');
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      const v0_angle = analyzedOpticalParams?.angle || 'Unknown';

      // [V10 Method A] Structured AEPL injection — natural language format for PHASE 2
      const buildStructuredParams = (params: any): string => {
        if (!params) return 'Utilize implicit building context from the uploaded image.';
        const views = ['Front', 'Top', 'Rear', 'Left', 'Right'];
        const lines: string[] = ['[AEPL Structured Parameters from PHASE 1 Analysis]'];
        for (const view of views) {
          const v = params[view];
          if (!v) continue;
          const g = v['1_Geometry_MASTER'];
          const p = v['2_Property_SLAVE'];
          lines.push(`
[${view} Elevation]`);
          if (g) {
            lines.push(`  Geometry: Scale=${g['A-1_Bounding_Proportions']?.Scale_X_Z ?? '-'}, Grid=${g['A-2_Structural_Grid']?.Grid_Module ?? '-'}, Depth=${g['A-3_Depth_Extrusions']?.Extrusion_Z ?? '-'}, Voids=${g['A-4_Voids_Openings']?.Punching_Ratio ?? '-'}, Roof=${g['A-5_Specific_Features']?.Roof_and_Base ?? '-'}`);
          }
          if (p) {
            lines.push(`  Material: ${p['B-1_Primary_Materiality']?.Base_Color ?? '-'} | Glazing: ${p['B-2_Optical_Glazing']?.Glass_Type ?? '-'} | Shadow: ${p['B-4_Illumination_Shadows']?.Shadow_Intensity ?? '-'}`);
          }
        }
        return lines.join('\n');
      };
      const contextualParamsStr = buildStructuredParams(extractedParams);

      const sitePlanPrompt = `
        [Architectural Multi-View Reference Sheet - Protocol B / template-layout v7]
        TASK: Generate a single integrated orthographic 5-view reference sheet in a topological 'UNFOLDED BOX' layout.
        
        [ORIENTATION RULE: UNFOLDED BOX (3x3 Grid)]
        - Row 0: [Empty | REAR Elevation (Upright) | Empty]
        - Row 1: [LEFT Elevation (Upright) | TOP (Roof Plan) (Upright) | RIGHT Elevation (Upright)]
        - Row 2: [Empty | FRONT Elevation (Upright) | Empty]
        * Upright = Ground side of each elevation MUST be at the bottom of its respective 3x3 cell.
        
        [ABSOLUTE MANDATORY CONSTRAINTS]
        1. ALPHA CHANNEL MANDATORY: Background must be 100% transparent. No white/black background pixels.
        2. STRICT RATIO ALIGNMENT: Each elevation's pixel dimensions must strictly match the building proportions.
        3. NO Perspective (Orthographic only), NO text, NO labels.
        
        [CONTEXTUAL IMAGE SYNTHESIS]
        - Visible Facades: Based on V₀ (${v0_angle}), map the source image textures to the corresponding faces.
        - Blind Spots: Infer hidden facades logically following the Master-Priority Snapping (aligning Z-heights to Front).
        - Material Specs: Apply Slave Property Specs consistently across all 5 views.
${contextualParamsStr}
      `.trim();

      const base64Data = base64Image.split(',')[1];
      const mimeType = base64Image.split(';')[0].split(':')[1];

      // Phase 2 (Sub-task): Multi-View Generation using gemini-3.1-flash-image-preview
      const result = await ai.models.generateContent({
        model: IMAGE_GEN,
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: sitePlanPrompt },
          ],
        },
      });

      if (result.candidates?.[0]?.content?.parts) {
        for (const part of result.candidates[0].content.parts) {
          if (part.inlineData) {
            const fullSheetData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            setArchitecturalSheetImage(fullSheetData);
            
            // [V11] Extract all 5 views from the 3x3 cross layout and store independently
            // Layout: Row0=[_,REAR,_], Row1=[LEFT,TOP,RIGHT], Row2=[_,FRONT,_]
            const img = new Image();
            img.onload = () => {
              const cellW = img.width / 3;
              const cellH = img.height / 3;

              const cropCell = (col: number, row: number): string => {
                const c = document.createElement('canvas');
                c.width = cellW; c.height = cellH;
                const cx = c.getContext('2d');
                if (cx) cx.drawImage(img, col * cellW, row * cellH, cellW, cellH, 0, 0, cellW, cellH);
                return c.toDataURL();
              };

              const rearImg   = cropCell(1, 0);
              const leftImg   = cropCell(0, 1);
              const topImg    = cropCell(1, 1);
              const rightImg  = cropCell(2, 1);
              const frontImg  = cropCell(1, 2);

              setSitePlanImage(topImg);

              if (itemId) {
                setCanvasItems(prev => prev.map(item => {
                  if (item.id === itemId && item.parameters) {
                    return {
                      ...item,
                      parameters: {
                        ...item.parameters,
                        architecturalSheetImage: fullSheetData,
                        sitePlanImage: topImg,
                        elevationImages: { top: topImg, front: frontImg, rear: rearImg, left: leftImg, right: rightImg },
                        // [V16 Fix] Preserving the bldgRatio extracted during Phase 1 analysis. Do not overwrite with null.
                      }
                    };
                  }
                  return item;
                }));
              }
            };
            img.src = fullSheetData;
            break;
          }
        }
      }
    } catch (err) {
      console.warn("Multi-view generation failed", err);
    }
  };

  // ---
  // PHASE 4: SYNTHESIS & GENERATION
  // Layer A (Geometry) + Layer B (5-IVSP Viewpoint) + Layer C (Property Slave)
  // ---
  const handleGenerate = async () => {
    // [PHASE 4 - Step 1] Integration Validation
    const sourceItem = selectedItemId 
      ? canvasItems.find(item => item.id === selectedItemId) 
      : (canvasItems.length > 0 ? canvasItems[0] : null);

    if (!sourceItem) {
      alert("Please upload at least one image first.");
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      
      const currentAngle = ANGLES[angleIndex];
      const currentAltitude = ALTITUDES[altitudeIndex];
      const currentLens = LENSES[lensIndex];
      const currentTime = TIMES[timeIndex];

      const scenario = determineScenario(currentAngle, currentAltitude.value, currentLens.value);

      // [PHASE 4 - Step 2] Unified Prompt Assembly
      // Layer B: 5-IVSP Phase 1 (Coordinate Anchoring) + Phase 2 (Optical Engineering)
      // V₀: AI-analyzed source viewpoint (from PHASE 1 analyzeViewpoint)
      const v0_angle    = analyzedOpticalParams?.angle    || 'Unknown';
      const v0_altitude = analyzedOpticalParams?.altitude || 'Unknown';
      const v0_lens     = analyzedOpticalParams?.lens     || 'Unknown';
      const v0_time     = analyzedOpticalParams?.time     || 'Unknown';

      const layerB_viewpoint = `
# ACTION PROTOCOL (MANDATORY EXECUTION WORKFLOW)
## Pre-Step: Reality Anchoring & Camera Delta Calculation
- V₀ (Current Camera Position — AI Reverse-Engineered):
    Angle: ${v0_angle} o'clock | Altitude: ${v0_altitude} | Lens: ${v0_lens} | Time: ${v0_time}
    This is the exact camera position from which the SOURCE IMAGE (IMAGE 1) was captured.
- V₁ (Target Camera Position — User Command):
    Angle: ${currentAngle} o'clock | Altitude: ${currentAltitude.label} | Lens: ${currentLens.label} | Time: ${currentTime}
- Δ Movement Vector: Orbit from ${v0_angle} → ${currentAngle} | Altitude change: ${v0_altitude} → ${currentAltitude.label}
    Execute this as a precise Physical Camera Orbit around the immutable building geometry.

## Step 1: Coordinate Anchoring & Vector Calculation
- Reference: Building main facade fixed at 06:00 (Front).
- Target Vector: ${currentAngle}
- Altitude: ${currentAltitude.label}

## Step 2: Scenario Mapping & Optical Engineering
- Scenario: ${scenario}
- Lens: ${currentLens.label}
- Time of Day: ${currentTime}`;

      // [V9 FIX 1] Layer C: 5-View AEPL Property Injection (reads from new elevation_views format)
      const getViewData = (viewKey: string) => {
        if (!elevationParams) return null;
        // Support both new (elevation_views) and legacy formats
        return elevationParams[viewKey] || elevationParams;
      };
      const frontView = getViewData('Front');
      const layerC_property = frontView
        ? `
## Step 5: Structural & Material Parameters (PHASE 1 AEPL Data — Immutable)
[Source: 5-View Elevation Schema / Front Elevation MASTER]
- A-1 Bounding Proportions: ${frontView['1_Geometry_MASTER']?.['A-1_Bounding_Proportions']?.Scale_X_Z || frontView['1_Geometry_MASTER']?.['A-1_Bounding_Proportions'] || 'N/A'}
- A-2 Structural Grid: ${frontView['1_Geometry_MASTER']?.['A-2_Structural_Grid']?.Grid_Module || 'N/A'}
- A-3 Depth Extrusions: ${frontView['1_Geometry_MASTER']?.['A-3_Depth_Extrusions']?.Extrusion_Z || 'N/A'}
- A-4 Voids/Openings: ${frontView['1_Geometry_MASTER']?.['A-4_Voids_Openings']?.Punching_Ratio || 'N/A'}
- A-5 Roof & Base: ${frontView['1_Geometry_MASTER']?.['A-5_Specific_Features']?.Roof_and_Base || 'N/A'}
- B-1 Primary Materiality: ${frontView['2_Property_SLAVE']?.['B-1_Primary_Materiality']?.Base_Color || 'N/A'} | PBR: ${frontView['2_Property_SLAVE']?.['B-1_Primary_Materiality']?.PBR_Values || 'N/A'}
- B-2 Glazing: ${frontView['2_Property_SLAVE']?.['B-2_Optical_Glazing']?.Glass_Type || 'N/A'}
- B-4 Illumination: ${frontView['2_Property_SLAVE']?.['B-4_Illumination_Shadows']?.Shadow_Intensity || 'N/A'}`
        : '';

      // [V15] v4: Virtual Photography — NO Blind Spot Inference. Replace with Scene Capture Execution.
      // Step 3 now locks geometry from Phase 2 elevation data. No new details added.
      const layerC_sceneCapture = `
## Step 3: Scene Capture Execution (protocol-Change Viewpoint-v4)
- Perspective: ${['04:30','07:30','1:30','10:30'].includes(currentAngle) ? '2-Point Perspective (corner)' : '1-Point Perspective (face-on)'}.
- Elevation Data Sync: Load PHASE 2 pre-computed elevation(s) as permanent immutable geometry. DO NOT add, remove, or modify any architectural element.
- Geometric Sanctuary: The building's proportions, openings, and surface texture are 100% locked to the elevation reference data.
- Material Injection: Lock original textures from IMAGE 1. Apply Relighting ONLY for time of day (${currentTime}). Do not invent new materials.
- PROHIBITION: Generating service doors, MEP pipes, ventilation grilles, or any details NOT present in the provided elevation data is STRICTLY FORBIDDEN.`;


      const elevationSlots = getElevationSlot(currentAngle);
      const elevationLabel = elevationSlots.map(s => s.label).join('+');
      const imageCount = 1 + elevationSlots.length; // image 1 = original, rest = elevation crops

      // [V14 fix] Corner face direction map (Left-hand / Right-hand wall assignment)
      // Prevents AI from randomly swapping which face appears on left vs right of the 2-Point Perspective frame.
      type CornerFaceRule = { lhFace: string; rhFace: string };
      const CORNER_FACE_RULES: Record<string, CornerFaceRule> = {
        '04:30': { lhFace: 'FRONT', rhFace: 'RIGHT'  },
        '07:30': { lhFace: 'LEFT',  rhFace: 'FRONT'  },
        '1:30':  { lhFace: 'REAR',  rhFace: 'RIGHT'  },
        '10:30': { lhFace: 'LEFT',  rhFace: 'REAR'   },
      };
      const cornerFaceRule = CORNER_FACE_RULES[currentAngle];

      // Layer A + B + C (v4): Unified Final Prompt — Virtual Photography
      const finalPrompt = `
# SYSTEM: Virtual Architectural Photography Engine (protocol-Change Viewpoint-v4)

# GOAL
Perform a precise camera orbit around a fixed architectural subject and render the result. This is VIRTUAL PHOTOGRAPHY — not image generation. The building geometry is a completed, immutable reality. Only the camera moves.

# INPUT IMAGES
- IMAGE 1 (Source of Truth): The original uploaded architectural photo. Provides material textures and visible surface data.
${elevationSlots.length === 1
  ? `- IMAGE 2 (Elevation Blueprint): The PHASE 2 pre-computed ${elevationLabel} orthographic elevation. This is an immutable geometric reference. Reflect all proportions, openings, and structure EXACTLY in the output.`
  : `- IMAGE 2 (Left-hand Face Blueprint): The PHASE 2 pre-computed ${cornerFaceRule?.lhFace ?? elevationSlots[0].label} elevation — this face appears on the LEFT side of the 2-Point Perspective output frame.
- IMAGE 3 (Right-hand Face Blueprint): The PHASE 2 pre-computed ${cornerFaceRule?.rhFace ?? elevationSlots[1].label} elevation — this face appears on the RIGHT side of the 2-Point Perspective output frame.
  Both faces are immutable geometric references. The output MUST place each face on its correct side of the frame exactly as specified.`
}

# CORE PHILOSOPHY (MANDATORY — DO NOT OVERRIDE)
- **Geometric Sanctuary:** The building's proportions, structure, openings, materials, and aging are IMMUTABLE CONSTANTS. They are 100% fixed by the PHASE 2 elevation data and IMAGE 1. Zero tolerance for modification.
- **Camera-Only Variable:** The only variable is the observer's 3D position (coordinate & altitude) and lens. Nothing else changes.
- **ABSOLUTE PROHIBITION:** Adding service doors, MEP pipes, new windows, or ANY architectural element not present in the blueprints is STRICTLY FORBIDDEN.

# CONTEXT
- Ontological Status: "Completed Architectural Reality" — a fixed physical object photographed from a new angle.
- Reference Frame: Building main facade = 06:00 (Front). All other directions are relative to this.
${layerB_viewpoint}
${layerC_sceneCapture}
${layerC_property}

## Step 4: Capture & Compliance Check
- Execute: Orbit camera to the target coordinate. Render using the lens and perspective from Step 2. Output is a photorealistic architectural image as if physically photographed from the target position.
- Compliance:
  [ ] Geometry identical to elevation blueprints? (Zero deviation)
  [ ] Perspective law applied correctly? (1-Point or 2-Point as specified)
  [ ] No invented or hallucinated architectural elements?
  [ ] Original materials and textures preserved from IMAGE 1?
${cornerFaceRule ? `  [ ] IMAGE 2 (${cornerFaceRule.lhFace}) is on the LEFT of the frame? IMAGE 3 (${cornerFaceRule.rhFace}) is on the RIGHT?` : `  [ ] Elevation blueprint reflected accurately in output?`}
${prompt ? `\nAdditional instruction: ${prompt}` : ''}

[CAPTURE IMAGE NOW]
      `.trim();

      let actualImageSrc = sourceItem.src;
      // V82: If generating from a generated image, we MUST use the mother image's src for the AI!
      if (sourceItem.type === 'generated' && sourceItem.motherId) {
        const motherItem = canvasItems.find(i => i.id === sourceItem.motherId);
        if (motherItem) {
          actualImageSrc = motherItem.src;
        }
      }

      const base64Data = actualImageSrc.split(',')[1];
      const mimeType = actualImageSrc.split(';')[0].split(':')[1];

      // [PHASE 4 - Step 3] Final Image Generation
      const runGeneration = async (modelName: string) => {
        const parts: any[] = [
          { inlineData: { data: base64Data, mimeType: mimeType } },
        ];

        // V70/V71: Crop matching elevation slots and inject all
        // Corner angles inject two adjacent faces as separate images
        if (architecturalSheetImage) {
          const slots = getElevationSlot(currentAngle);
          for (const slot of slots) {
            try {
              const croppedElevation = await cropElevationFromSheet(architecturalSheetImage, slot);
              const cropBase64 = croppedElevation.split(',')[1];
              parts.push({ inlineData: { data: cropBase64, mimeType: 'image/png' } });
              console.log(`[V70] Injecting cropped elevation: ${slot.label} (Row${slot.row}, Col${slot.col})`);
            } catch (e) {
              console.warn('[V70] Elevation crop failed:', slot.label, e);
            }
          }
        }

        parts.push({ text: finalPrompt });

        const response = await ai.models.generateContent({
          model: modelName,
          contents: { parts },
        });

        let foundImage = false;
        if (response.candidates && response.candidates[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              const generatedSrc = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              
              // [PHASE 4 - Step 4] Result Projection
              const img = new Image();
              img.onload = () => {
                const newGenItem: CanvasItem = {
                  id: `gen-${Date.now()}`,
                  type: 'generated',
                  src: generatedSrc,
                  x: sourceItem.x + sourceItem.width + 40,
                  y: sourceItem.y,
                  width: (img.width / img.height) * sourceItem.height,
                  height: sourceItem.height,
                  motherId: sourceItem.motherId || sourceItem.id,
                  parameters: {
                    angleIndex,
                    altitudeIndex,
                    lensIndex,
                    timeIndex,
                    analyzedOpticalParams: analyzedOpticalParams,
                    elevationParams: elevationParams,
                    elevationImages: sourceItem.parameters?.elevationImages, // [V16] Inherit to child
                    bldgRatio: sourceItem.parameters?.bldgRatio,           // [V16] Inherit to child
                    sitePlanImage: sitePlanImage,
                    architecturalSheetImage: architecturalSheetImage
                  }
                };
                setCanvasItems(prev => {
                  setHistoryStates(prevH => [...prevH, prev]);
                  let currentX = sourceItem.x + sourceItem.width + 12;
                  let currentY = sourceItem.y;
                  let hasOverlap = true;

                  // Simple overlap check
                  while (hasOverlap) {
                    hasOverlap = false;
                    for (const item of prev) {
                      // simple AABB intersection check
                      if (
                        currentX < item.x + item.width &&
                        currentX + newGenItem.width > item.x &&
                        currentY < item.y + item.height &&
                        currentY + newGenItem.height > item.y
                      ) {
                        currentX = item.x + item.width + 12;
                        hasOverlap = true;
                        break;
                      }
                    }
                  }

                  newGenItem.x = currentX;
                  newGenItem.y = currentY;

                  return [...prev, newGenItem];
                });
                setSelectedItemId(newGenItem.id);
              };
              img.src = generatedSrc;
              
              foundImage = true;
              break;
            }
          }
        }
        return foundImage;
      };

      // Try primary model, fallback if needed
      try {
        const success = await runGeneration(IMAGE_GEN);
        if (!success) throw new Error("Text returned instead of image");
      } catch (primaryError) {
        console.warn(`Primary model (${IMAGE_GEN}) failed, retrying with fallback...`, primaryError);
        const success = await runGeneration(IMAGE_GEN_FALLBACK);
        if (!success) {
          alert("Failed to generate image with both primary and fallback models.");
        }
      }

    } catch (error) {
      console.error("Generation Error:", error);
      alert("An error occurred during generation.");
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="h-[100dvh] w-full flex flex-col bg-white dark:bg-black text-black dark:text-white font-sans transition-colors duration-300 selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black overflow-hidden">
      {/* HEADER */}
      <header className="h-16 shrink-0 flex justify-between items-center px-4 border-b border-black/10 dark:border-white/10 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <span className="text-[1.575rem] font-display font-bold tracking-[0.0125em] uppercase leading-tight pt-1">C</span>
          <span className="text-[1.575rem] font-display font-bold tracking-[0.0125em] uppercase leading-tight pt-1">CHANGE VIEWPOINT</span>
        </div>
        <div className="flex items-center gap-6 font-mono text-xs leading-normal tracking-wide uppercase">
          <button onClick={toggleTheme} className="hover:opacity-60 transition-opacity">
            {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex flex-1 min-h-0 w-full flex-col landscape:flex-row overflow-hidden relative">
        
        <section 
          ref={canvasRef as React.RefObject<HTMLElement>}
          className={`flex-1 min-w-0 relative bg-[#fcfcfc] dark:bg-[#050505] overflow-hidden flex items-center justify-center transition-colors duration-300 select-none touch-none
            ${canvasMode === 'pan' 
              ? (isDraggingPan ? 'cursor-grabbing' : 'cursor-grab') 
              : (isDraggingItem ? 'cursor-move' : 'cursor-default')
            }`}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDragStart={(e) => e.preventDefault()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >

          <div className={`
            absolute left-[12px] top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1
            bg-white/90 border border-black/50 shadow-xl dark:bg-black/90 dark:border-white/50 pointer-events-auto
            transition-all duration-300 rounded-full py-2 w-11 backdrop-blur-sm
          `}>
            {/* 1. 도구 모드 (Select / Pan) */}
            <button 
              onClick={() => setCanvasMode('select')}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${canvasMode === 'select' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
              title="Select Mode"
            >
              <MousePointer2 size={18} />
            </button>
            <button 
              onClick={() => {
                setCanvasMode('pan');
              }}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${canvasMode === 'pan' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
              title="Pan Mode"
            >
              <Hand size={18} />
            </button>

            {/* V75: Undo Button */}
            <div className="w-6 h-[1px] bg-black/10 dark:bg-white/10 my-1" />
            <button 
              onClick={handleUndo}
              disabled={historyStates.length === 0}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${historyStates.length === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
              title="Undo"
            >
              <Undo size={18} />
            </button>
          </div>

          {/* V71: Dynamic Horizontal Control Bar (Upload + Zoom + Compass) */}
          <div 
            className={`
              absolute bottom-[12px] z-30 flex items-center
              bg-white/90 border border-black/50 shadow-xl dark:bg-black/90 dark:border-white/50 pointer-events-auto
              transition-all duration-500 ease-in-out rounded-full overflow-hidden h-11 backdrop-blur-sm
            `}
            style={{
              left: isRightPanelOpen ? '50%' : 'calc(100% - 12px)',
              transform: isRightPanelOpen ? 'translateX(-50%)' : 'translateX(-100%)',
              whiteSpace: 'nowrap'
            }}
          >
            {/* 1. 이미지 업로드 버튼 */}
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <div className="flex px-1">
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="w-10 h-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors" 
                title="Upload Image"
              >
                <Upload size={18} />
              </button>
            </div>

            <div className="w-[1px] h-7 bg-black/10 dark:bg-white/10" />

            {/* 2. 돋보기 / 초기화 */}
            <div className="flex px-1">
              <button 
                onClick={handleFocus} 
                className="w-10 h-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors" 
                title="Fit to 100% / Focus Target"
              >
                <Search size={18} />
              </button>
            </div>

            <div className="w-[1px] h-7 bg-black/10 dark:bg-white/10" />

            {/* 3. 줌 컨트롤 */}
            <div className="flex px-1 select-none items-center">
              <button onClick={() => zoomStep(-1)} className="w-10 h-full flex items-center justify-center font-mono text-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" title="Zoom Out">−</button>
              <div className="min-w-[60px] h-full flex items-center justify-center font-mono text-sm px-1 font-bold">{Math.round(canvasZoom)}%</div>
              <button onClick={() => zoomStep(1)} className="w-10 h-full flex items-center justify-center font-mono text-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" title="Zoom In">+</button>
            </div>

            <div className="w-[1px] h-7 bg-black/10 dark:bg-white/10" />

            {/* 4. 나침반 (패널 토글) */}
            <div className="flex px-1">
              <button 
                onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                className={`w-10 h-9 flex items-center justify-center transition-colors ${
                  isRightPanelOpen 
                    ? 'bg-black text-white dark:bg-white dark:text-black rounded-full' 
                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                title="Toggle Panel"
              >
                <Compass size={18} />
              </button>
            </div>
          </div>

          {/* Transform Wrapper */}
          <div 
            style={{ 
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasZoom / 100})`,
              transformOrigin: 'center center',
              willChange: 'transform'
            }}
            className="w-full h-full flex items-center justify-center relative touch-none pointer-events-none"
          >
            {/* Infinite Composite Grid Background (5x5 Module, 60px/12px) */}
            <div 
              className="absolute pointer-events-none"
              style={{
                top: '-15000px', left: '-15000px',
                width: '30000px', height: '30000px',
                backgroundImage: `
                  linear-gradient(to right, rgba(128,128,128,0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(128,128,128,0.1) 1px, transparent 1px),
                  linear-gradient(to right, rgba(128,128,128,0.2) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(128,128,128,0.2) 1px, transparent 1px)
                `,
                backgroundSize: '12px 12px, 12px 12px, 60px 60px, 60px 60px',
                zIndex: -1
              }}
            />

            {/* Render Canvas Items (V56: Standardized Center-Origin Rendering) */}
            {canvasItems.map((item) => (
              <div 
                key={item.id}
                style={{ 
                  position: 'absolute',
                  // V56 Fix: Align item 0,0 with screen center (50%) to match getCanvasCoords math
                  left: `calc(50% + ${item.x}px)`,
                  top: `calc(50% + ${item.y}px)`,
                  width: item.width,
                  height: item.height,
                  zIndex: selectedItemId === item.id ? 20 : 10,
                  // Disable pointer events on items during PAN mode to allow background panning
                  pointerEvents: canvasMode === 'pan' ? 'none' : 'auto'
                }}
              >
                <img 
                  src={item.src} 
                  alt={item.id} 
                  className="w-full h-full object-contain pointer-events-none shadow-xl border border-black/5 dark:border-white/5"
                  referrerPolicy="no-referrer"
                  draggable={false}
                />
                
                {/* Selection Overlay (Blue Border & Circle Handles) */}
                {selectedItemId === item.id && (
                  <div 
                    className="absolute -inset-[1px] pointer-events-none border-[#1d4ed8] z-[30]"
                    style={{ 
                      // 1.2pt ≈ 1.6px
                      borderWidth: `${1.6 / (canvasZoom / 100)}px`
                    }}
                  >
                    {/* V80/V81: Floating Control Bar for All Images */}
                    <div 
                      className={`absolute flex items-center bg-white/70 dark:bg-black/70 backdrop-blur-md z-[40] divide-x divide-black/10 dark:divide-white/10 rounded-2xl shadow-sm ${canvasMode === 'pan' ? 'pointer-events-none' : 'pointer-events-auto'}`}
                      style={{
                        top: `-${48 / (canvasZoom / 100)}px`, // 36px height + 12px padding scaled inversely
                        right: 0,
                        height: `${36 / (canvasZoom / 100)}px`,
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      {item.type === 'upload' && (
                        /* V32: Re-analyze button for uploaded images only */
                        <button 
                          onClick={() => analyzeViewpoint(item.src, item.id)}
                          disabled={isAnalyzing}
                          className={`flex items-center justify-center transition-colors rounded-l-2xl ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                          style={{ width: `${40 / (canvasZoom / 100)}px`, height: '100%' }}
                          title="재분석"
                        >
                          {isAnalyzing ? (
                            <Loader2 className="animate-spin" size={14 / (canvasZoom / 100)} />
                          ) : (
                            <RotateCcw size={14 / (canvasZoom / 100)} />
                          )}
                        </button>
                      )}
                      
                      {item.type === 'generated' && (
                        /* V82: Add Download button for generated images */
                        <a 
                          href={item.src}
                          download="simulation.png"
                          className="flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-l-2xl"
                          style={{ width: `${40 / (canvasZoom / 100)}px`, height: '100%' }}
                          title="다운로드"
                        >
                          <Download size={14 / (canvasZoom / 100)} />
                        </a>
                      )}
                      <button 
                        onClick={() => setOpenLibraryItemId(prev => prev === item.id ? null : item.id)}
                        className={`flex items-center justify-center transition-colors ${item.type !== 'generated' && item.type !== 'upload' ? 'rounded-l-2xl' : ''} ${openLibraryItemId === item.id ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                        style={{ width: `${40 / (canvasZoom / 100)}px`, height: '100%' }}
                        title="라이브러리 (아트보드)"
                      >
                        <Book size={12 / (canvasZoom / 100)} />
                      </button>
                      <button 
                        onClick={() => {
                          setHistoryStates(prevH => [...prevH, canvasItems]);
                          setCanvasItems(prev => prev.filter(i => i.id !== item.id && i.motherId !== item.id));
                          setSelectedItemId(null);
                        }}
                        className="flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-red-500 rounded-r-2xl"
                        style={{ width: `${40 / (canvasZoom / 100)}px`, height: '100%' }}
                        title="삭제"
                      >
                        <Trash2 size={12 / (canvasZoom / 100)} />
                      </button>
                    </div>

                    {/* V75/V81: Item-bound Library Artboard */}
                    {openLibraryItemId === item.id && (
                      <div 
                        className={`absolute flex bg-white/90 dark:bg-[#1E1E1E]/90 backdrop-blur-xl shadow-xl rounded-2xl p-6 ${canvasMode === 'pan' ? 'pointer-events-none' : 'pointer-events-auto'}`}
                        style={{
                          left: `calc(100% + 12px)`,
                          top: 0,
                          width: `1600px`,
                          height: `1200px`,
                          border: 'none',
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <div className="flex w-full h-full">
                            {/* Left: Architectural Sheet (V82: Only sheet shown) */}
                            <div className="flex flex-col w-full h-full relative p-20 items-center justify-center overflow-auto">
                          {/* Title Overlay */}
                          <div className="absolute top-10 left-10 z-10 flex flex-col gap-1">
                            <h2 className="font-['Bebas_Neue'] text-4xl tracking-[0.1em] text-black dark:text-white leading-none">IMAGE TO ELEVATION: UNFOLDED BOX</h2>
                            <div className="h-[2px] w-full bg-black dark:bg-white/20" />
                          </div>

                          {/* [V11] 5-Panel Orthographic Grid Artboard - UNFOLDED BOX Protocol v7 */}
                          {item.parameters?.elevationImages ? (() => {
                            const ei = item.parameters.elevationImages as any;
                            // [V31] 규격화: 모든 유닛 크기를 W:12, D:12, H:15로 고정 적용
                            const W = 12, D = 12, H = 15;
                            
                            // [V28/V29] 통합 개선: 가용 영역 확장 (1500x1100) 및 간격 축소 (12px)
                            const gapTotal = 24; // 12px * 2 gaps
                            const availableW = 1500 - gapTotal;
                            const availableH = 1100 - gapTotal;
                            
                            const dynamicScaleW = availableW / (2 * H + W);
                            const dynamicScaleH = availableH / (2 * H + D);
                            
                            // 최소 배율 25px 보장 (필요 시 스크롤), 최대 배율 45px로 상향하여 가시성 극대화
                            const SCALE = Math.max(25, Math.min(dynamicScaleW, dynamicScaleH, 45)); 

                            // Grid Areas:
                            // . rear .
                            // left top right
                            // . front .

                            return (
                              <div 
                                className="grid gap-[12px] relative mt-10"
                                style={{
                                  gridTemplateColumns: `${H * SCALE}px ${W * SCALE}px ${H * SCALE}px`,
                                  gridTemplateRows: `${H * SCALE}px ${D * SCALE}px ${H * SCALE}px`,
                                  gridTemplateAreas: `". rear ." "left top right" ". front ."`,
                                }}
                              >
                                {([
                                  { id: 'top',   area: 'top',   w: W, h: D, r: 0 },
                                  { id: 'front', area: 'front', w: W, h: H, r: 0 },
                                  { id: 'rear',  area: 'rear',  w: W, h: H, r: 180 },
                                  { id: 'left',  area: 'left',  w: D, h: H, r: 90 },
                                  { id: 'right', area: 'right', w: D, h: H, r: -90 }
                                ] as const).map(view => (
                                  <div 
                                    key={view.id} 
                                    className="relative flex items-center justify-center min-w-0 min-h-0"
                                    style={{ gridArea: view.area }}
                                  >
                                    <div 
                                      className="relative bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded overflow-hidden" 
                                      style={{ 
                                        width: view.w * SCALE, 
                                        height: view.h * SCALE,
                                        transform: `rotate(${view.r}deg)`,
                                        transformOrigin: 'center center'
                                      }}
                                    >
                                      {ei[view.id] ? (
                                        <img src={ei[view.id]} className="w-full h-full object-cover block" alt={view.id} />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center opacity-20 font-mono text-[10px]">INFERRING...</div>
                                      )}
                                    </div>
                                    
                                    {/* Label Overlay - Outside the rotated wrap, placed at the "ground" of each view */}
                                    <div 
                                      className="absolute whitespace-nowrap font-mono text-[11px] font-bold tracking-widest uppercase opacity-60"
                                      style={{
                                        bottom: view.r === 0 ? '-36px' : (view.r === 180 ? 'auto' : (view.r === 90 ? 'auto' : (view.r === -90 ? 'auto' : '-36px'))),
                                        top: view.r === 180 ? '-36px' : 'auto',
                                        left: view.r === 90 ? '-60px' : (view.r === -90 ? 'auto' : '50%'),
                                        right: view.r === -90 ? '-60px' : 'auto',
                                        transform: (view.r === 0 || view.r === 180) ? 'translateX(-50%)' : (view.r === 90 ? 'translateY(-50%) rotate(-90deg)' : 'translateY(-50%) rotate(90deg)'),
                                        transformOrigin: 'center'
                                      }}
                                    >
                                      {view.id === 'top' ? 'TOP (PLAN)' : view.id}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()
                          : item.parameters?.architecturalSheetImage ? (
                                <div className="relative w-full h-full flex items-center justify-center p-4">
                                  <img src={item.parameters.architecturalSheetImage} className="max-w-full max-h-full object-contain mix-blend-multiply dark:mix-blend-screen" alt="Site Plan" />
                                </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-center p-4">
                                      <p className="font-mono opacity-40 uppercase tracking-widest" style={{ fontSize: `${14 / (canvasZoom / 100)}px`}}>No Architectural Sheet Generated</p>
                                    </div>
                                )}
                        </div>
                        </div>
                      </div>
                    )}

                    {isGenerating && selectedItemId === item.id && (item.motherId === item.id || !item.motherId) && (
                      <div className="absolute inset-0 z-[50] flex flex-col items-center justify-center bg-white/60 backdrop-blur-md pointer-events-auto">
                        <Loader2 className="animate-spin text-black w-12 h-12" />
                      </div>
                    )}
                    {/* Corner Handles (Scale Invariant Circles, 4-corner resizable) */}
                    {[
                      { top: true,    left: true,  cursor: 'nwse-resize' }, // top-left
                      { top: true,    right: true, cursor: 'nesw-resize' }, // top-right
                      { bottom: true, left: true,  cursor: 'nesw-resize' }, // bottom-left
                      { bottom: true, right: true, cursor: 'nwse-resize' }, // bottom-right
                    ].map((pos, idx) => {
                      const s = 1 / (canvasZoom / 100);
                      const size = 12 * s;
                      const style: any = {
                        width: size,
                        height: size,
                        borderWidth: 1.6 * s,
                        position: 'absolute',
                        backgroundColor: 'white',
                        borderColor: '#808080',
                        borderRadius: '999px',
                        top: pos.top ? -size / 2 : 'auto',
                        bottom: pos.bottom ? -size / 2 : 'auto',
                        left: pos.left ? -size / 2 : 'auto',
                        right: pos.right ? -size / 2 : 'auto',
                        pointerEvents: 'auto',
                        cursor: pos.cursor,
                      };
                      return <div key={idx} style={style} />;
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Loading Overlay Deleted in V82 */}
        </section>

        {/* RIGHT SIDEBAR WRAPPER (V55: More compact, absolute fixed center) */}
        <div className="absolute top-0 right-0 h-full z-50 pointer-events-none flex justify-end p-[12px]">
          <div className={`
            relative h-full transition-all duration-500 ease-in-out flex items-center
            ${isRightPanelOpen ? 'w-[284px]' : 'w-0'}
          `}>
            {/* FLOATING PANEL - V59: Target Transparency (10% / 90% opacity) */}
            <div className={`w-full h-full overflow-hidden transition-all duration-500 ${isRightPanelOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'}`}>
              <aside 
                className="h-full w-[284px] rounded-[20px] flex flex-col overflow-hidden pointer-events-auto border border-black/50 shadow-xl dark:border-white/50 bg-white/90 dark:bg-black/90 backdrop-blur-sm"
              >
                {/* Sidebar Content Wrapper */}
                <div className={`flex flex-col h-full overflow-y-auto transition-opacity duration-200 ${isRightPanelOpen ? 'opacity-100 delay-150' : 'opacity-0'}`}>
                
                  {/* V25: Dot Navigation Removed */}
                  <div className="pt-6 pb-2" />
                
                  <div className="flex flex-col gap-5 p-5 flex-1">
                    {/* V25: VIEWPOINT Label + Diagram */}
                    <div className="flex flex-col">
                      <div className="font-mono text-xs font-bold tracking-wide uppercase mb-3 opacity-70">Viewpoint</div>
                      <SitePlanDiagram 
                        angle={ANGLES[angleIndex]} 
                        lens={LENSES[lensIndex].value} 
                        isAnalyzing={isAnalyzing}
                        analysisStep={analysisStep}
                        visibleV0Index={visibleV0Index}
                      />
                    </div>
                    
                    <div className="flex flex-col mt-2 space-y-5">
                      {/* Controls */}
                      <div>
                        <div className="flex justify-between font-mono text-xs leading-normal tracking-wide mb-1.5">
                          <span className="opacity-70 uppercase tracking-widest">Angle</span>
                          <span className="font-bold">{ANGLES[angleIndex]}</span>
                        </div>
                        <input type="range" min="0" max={ANGLES.length - 1} step="1" value={angleIndex} onChange={(e) => setAngleIndex(Number(e.target.value))} className="w-full accent-black dark:accent-white cursor-pointer" />
                      </div>
                      <div>
                        <div className="flex justify-between font-mono text-xs leading-normal tracking-wide mb-1.5">
                          <span className="opacity-70 uppercase tracking-widest">Altitude</span>
                          <span className="font-bold">{ALTITUDES[altitudeIndex].label}</span>
                        </div>
                        <input type="range" min="0" max={ALTITUDES.length-1} step="1" value={altitudeIndex} onChange={(e) => setAltitudeIndex(Number(e.target.value))} className="w-full accent-black dark:accent-white cursor-pointer" />
                      </div>
                      <div>
                        <div className="flex justify-between font-mono text-xs leading-normal tracking-wide mb-1.5">
                          <span className="opacity-70 uppercase tracking-widest">Lens</span>
                          <span className="font-bold">{LENSES[lensIndex].label}</span>
                        </div>
                        <input type="range" min="0" max={LENSES.length-1} step="1" value={lensIndex} onChange={(e) => setLensIndex(Number(e.target.value))} className="w-full accent-black dark:accent-white cursor-pointer" />
                      </div>
                      <div>
                        <div className="flex justify-between font-mono text-xs leading-normal tracking-wide mb-1.5">
                          <span className="opacity-70 uppercase tracking-widest">Time</span>
                          <span className="font-bold">{TIMES[timeIndex]}</span>
                        </div>
                        <input type="range" min="0" max={TIMES.length-1} step="1" value={timeIndex} onChange={(e) => setTimeIndex(Number(e.target.value))} className="w-full accent-black dark:accent-white cursor-pointer" />
                      </div>
                    </div>
                  </div>

                {/* BOTTOM ACTION */}
                <div className="p-5 mt-auto border-t border-black/10 dark:border-white/10">
                  {(() => {
                    const selItem = canvasItems.find(i => i.id === selectedItemId);
                    if (!selItem) return null;
                    if (selItem.parameters?.analyzedOpticalParams || selItem.type === 'generated') {
                      return (
                        <button 
                          onClick={handleGenerate}
                          disabled={isGenerating}
                          className="relative w-full border border-black dark:border-white py-2 font-display tracking-widest uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className={`block transition-opacity ${isGenerating ? 'opacity-0' : 'opacity-100'}`}>Generate</span>
                          {isGenerating && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <Loader2 size={18} className="animate-spin" />
                            </span>
                          )}
                        </button>
                      );
                    }
                    return (
                      <button 
                        onClick={() => analyzeViewpoint(selItem.src, selItem.id)}
                        disabled={isAnalyzing}
                        className="w-full border border-black dark:border-white py-2 font-display tracking-widest uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all disabled:opacity-30"
                      >
                        {isAnalyzing ? 'Analyzing...' : 'Analysis'}
                      </button>
                    );
                  })()}
                  <p className="font-mono text-[9px] opacity-40 text-center mt-4 tracking-tighter">
                    © CRETE CO.,LTD. 2026. ALL RIGHTS RESERVED.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
