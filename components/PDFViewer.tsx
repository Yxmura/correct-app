import React, { useState } from 'react';
import { Document, pdfjs } from 'react-pdf';
import { PDFPage } from './PDFPage';
import { Annotation, ToolType, ToolSettings } from '../types';
import { Loader2, AlertCircle } from 'lucide-react';

// Configure worker with a reliable CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  normalFile: Blob;
  correctionFile: Blob;
  annotations: Record<number, Annotation[]>;
  onAnnotationsChange: (pageIdx: number, anns: Annotation[]) => void;
  onRemoveAnnotation: (pageIdx: number, id: string) => void;
  tool: ToolType;
  toolSettings: ToolSettings;
  scale: number;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  normalFile,
  correctionFile,
  annotations,
  onAnnotationsChange,
  onRemoveAnnotation,
  tool,
  toolSettings,
  scale
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [correctionDoc, setCorrectionDoc] = useState<any>(null); // Store the loaded correction document proxy
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError(null);
  };

  const onDocumentLoadError = (err: Error) => {
    console.error('Error loading PDF:', err);
    setError(err.message);
  };

  // We load the correction document separately to pass its proxy to pages
  // This allows pages to render their own "magic lens" image snippet
  const onCorrectionDocumentLoadSuccess = (pdf: any) => {
    setCorrectionDoc(pdf);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <AlertCircle className="mb-2" size={32} />
        <p>Failed to load PDF file.</p>
        <p className="text-sm opacity-75">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-slate-200 min-h-screen pt-8 pb-32 px-4">
       {/* Hidden loader for correction doc */}
       <div className="hidden">
          <Document 
            file={correctionFile} 
            onLoadSuccess={onCorrectionDocumentLoadSuccess}
            onLoadError={(err) => console.error("Correction doc load error:", err)}
          >
            {/* We don't render pages here, just need the doc object */}
          </Document>
       </div>

       <Document
        file={normalFile}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div className="flex items-center justify-center h-64 text-slate-500">
            <Loader2 className="animate-spin mr-2" /> Loading PDF...
          </div>
        }
        className="flex flex-col items-center space-y-6"
      >
        {Array.from(new Array(numPages), (_, index) => {
           const pageNumber = index + 1;
           return (
            <PDFPage
              key={`page_${pageNumber}`}
              pageNumber={pageNumber}
              scale={scale}
              tool={tool}
              toolSettings={toolSettings}
              annotations={annotations[pageNumber] || []}
              onAddAnnotation={(ann) => {
                const current = annotations[pageNumber] || [];
                onAnnotationsChange(pageNumber, [...current, ann]);
              }}
              onRemoveAnnotation={(id) => onRemoveAnnotation(pageNumber, id)}
              correctionDoc={correctionDoc}
            />
           );
        })}
      </Document>
    </div>
  );
};