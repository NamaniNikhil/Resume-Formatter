
import { supabase } from './supabaseClient';
import { SavedResume, ResumeData } from '../types';

// Type for data being saved to Supabase
type ResumePayload = {
  id?: string | null;
  name: string;
  raw_text: string;
  resume_data: ResumeData;
};

// Fetches all resumes for the currently logged-in user
export const getResumes = async (): Promise<SavedResume[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', session.user.id);

  if (error) {
    const errorMessage = `Supabase error fetching resumes: ${error.message} (Code: ${error.code})`;
    console.error(errorMessage, error);
    throw new Error(errorMessage);
  }

  return data as SavedResume[];
};

// Saves (inserts or updates) a resume for the currently logged-in user
export const saveResume = async (payload: ResumePayload): Promise<SavedResume> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { id, ...resumeData } = payload;

  const resumeToSave = {
    ...resumeData,
    user_id: user.id,
    updated_at: new Date().toISOString(),
  };

  // Only include the ID if it exists (for updates). For inserts,
  // we let the database generate the UUID.
  if (id) {
    (resumeToSave as any).id = id;
  }

  const { data, error } = await supabase
    .from('resumes')
    .upsert(resumeToSave)
    .select()
    .single(); // .single() is important to get the saved record back

  if (error) {
    const errorMessage = `Supabase error saving resume: ${error.message} (Code: ${error.code})`;
    console.error(errorMessage, error);
    throw new Error(errorMessage);
  }

  return data as SavedResume;
};

// Deletes a resume by its ID
export const deleteResumeById = async (id: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('resumes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // Ensure user can only delete their own resume

  if (error) {
    const errorMessage = `Supabase error deleting resume: ${error.message} (Code: ${error.code})`;
    console.error(errorMessage, error);
    throw new Error(errorMessage);
  }
};
