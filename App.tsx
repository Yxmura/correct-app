import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ProjectData, ToolType, ToolSettings, Annotation } from './types';
import { FileUpload } from './components/FileUpload';
import { Toolbar } from './components/Toolbar';
import { PDFViewer } from './components/PDFViewer';
import { ConfirmDialog } from './components/ConfirmDialog';
import { saveProject, loadProject } from './utils/storage';

const DEFAULT_SETTINGS: ToolSettings = {
  color: '#ef4444',
  width: 2,
  opacity: 1,
};

function App() {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTool, setCurrentTool] = useState<ToolType>(ToolType.NONE);
  const [toolSettings, setToolSettings] = useState<ToolSettings>(DEFAULT_SETTINGS);
  const [scale, setScale] = useState(1.2);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  // Initial load
  useEffect(() => {
    const init = async () => {
      const saved = await loadProject();
      if (saved) {
        setProject(saved);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  // Save on change (debounced)
  useEffect(() => {
    if (!project) return;
    
    const timeout = setTimeout(async () => {
      setIsSaving(true);
      await saveProject(project);
      setIsSaving(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [project]);

  const handleUpload = async (normal: File, correction: File) => {
    setIsLoading(true);
    const newProject: ProjectData = {
      id: uuidv4(),
      timestamp: Date.now(),
      normalFile: {
        id: uuidv4(),
        name: normal.name,
        blob: normal,
        type: 'normal'
      },
      correctionFile: {
        id: uuidv4(),
        name: correction.name,
        blob: correction,
        type: 'correction'
      },
      annotations: {}
    };
    
    // Create new project
    setProject(newProject);
    // Save immediately
    await saveProject(newProject);
    setIsLoading(false);
  };

  const handleAnnotationChange = (pageIdx: number, newAnns: Annotation[]) => {
    if (!project) return;
    setProject(prev => {
      if (!prev) return null;
      return {
        ...prev,
        annotations: {
          ...prev.annotations,
          [pageIdx]: newAnns
        }
      };
    });
  };
  
  const handleRemoveAnnotation = (pageIdx: number, id: string) => {
     if (!project) return;
     setProject(prev => {
        if (!prev) return null;
        const pageAnns = prev.annotations[pageIdx] || [];
        return {
           ...prev,
           annotations: {
              ...prev.annotations,
              [pageIdx]: pageAnns.filter(a => a.id !== id)
           }
        };
     });
  };

  const handleClearPageRequest = () => {
    setIsResetDialogOpen(true);
  };

  const handleClearPageConfirm = () => {
    setProject(prev => prev ? ({ ...prev, annotations: {} }) : null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-500 font-medium">
        Loading workspace...
      </div>
    );
  }

  if (!project || !project.normalFile || !project.correctionFile) {
    return <FileUpload onUpload={handleUpload} />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden text-slate-900 font-sans">
      <Toolbar 
        currentTool={currentTool} 
        setTool={setCurrentTool}
        settings={toolSettings}
        setSettings={setToolSettings}
        onClearAll={handleClearPageRequest}
        isSaving={isSaving}
        scale={scale}
        setScale={setScale}
      />
      
      <div className="flex-1 overflow-auto relative bg-slate-200">
        <PDFViewer 
          normalFile={project.normalFile.blob}
          correctionFile={project.correctionFile.blob}
          annotations={project.annotations}
          onAnnotationsChange={handleAnnotationChange}
          onRemoveAnnotation={handleRemoveAnnotation}
          tool={currentTool}
          toolSettings={toolSettings}
          scale={scale}
        />
      </div>

      <ConfirmDialog 
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleClearPageConfirm}
        title="Reset all annotations?"
        description="This action cannot be undone. This will permanently delete all your drawings, highlights, and correction reveals."
      />
    </div>
  );
}

export default App;