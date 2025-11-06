
import React from 'react';
import { Template, AppStatus } from '../types';
import { TemplateSelector } from './TemplateSelector';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DocumentArrowDownIcon } from './icons/DocumentArrowDownIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon';


interface InputPanelProps {
  rawText: string;
  jobDescription: string;
  setRawText: (text: string) => void;
  setJobDescription: (text: string) => void;
  onParse: () => void;
  onUseExample: () => void;
  onClear: () => void;
  status: AppStatus;
  selectedTemplate: Template;
  setSelectedTemplate: (template: Template) => void;
  onDownloadDocx: () => void;
  onDownloadPdf: () => void;
  isDownloadDisabled: boolean;
  onSave: () => void;
  isSaveDisabled: boolean;
  isSaved: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  rawText,
  jobDescription,
  setRawText,
  setJobDescription,
  onParse,
  onUseExample,
  onClear,
  status,
  selectedTemplate,
  setSelectedTemplate,
  onDownloadDocx,
  onDownloadPdf,
  isDownloadDisabled,
  onSave,
  isSaveDisabled,
  isSaved,
}) => {

  const isLoading = status === AppStatus.PARSING || status === AppStatus.ANALYZING;
  const isSaving = status === AppStatus.SAVING;

  const characterCount = rawText.length;
  const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length;
  const countColor = wordCount > 300 && wordCount < 1000 ? 'text-green-600' : 'text-amber-600';

  const getSaveButtonContent = () => {
    if (isSaving) {
      return <><SpinnerIcon /> Saving...</>;
    }
    if (isSaved) {
      return <><CheckCircleIcon className="h-6 w-6" /> Saved</>;
    }
    return <><ArrowDownTrayIcon className="h-6 w-6" /> Save</>;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col gap-6 non-printable">
      <div>
        <label htmlFor="resume-input" className="block text-sm font-medium text-gray-700 mb-1">
          Paste Your Resume Text
        </label>
        <div className="relative">
          <textarea
            id="resume-input"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste your raw resume text here... or use an example to get started."
            className="w-full h-96 p-4 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out font-mono text-sm"
          />
          <div className="absolute bottom-2 right-3 text-xs text-gray-500">
             <span className={countColor}>{wordCount} words</span> / {characterCount} chars
          </div>
        </div>
        <div className="flex justify-between items-center mt-2 text-sm">
            <div className="flex gap-2">
                <button onClick={onUseExample} className="text-indigo-600 hover:text-indigo-800 font-medium">Use Example</button>
                <span className="text-gray-300">|</span>
                <button onClick={onClear} className="text-red-500 hover:text-red-700 font-medium flex items-center gap-1"><TrashIcon className="h-4 w-4" /> Clear</button>
            </div>
        </div>
      </div>
      
      <div>
        <label htmlFor="jd-input" className="block text-sm font-medium text-gray-700 mb-1">
          Job Description (Optional)
        </label>
        <textarea
          id="jd-input"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here to analyze keyword match."
          className="w-full h-32 p-4 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out font-mono text-sm"
        />
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onParse}
          disabled={isLoading || isSaving}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 transition-colors"
        >
          {isLoading ? <SpinnerIcon /> : <SparklesIcon />}
          {isLoading ? 'Processing...' : 'Format & Optimize'}
        </button>
        <button
            onClick={onSave}
            disabled={isSaveDisabled}
            className={`flex items-center justify-center gap-2 py-3 px-4 border rounded-md shadow-sm text-lg font-medium transition-colors ${
                isSaved
                ? 'bg-green-100 border-green-300 text-green-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-200 disabled:cursor-not-allowed`}
            title={isSaved ? "Resume is saved" : "Save resume"}
        >
            {getSaveButtonContent()}
        </button>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Export Options</h3>
        <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={onDownloadDocx}
              disabled={isDownloadDisabled || status === AppStatus.GENERATING}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-lg font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors"
            >
              {status === AppStatus.GENERATING ? <SpinnerIcon /> : <DownloadIcon />}
              {status === AppStatus.GENERATING ? 'Generating...' : '.docx'}
            </button>
            <button
              onClick={onDownloadPdf}
              disabled={isDownloadDisabled}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-lg font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors"
            >
              <DocumentArrowDownIcon />
              .pdf
            </button>
        </div>
      </div>

    </div>
  );
};
