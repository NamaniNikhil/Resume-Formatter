

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

  /**
   * MAIN BUSINESS LOGIC FLOW: Parse Resume Text → ATS Analysis
   * 
   * This is the core function that orchestrates the transformation of raw resume text
   * into structured, ATS-optimized data. It follows these steps:
   * 
   * 1. Validate input (rawText must not be empty)
   * 2. Set status to PARSING and clear previous results
   * 3. Call geminiService.parseResumeText() to extract structured data via Google GenAI
   * 4. Set status to ANALYZING and store parsed data
   * 5. If job description provided, call geminiService.analyzeAts() for keyword matching
   * 6. Set status to SUCCESS and store ATS analysis (if applicable)
   * 7. On error, set status to ERROR with user-friendly message
   * 
   * The parsed ResumeData flows to PreviewPanel for rendering and inline editing.
   */
  const handleParse = useCallback(async () => {
    // Step 1: Validate input
    if (!state.rawText.trim()) {
      setState(s => ({ ...s, error: 'Resume text cannot be empty.' }));
      return;
    }
    
    // Step 2: Set parsing state, clear previous results
    setState(s => ({ ...s, status: AppStatus.PARSING, error: null, currentResumeId: null, atsAnalysis: null }));
    
    try {
      // Step 3: Parse raw text into structured ResumeData using Google GenAI
      const parsedData = await parseResumeText(state.rawText);
      
      // Step 4: Store parsed data, transition to analyzing state
      setState(s => ({ ...s, status: AppStatus.ANALYZING, resumeData: parsedData }));
      
      // Step 5: If job description provided, analyze ATS score and keyword matching
      if (state.jobDescription.trim()) {
        const analysis = await analyzeAts(parsedData, state.jobDescription);
        setState(s => ({ ...s, status: AppStatus.SUCCESS, atsAnalysis: analysis }));
      } else {
        setState(s => ({...s, status: AppStatus.SUCCESS}));
      }
    } catch (err: any) {
      // Step 7: Handle errors gracefully
      console.error("Parse/Analyze Error:", err.message || err);
      setState(s => ({ ...s, status: AppStatus.ERROR, error: err.message || 'The AI failed to understand the resume structure. Please ensure clear headings are used and try again.' }));
    }
  }, [state.rawText, state.jobDescription]);

  /**
   * EXPORT FLOW: Generate DOCX Document
   * 
   * Converts the structured ResumeData into a professional Word document using
   * the docx library. The selected template (Classic or Modern) determines the
   * layout and styling. The generated Blob is downloaded via file-saver.
   */
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

  /**
   * EXPORT FLOW: Generate PDF Document
   * 
   * Uses browser's native print functionality to create a PDF. The print CSS
   * media queries hide non-printable elements (input panel, buttons) and optimize
   * the preview panel for print layout.
   */
  const handleDownloadPdf = () => {
    window.print();
  };
  
  /**
   * PERSISTENCE FLOW: Save Resume to Supabase
   * 
   * Persists both the raw resume text and structured ResumeData to Supabase.
   * Uses upsert logic: creates new record if no currentResumeId exists, otherwise
   * updates the existing record. This allows users to save their work and continue
   * editing later, including any inline edits made in the preview.
   */
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
      // Remove old version from list (for updates), then add saved version
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

  /**
   * PERSISTENCE FLOW: Load Saved Resume from Dashboard
   * 
   * Restores a previously saved resume from the database. Loads both the original
   * raw text and the parsed/edited ResumeData, allowing users to continue from
   * where they left off without re-parsing.
   */
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