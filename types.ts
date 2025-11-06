
import { Session, User } from '@supabase/supabase-js';

export interface Contact {
  phone: string;
  email: string;
  location: string;
  linkedin: string;
  portfolio: string;
}

export interface Experience {
  company: string;
  jobTitle: string;
  dates: string;
  description: string[];
}

export interface Education {
  institution: string;
  degree: string;
  dates: string;
  gpa: string;
}

export interface Skill {
    category: string;
    details: string;
}

export interface ResumeData {
  name: string;
  contact: Contact;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  certifications: string[];
}

export interface SavedResume {
  id: string;
  updated_at: string;
  name: string;
  raw_text: string;
  resume_data: ResumeData;
  user_id: string;
}

export interface AtsAnalysis {
  score: number;
  suggestions: string[];
  keywords: {
    matched: string[];
    missing: string[];
  }
}

export enum Template {
  CLASSIC = 'Classic Chronological',
  MODERN = 'Modern Hybrid',
}

export enum AppStatus {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  LOADING_DATA = 'LOADING_DATA',
  SAVING = 'SAVING',
}

export interface AppState {
  status: AppStatus;
  rawText: string;
  jobDescription: string;
  resumeData: ResumeData | null;
  atsAnalysis: AtsAnalysis | null;
  selectedTemplate: Template;
  error: string | null;
  session: Session | null;
  showDashboard: boolean;
  savedResumes: SavedResume[];
  currentResumeId: string | null;
}
