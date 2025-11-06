import { SavedResume, ResumeData } from '../types';

const STORAGE_KEY = 'smart_resume_formatter_resumes';

export const getResumes = (): SavedResume[] => {
  try {
    const resumesJson = localStorage.getItem(STORAGE_KEY);
    return resumesJson ? JSON.parse(resumesJson) : [];
  } catch (error) {
    console.error("Failed to parse resumes from localStorage", error);
    return [];
  }
};

// FIX: The saveResume function was updated to correctly structure the saved object
// according to the `SavedResume` type. It now nests the resume fields under `resume_data`,
// uses `raw_text` instead of `rawText`, and uses `updated_at` instead of the incorrect `savedAt`.
// This resolves the type errors and ensures data consistency with the application's data model.
export const saveResume = (resumeData: ResumeData & { rawText: string; id: string | null }): string => {
  const resumes = getResumes();
  const now = new Date().toISOString();
  
  // Destructure to separate meta from the actual resume data
  const { rawText, id, ...actualResumeData } = resumeData;

  if (id) {
    // Update existing resume
    const index = resumes.findIndex(r => r.id === id);
    if (index !== -1) {
      resumes[index] = {
        // Keep existing user_id
        ...resumes[index],
        // Update fields
        name: actualResumeData.name,
        raw_text: rawText,
        resume_data: actualResumeData,
        updated_at: now,
      };
    } else {
        // If not found, create as new (should not happen often but good to handle)
        const newId = `resume_${Date.now()}`;
        resumes.push({ 
            id: newId,
            updated_at: now,
            name: actualResumeData.name,
            raw_text: rawText,
            resume_data: actualResumeData,
            user_id: 'local_user_fallback'
        });
        resumeData.id = newId;
    }
  } else {
    // Create new resume
    const newId = `resume_${Date.now()}`;
    resumes.push({
      id: newId,
      updated_at: now,
      name: actualResumeData.name,
      raw_text: rawText,
      resume_data: actualResumeData,
      user_id: 'local_user'
    });
    resumeData.id = newId;
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(resumes));
  return resumeData.id!;
};

export const deleteResumeById = (id: string): void => {
  let resumes = getResumes();
  resumes = resumes.filter(resume => resume.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(resumes));
};
