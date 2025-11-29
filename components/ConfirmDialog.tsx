import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you absolutely sure?",
  description = "This action cannot be undone. This will permanently delete your annotations."
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center font-sans">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      />
      
      {/* Dialog Content */}
      <div className="z-[101] grid w-[90%] max-w-lg gap-4 border bg-white p-6 shadow-lg rounded-lg sm:rounded-lg animate-scale-in">
        <div className="flex flex-col space-y-2 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="text-sm text-slate-500">
            {description}
          </p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white border border-slate-200 hover:bg-slate-100 hover:text-slate-900 h-10 py-2 px-4 mt-2 sm:mt-0"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white bg-red-600 text-white hover:bg-red-700 h-10 py-2 px-4"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};