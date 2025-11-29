import React, { useEffect, useRef, useState } from 'react';
import { Page } from 'react-pdf';
import { Annotation, Point, ToolType, ToolSettings } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { X } from 'lucide-react';

interface PDFPageProps {
  pageNumber: number;
  scale: number;
  tool: ToolType;
  toolSettings: ToolSettings;
  annotations: Annotation[];
  onAddAnnotation: (annotation: Annotation) => void;
  onRemoveAnnotation: (id: string) => void;
  correctionDoc: any; // PDFDocumentProxy
}

export const PDFPage: React.FC<PDFPageProps> = ({
  pageNumber,
  scale,
  tool,
  toolSettings,
  annotations,
  onAddAnnotation,
  onRemoveAnnotation,
  correctionDoc
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [correctionPageUrl, setCorrectionPageUrl] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]); // Screen coordinates for drawing performance
  const [selectionStart, setSelectionStart] = useState<Point | null>(null); // Screen coordinates
  const [currentRect, setCurrentRect] = useState<{x: number, y: number, w: number, h: number} | null>(null); // Screen coordinates
  
  // Track component mounted state
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Load correction page background and create Blob URL
  useEffect(() => {
    let currentUrl: string | null = null;
    let renderTask: any = null;

    const renderCorrection = async () => {
      if (!correctionDoc) return;
      try {
        const page = await correctionDoc.getPage(pageNumber);
        // Render at higher res (2x scale) for sharp zoom
        const viewport = page.getViewport({ scale: Math.max(scale, 1.5) * 2 }); 
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        
        if (!context) return;

        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
        
        if (isMounted.current) {
           canvas.toBlob((blob) => {
             if (isMounted.current && blob) {
                currentUrl = URL.createObjectURL(blob);
                setCorrectionPageUrl(currentUrl);
             }
           }, 'image/jpeg', 0.8);
        }
      } catch (e) {
        console.warn(`Rendering correction page ${pageNumber} interrupted or failed`, e);
      }
    };

    renderCorrection();

    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [correctionDoc, pageNumber, scale]); 

  // Draw annotations on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw saved annotations (Need to scale them up)
    annotations.forEach(ann => {
      if (ann.type === 'path') {
        ctx.beginPath();
        ctx.strokeStyle = ann.color;
        // Scale width too? Yes, for consistent look.
        ctx.lineWidth = ann.width * scale; 
        ctx.globalAlpha = ann.opacity;
        
        if (ann.opacity < 1) {
             ctx.globalCompositeOperation = 'multiply';
        } else {
             ctx.globalCompositeOperation = 'source-over';
        }

        if (ann.points.length > 0) {
          ctx.moveTo(ann.points[0].x * scale, ann.points[0].y * scale);
          for (let i = 1; i < ann.points.length; i++) {
            ctx.lineTo(ann.points[i].x * scale, ann.points[i].y * scale);
          }
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
    });

    // Draw current path being drawn (These are already in screen coordinates)
    if (isDrawing && currentPath.length > 0 && (tool === ToolType.DRAW || tool === ToolType.HIGHLIGHT)) {
      ctx.beginPath();
      ctx.strokeStyle = toolSettings.color;
      ctx.lineWidth = toolSettings.width * scale;
      ctx.globalAlpha = toolSettings.opacity;
      if (toolSettings.opacity < 1) {
         ctx.globalCompositeOperation = 'multiply';
      }
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    // Draw current selection rect (Screen coordinates)
    if (isDrawing && currentRect && tool === ToolType.SELECT_CORRECTION) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.fillRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
      ctx.setLineDash([]);
    }

  }, [annotations, currentPath, currentRect, isDrawing, tool, toolSettings, scale]);

  const getCoordinates = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const checkEraserCollision = (x: number, y: number) => {
    // We need to check collisions in Scaled Space (x,y) vs Unscaled Stored Annotations (* scale)
    const unscaledX = x / scale;
    const unscaledY = y / scale;
    const unscaledRadius = 10; // Fixed size in PDF points

    annotations.forEach(ann => {
      // Don't erase correction rectangles with the eraser tool
      if (ann.type === 'correction') return;

      let hit = false;
      if (ann.type === 'path') {
        // Check distance to any point in path
        for (const p of ann.points) {
           const dist = Math.sqrt(Math.pow(p.x - unscaledX, 2) + Math.pow(p.y - unscaledY, 2));
           if (dist < (ann.width / 2) + unscaledRadius) { 
             hit = true;
             break;
           }
        }
      }

      if (hit) {
        onRemoveAnnotation(ann.id);
      }
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCoordinates(e);

    if (tool === ToolType.ERASER) {
      setIsDrawing(true); // Treat erasing as a "drawing" action (drag to erase)
      checkEraserCollision(coords.x, coords.y);
      return;
    }

    if (tool === ToolType.NONE) return;
    
    setIsDrawing(true);
    
    if (tool === ToolType.DRAW || tool === ToolType.HIGHLIGHT) {
      setCurrentPath([coords]);
    } else if (tool === ToolType.SELECT_CORRECTION) {
      setSelectionStart(coords);
      setCurrentRect({ x: coords.x, y: coords.y, w: 0, h: 0 });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e);

    if (tool === ToolType.ERASER) {
      checkEraserCollision(coords.x, coords.y);
    } else if (tool === ToolType.DRAW || tool === ToolType.HIGHLIGHT) {
      setCurrentPath(prev => [...prev, coords]);
    } else if (tool === ToolType.SELECT_CORRECTION && selectionStart) {
      const w = coords.x - selectionStart.x;
      const h = coords.y - selectionStart.y;
      setCurrentRect({
        x: w > 0 ? selectionStart.x : coords.x,
        y: h > 0 ? selectionStart.y : coords.y,
        w: Math.abs(w),
        h: Math.abs(h)
      });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (tool === ToolType.ERASER) {
      // Done erasing
    } else if ((tool === ToolType.DRAW || tool === ToolType.HIGHLIGHT) && currentPath.length > 1) {
      // Normalize points to unscaled PDF coordinates
      const unscaledPoints = currentPath.map(p => ({ x: p.x / scale, y: p.y / scale }));
      
      onAddAnnotation({
        type: 'path',
        id: uuidv4(),
        points: unscaledPoints,
        color: toolSettings.color,
        width: toolSettings.width, 
        opacity: toolSettings.opacity
      });
    } else if (tool === ToolType.SELECT_CORRECTION && currentRect && currentRect.w > 5 && currentRect.h > 5) {
      // Normalize rect
      onAddAnnotation({
        type: 'correction',
        id: uuidv4(),
        x: currentRect.x / scale,
        y: currentRect.y / scale,
        w: currentRect.w / scale,
        h: currentRect.h / scale
      });
    }

    setCurrentPath([]);
    setSelectionStart(null);
    setCurrentRect(null);
  };

  const onPageLoadSuccess = (page: any) => {
    const viewport = page.getViewport({ scale });
    if (canvasRef.current) {
      canvasRef.current.width = viewport.width;
      canvasRef.current.height = viewport.height;
    }
  };

  const getCursor = () => {
    switch (tool) {
      case ToolType.DRAW: return 'crosshair';
      case ToolType.HIGHLIGHT: return 'crosshair';
      case ToolType.SELECT_CORRECTION: return 'cell';
      case ToolType.ERASER: return 'cell'; 
      default: return 'default';
    }
  };

  return (
    <div className="relative mb-8 shadow-lg pdf-page-shadow bg-white inline-block transition-transform origin-top" ref={containerRef}>
      {/* Base PDF Layer */}
      <Page 
        pageNumber={pageNumber} 
        scale={scale} 
        renderTextLayer={false} 
        renderAnnotationLayer={false}
        onLoadSuccess={onPageLoadSuccess}
        className="block"
        loading={<div className="bg-white animate-pulse" style={{ width: 600 * scale, height: 800 * scale }} />}
      />

      {/* Correction Overlay Layer (Rendered Annotation Boxes) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
        {correctionPageUrl && annotations.filter(a => a.type === 'correction').map((ann: any) => {
           const l = ann.x * scale;
           const t = ann.y * scale;
           const w = ann.w * scale;
           const h = ann.h * scale;

           return (
            <div
              key={ann.id}
              className="absolute bg-white overflow-hidden pointer-events-auto group hover:shadow-lg transition-shadow"
              style={{
                left: l,
                top: t,
                width: w,
                height: h,
              }}
            >
               {/* The Magic Lens Image */}
               <div 
                 style={{
                   width: '100%',
                   height: '100%',
                   backgroundImage: `url(${correctionPageUrl})`,
                   backgroundPosition: `-${l}px -${t}px`,
                   backgroundSize: `${canvasRef.current?.width}px ${canvasRef.current?.height}px`,
                   backgroundRepeat: 'no-repeat'
                 }}
               />
               
               {/* Subtle hint that this is an interactive/removable object only on hover */}
               <div className="absolute inset-0 border border-blue-400 opacity-0 group-hover:opacity-50 pointer-events-none" />

               {/* Delete Button - accessible when canvas allows pointer events (Move tool) */}
               <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   onRemoveAnnotation(ann.id);
                 }}
                 className="absolute top-1 right-1 p-1 bg-white/90 text-red-500 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                 title="Remove correction"
               >
                 <X size={14} />
               </button>
            </div>
          );
        })}
      </div>

      {/* Interaction Canvas Layer */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 z-10 touch-none ${tool === ToolType.NONE ? 'pointer-events-none' : ''}`}
        style={{ cursor: getCursor() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};
