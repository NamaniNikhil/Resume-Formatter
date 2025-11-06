
import React from 'react';
import { AppStatus, ResumeData, AtsAnalysis, Template } from '../types';
import { ClassicPreview } from './templates/ClassicPreview';
import { ModernPreview } from './templates/ModernPreview';
import { AtsScoreCard } from './AtsScoreCard';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { DocumentMagnifyingGlassIcon } from './icons/DocumentMagnifyingGlassIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';

interface PreviewPanelProps {
  status: AppStatus;
  error: string | null;
  resumeData: ResumeData | null;
  setResumeData: (data: ResumeData) => void;
  atsAnalysis: AtsAnalysis | null;
  template: Template;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ status, error, resumeData, setResumeData, atsAnalysis, template }) => {
  const renderContent = () => {
    if (status === AppStatus.PARSING || status === AppStatus.ANALYZING) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <SpinnerIcon className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">{status === AppStatus.PARSING ? 'Parsing resume...' : 'Analyzing for ATS...'}</p>
          <p className="text-sm">Our AI is working its magic!</p>
        </div>
      );
    }

    if (error) {
       return (
        <div className="flex flex-col items-center justify-center h-full text-red-500">
          <ExclamationTriangleIcon className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">An Error Occurred</p>
          <p className="text-sm text-center px-4">{error}</p>
        </div>
      );
    }
    
    if (status === AppStatus.SUCCESS && resumeData) {
      return (
        <div className="p-4 md:p-8 preview-panel-content">
            {template === Template.CLASSIC && <ClassicPreview data={resumeData} onUpdate={setResumeData} />}
            {template === Template.MODERN && <ModernPreview data={resumeData} onUpdate={setResumeData} />}
        </div>
      );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <DocumentMagnifyingGlassIcon className="h-24 w-24 mb-4" />
            <h3 className="text-xl font-semibold">Resume Preview</h3>
            <p className="mt-2 text-center max-w-sm">Your formatted resume and ATS analysis will appear here once you process your text.</p>
        </div>
    );
  };

  return (
    <div className="relative bg-white rounded-lg shadow-lg flex flex-col">
      {atsAnalysis && (
        <div className="sticky top-0 z-10 p-4 bg-white/80 backdrop-blur-sm border-b border-gray-200 non-printable">
            <AtsScoreCard analysis={atsAnalysis} />
        </div>
      )}
      <div className="flex-grow overflow-auto" style={{ minHeight: '80vh' }}>
        {renderContent()}
      </div>
    </div>
  );
};
