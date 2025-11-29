import React, { useState, useEffect } from 'react';
import { MousePointer2, Highlighter, Pen, BoxSelect, Trash2, Eraser, ZoomIn, ZoomOut, ChevronDown } from 'lucide-react';
import { ToolType, ToolSettings } from '../types';

interface ToolbarProps {
  currentTool: ToolType;
  setTool: (tool: ToolType) => void;
  settings: ToolSettings;
  setSettings: (settings: ToolSettings) => void;
  onClearAll: () => void;
  isSaving: boolean;
  scale: number;
  setScale: (scale: number) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  currentTool, 
  setTool, 
  settings, 
  setSettings,
  onClearAll,
  isSaving,
  scale,
  setScale
}) => {
  const [activeDropdown, setActiveDropdown] = useState<{ type: 'color' | 'size', x: number, y: number } | null>(null);
  
  const colors = [
    '#ef4444', // Red
    '#f59e0b', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#3b82f6', // Blue
    '#a855f7', // Purple
    '#000000', // Black
    '#ffffff', // White
  ];

  const widths = [2, 5, 10, 20, 40];

  // Close dropdowns on resize/scroll
  useEffect(() => {
    const handleDismiss = () => setActiveDropdown(null);
    window.addEventListener('resize', handleDismiss);
    window.addEventListener('scroll', handleDismiss, true);
    return () => {
      window.removeEventListener('resize', handleDismiss);
      window.removeEventListener('scroll', handleDismiss, true);
    };
  }, []);

  const handleDropdownTrigger = (e: React.MouseEvent, type: 'color' | 'size') => {
    e.stopPropagation();
    if (activeDropdown?.type === type) {
      setActiveDropdown(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      // Simple collision prevention for right edge
      const left = Math.min(rect.left, window.innerWidth - 200); 
      setActiveDropdown({ type, x: Math.max(10, left), y: rect.bottom + 8 });
    }
  };

  return (
    <>
      <div className="h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between shadow-sm z-50 sticky top-0 overflow-x-auto overflow-y-hidden no-scrollbar">
        <div className="flex items-center space-x-2 min-w-max">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <ToolButton 
              active={currentTool === ToolType.NONE} 
              onClick={() => setTool(ToolType.NONE)} 
              icon={<MousePointer2 size={18} />} 
              label="Move" 
            />
             <ToolButton 
              active={currentTool === ToolType.SELECT_CORRECTION} 
              onClick={() => setTool(ToolType.SELECT_CORRECTION)} 
              icon={<BoxSelect size={18} />} 
              label="Reveal Key" 
            />
            <ToolButton 
              active={currentTool === ToolType.HIGHLIGHT} 
              onClick={() => {
                setTool(ToolType.HIGHLIGHT);
                setSettings({ ...settings, opacity: 0.4, width: 20, color: '#eab308' });
              }} 
              icon={<Highlighter size={18} />} 
              label="Highlight" 
            />
            <ToolButton 
              active={currentTool === ToolType.DRAW} 
              onClick={() => {
                setTool(ToolType.DRAW);
                setSettings({ ...settings, opacity: 1, width: 2, color: '#ef4444' });
              }} 
              icon={<Pen size={18} />} 
              label="Pen" 
            />
            <ToolButton 
              active={currentTool === ToolType.ERASER} 
              onClick={() => setTool(ToolType.ERASER)} 
              icon={<Eraser size={18} />} 
              label="Eraser" 
            />
          </div>

          <div className="h-8 w-px bg-slate-200 mx-2" />

          {(currentTool === ToolType.DRAW || currentTool === ToolType.HIGHLIGHT) && (
            <>
              {/* Desktop: Inline Controls */}
              <div className="hidden md:flex items-center space-x-4 animate-fadeIn">
                <div className="flex items-center space-x-1.5">
                  {colors.map(c => (
                    <button
                      key={c}
                      onClick={() => setSettings({ ...settings, color: c })}
                      className={`w-6 h-6 rounded-full border border-slate-300 transition-transform hover:scale-110 ${settings.color === c ? 'ring-2 ring-slate-800 ring-offset-1 scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                      aria-label={`Select color ${c}`}
                    />
                  ))}
                </div>

                <div className="h-8 w-px bg-slate-200" />

                <div className="flex items-center space-x-1">
                  {widths.map(w => (
                    <button
                      key={w}
                      onClick={() => setSettings({ ...settings, width: w })}
                      className={`w-8 h-8 rounded flex items-center justify-center hover:bg-slate-100 transition-colors ${settings.width === w ? 'bg-slate-200' : ''}`}
                      title={`Width: ${w}px`}
                    >
                      <div 
                        className="rounded-full bg-slate-800" 
                        style={{ width: Math.min(w, 20), height: Math.min(w, 20) }} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile: Dropdown Triggers */}
              <div className="flex md:hidden items-center space-x-2 animate-fadeIn">
                 <button
                    onClick={(e) => handleDropdownTrigger(e, 'color')}
                    className="flex items-center space-x-1.5 px-2 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200"
                    title="Change Color"
                 >
                    <div className="w-5 h-5 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: settings.color }} />
                    <ChevronDown size={14} className="text-slate-500" />
                 </button>
                 <button
                    onClick={(e) => handleDropdownTrigger(e, 'size')}
                    className="flex items-center space-x-1.5 px-2 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200"
                    title="Change Size"
                 >
                    <div className="flex items-center justify-center w-5 h-5">
                       <div className="rounded-full bg-slate-800" style={{ width: Math.min(settings.width, 16), height: Math.min(settings.width, 16) }} />
                    </div>
                    <ChevronDown size={14} className="text-slate-500" />
                 </button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-3 ml-4 min-w-max">
           {/* Zoom Controls */}
           <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button 
                onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                className="p-1.5 hover:bg-white rounded-md text-slate-600 disabled:opacity-50"
                disabled={scale <= 0.5}
              >
                <ZoomOut size={16} />
              </button>
              <span className="w-12 text-center text-xs font-medium text-slate-700">
                {Math.round(scale * 100)}%
              </span>
              <button 
                onClick={() => setScale(Math.min(3, scale + 0.1))}
                className="p-1.5 hover:bg-white rounded-md text-slate-600 disabled:opacity-50"
                disabled={scale >= 3}
              >
                <ZoomIn size={16} />
              </button>
           </div>

           <div className="h-8 w-px bg-slate-200" />

           {isSaving && <span className="text-xs text-slate-400 font-medium">Saving...</span>}
           
           <button 
             onClick={onClearAll}
             className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
           >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Reset</span>
           </button>
        </div>
      </div>

      {/* Mobile Dropdowns (Fixed Positioning) */}
      {activeDropdown && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setActiveDropdown(null)} />
          <div 
            className="fixed z-[70] bg-white rounded-xl shadow-2xl border border-slate-100 p-4 animate-scale-in"
            style={{ top: activeDropdown.y, left: activeDropdown.x }}
          >
             {activeDropdown.type === 'color' && (
               <div className="grid grid-cols-4 gap-3">
                 {colors.map(c => (
                   <button
                     key={c}
                     onClick={() => { setSettings({ ...settings, color: c }); setActiveDropdown(null); }}
                     className={`w-8 h-8 rounded-full border border-slate-300 transition-transform ${settings.color === c ? 'ring-2 ring-slate-800 ring-offset-1 scale-110' : 'hover:scale-105'}`}
                     style={{ backgroundColor: c }}
                   />
                 ))}
               </div>
             )}

             {activeDropdown.type === 'size' && (
               <div className="flex flex-col space-y-1 min-w-[120px]">
                 {widths.map(w => (
                   <button
                     key={w}
                     onClick={() => { setSettings({ ...settings, width: w }); setActiveDropdown(null); }}
                     className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${settings.width === w ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                   >
                     <div className="w-6 flex justify-center">
                       <div className="rounded-full bg-slate-800" style={{ width: Math.min(w, 20), height: Math.min(w, 20) }} />
                     </div>
                     <span className="text-sm font-medium text-slate-700">{w}px</span>
                   </button>
                 ))}
               </div>
             )}
          </div>
        </>
      )}
    </>
  );
};

const ToolButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
      active 
        ? 'bg-white text-primary shadow-sm' 
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
    }`}
    title={label}
  >
    {icon}
    <span className="hidden lg:inline">{label}</span>
  </button>
);