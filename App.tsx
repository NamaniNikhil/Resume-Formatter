

import React, { useState, useCallback, useEffect } from 'react';
import { InputPanel } from './components/InputPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { Header } from './components/Header';
import { parseResumeText, analyzeAts } from './services/geminiService';
import { generateDocx } from './services/docxService';
import { getResumes, saveResume, deleteResumeById } from './services/supabaseService';
import { ResumeData, AtsAnalysis, Template, AppState, AppStatus, SavedResume } from './types';
import { PLACEHOLDER_RESUME } from './constants';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { supabase } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';
import saveAs from 'file-saver';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    status: AppStatus.IDLE,
    rawText: '',
    jobDescription: '',
    resumeData: null,
    atsAnalysis: null,
    selectedTemplate: Template.CLASSIC,
    error: null,
    session: null,
    showDashboard: false,
    savedResumes: [],
    currentResumeId: null,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(s => ({ ...s, session, showDashboard: !!session }));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(s => ({ ...s, session }));
      if (session) {
          setState(s => ({ ...s, showDashboard: true }));
      } else {
         setState(s => ({...s, rawText: '', jobDescription: '', resumeData: null, atsAnalysis: null, status: AppStatus.IDLE, error: null, currentResumeId: null, savedResumes: []}));
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  
  useEffect(() => {
    if (state.session) {
      setState(s => ({ ...s, status: AppStatus.LOADING_DATA }));
      getResumes().then(resumes => {
        setState(s => ({ ...s, savedResumes: resumes, status: AppStatus.IDLE }));
      // FIX: Corrected syntax for catch block by adding parentheses around the error parameter.
      }).catch((err: any) => {
        console.error("Error fetching resumes:", err.message || err);
        setState(s => ({...s, status: AppStatus.ERROR, error: err.message || "Could not load your saved resumes. Check console for details."}));
      });
    }
  }, [state.session]);


  const handleParse = useCallback(async () => {
    if (!state.rawText.trim()) {
      setState(s => ({ ...s, error: 'Resume text cannot be empty.' }));
      return;
    }
    setState(s => ({ ...s, status: AppStatus.PARSING, error: null, currentResumeId: null, atsAnalysis: null }));
    try {
      const parsedData = await parseResumeText(state.rawText);
      setState(s => ({ ...s, status: AppStatus.ANALYZING, resumeData: parsedData }));
      if (state.jobDescription.trim()) {
        const analysis = await analyzeAts(parsedData, state.jobDescription);
        setState(s => ({ ...s, status: AppStatus.SUCCESS, atsAnalysis: analysis }));
      } else {
        setState(s => ({...s, status: AppStatus.SUCCESS}));
      }
    } catch (err: any) {
      console.error("Parse/Analyze Error:", err.message || err);
      setState(s => ({ ...s, status: AppStatus.ERROR, error: err.message || 'The AI failed to understand the resume structure. Please ensure clear headings are used and try again.' }));
    }
  }, [state.rawText, state.jobDescription]);

  const handleDownloadDocx = useCallback(async () => {
    if (!state.resumeData) return;
    setState(s => ({ ...s, status: AppStatus.GENERATING }));
    try {
      const blob = await generateDocx(state.resumeData, state.selectedTemplate);
      saveAs(blob, `${state.resumeData.name.replace(' ', '_')}_Resume.docx`);
      setState(s => ({ ...s, status: AppStatus.SUCCESS }));
    } catch (err: any) {
      console.error("Download Docx Error:", err.message || err);
      setState(s => ({ ...s, status: AppStatus.ERROR, error: err.message || 'Failed to generate DOCX file.' }));
    }
  }, [state.resumeData, state.selectedTemplate]);

  const handleDownloadPdf = () => {
    window.print();
  };
  
  const handleSaveResume = async () => {
    if (!state.resumeData || !state.rawText) return;
    setState(s => ({ ...s, status: AppStatus.SAVING }));
    try {
      const saved = await saveResume({
        id: state.currentResumeId,
        raw_text: state.rawText,
        resume_data: state.resumeData,
        name: state.resumeData.name,
      });
      const updatedResumes = state.savedResumes.filter(r => r.id !== saved.id);
      setState(s => ({
        ...s,
        savedResumes: [...updatedResumes, saved],
        currentResumeId: saved.id,
        status: AppStatus.SUCCESS,
      }));
    } catch (error: any) {
        console.error("Failed to save resume:", error.message || error);
        setState(s => ({ ...s, status: AppStatus.ERROR, error: error.message || "Could not save resume to the cloud."}));
    }
  };

  const handleLoadResume = (resume: SavedResume) => {
    setState(s => ({
      ...s,
      rawText: resume.raw_text,
      resumeData: resume.resume_data,
      currentResumeId: resume.id,
      status: AppStatus.IDLE,
      atsAnalysis: null,
      jobDescription: '',
      showDashboard: false,
      error: null,
    }));
  };

  const handleDeleteResume = async (id: string) => {
    try {
      await deleteResumeById(id);
      setState(s => ({ ...s, savedResumes: s.savedResumes.filter(r => r.id !== id) }));
    } catch (error: any) {
        console.error("Failed to delete resume:", error.message || error);
        setState(s => ({...s, status: AppStatus.ERROR, error: error.message || "Could not delete resume."}));
    }
  };

  const handleUseExample = () => {
    setState(s => ({ ...s, rawText: PLACEHOLDER_RESUME, status: AppStatus.IDLE, error: null, resumeData: null, atsAnalysis: null, currentResumeId: null }));
  };

  const handleClear = () => {
    setState(s => ({ ...s, rawText: '', jobDescription: '', resumeData: null, atsAnalysis: null, status: AppStatus.IDLE, error: null, currentResumeId: null }));
  };

  const setRawText = (text: string) => setState(s => ({ ...s, rawText: text }));
  const setJobDescription = (text: string) => setState(s => ({ ...s, jobDescription: text }));
  const setSelectedTemplate = (template: Template) => setState(s => ({ ...s, selectedTemplate: template }));
  const setResumeData = (data: ResumeData) => setState(s => ({ ...s, resumeData: data }));
  
  if (!state.session) {
    return <LoginScreen />;
  }

  if (state.showDashboard) {
    return (
      <Dashboard
        resumes={state.savedResumes}
        onLoad={handleLoadResume}
        onDelete={handleDeleteResume}
        onClose={() => setState(s => ({ ...s, showDashboard: false }))}
        onNewResume={() => {
            handleClear();
            setState(s => ({...s, showDashboard: false}));
        }}
        isLoading={state.status === AppStatus.LOADING_DATA}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans printable-area">
      <Header 
        session={state.session}
        onShowDashboard={() => setState(s => ({...s, showDashboard: true}))}
      />
      <main className="p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <InputPanel
            rawText={state.rawText}
            jobDescription={state.jobDescription}
            setRawText={setRawText}
            setJobDescription={setJobDescription}
            onParse={handleParse}
            onUseExample={handleUseExample}
            onClear={handleClear}
            status={state.status}
            selectedTemplate={state.selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            onDownloadDocx={handleDownloadDocx}
            onDownloadPdf={handleDownloadPdf}
            isDownloadDisabled={!state.resumeData}
            onSave={handleSaveResume}
            isSaveDisabled={!state.resumeData || state.status === AppStatus.PARSING || state.status === AppStatus.ANALYZING || state.status === AppStatus.SAVING}
            isSaved={!!state.currentResumeId}
          />
          <PreviewPanel
            status={state.status}
            error={state.error}
            resumeData={state.resumeData}
            setResumeData={setResumeData}
            atsAnalysis={state.atsAnalysis}
            template={state.selectedTemplate}
          />
        </div>
      </main>
    </div>
  );
};

export default App;