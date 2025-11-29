import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onUpload: (normal: File, correction: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload }) => {
  const [normalFile, setNormalFile] = useState<File | null>(null);
  const [correctionFile, setCorrectionFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = (type: 'normal' | 'correction') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setError('Please upload PDF files only.');
        return;
      }
      setError('');
      if (type === 'normal') setNormalFile(file);
      else setCorrectionFile(file);
    }
  };

  const handleSubmit = () => {
    if (normalFile && correctionFile) {
      onUpload(normalFile, correctionFile);
    } else {
      setError('Both files are required.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Upload Files</h1>
          <p className="text-slate-500">Upload the student's version and the correction key.</p>
        </div>

        <div className="space-y-6">
          {/* Normal File Input */}
          <div className="group relative border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-primary transition-colors bg-slate-50 hover:bg-slate-100">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange('normal')}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${normalFile ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                {normalFile ? <FileText size={24} /> : <Upload size={24} />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">
                  {normalFile ? normalFile.name : 'Student PDF (Normal)'}
                </p>
                <p className="text-sm text-slate-500">
                  {normalFile ? `${(normalFile.size / 1024 / 1024).toFixed(2)} MB` : 'Click or drag to upload'}
                </p>
              </div>
            </div>
          </div>

          {/* Correction File Input */}
          <div className="group relative border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-primary transition-colors bg-slate-50 hover:bg-slate-100">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange('correction')}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${correctionFile ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                {correctionFile ? <FileText size={24} /> : <Upload size={24} />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">
                  {correctionFile ? correctionFile.name : 'Answer Key (Correction)'}
                </p>
                <p className="text-sm text-slate-500">
                  {correctionFile ? `${(correctionFile.size / 1024 / 1024).toFixed(2)} MB` : 'Click or drag to upload'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!normalFile || !correctionFile}
          className="w-full mt-8 bg-primary hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl transform active:scale-[0.98]"
        >
          Start Correction
        </button>

        <p className="mt-4 text-xs text-center text-slate-400">
          Files are stored locally in your browser and will be automatically deleted after 24 hours.
        </p>
      </div>
    </div>
  );
};
