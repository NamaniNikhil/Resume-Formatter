
import { GoogleGenAI, Type } from "@google/genai";
import { ResumeData, AtsAnalysis } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * STRUCTURED SCHEMA FOR AI PARSING
 * 
 * This schema enforces consistent structure in the AI's response, ensuring that
 * the parsed resume data always conforms to our ResumeData interface. The schema
 * uses Google GenAI's structured output feature to guarantee valid JSON.
 * 
 * Key design decisions:
 * - Required fields ensure data completeness for ATS optimization
 * - Skills are categorized (e.g., "Cloud & Platforms: AWS, Azure, GCP")
 * - Experience descriptions are arrays (enables individual bullet editing)
 * - Dates are flexible strings (accommodates various formats)
 * - Optional fields (linkedin, portfolio, gpa, certifications) gracefully handled
 */
const resumeSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "Full name of the applicant." },
        contact: {
            type: Type.OBJECT,
            properties: {
                phone: { type: Type.STRING, description: "Phone number." },
                email: { type: Type.STRING, description: "Email address." },
                location: { type: Type.STRING, description: "City and State, e.g., 'San Francisco, CA'." },
                linkedin: { type: Type.STRING, description: "URL of LinkedIn profile." },
                portfolio: { type: Type.STRING, description: "URL of personal portfolio or website." },
            },
            required: ["phone", "email", "location"]
        },
        summary: { type: Type.STRING, description: "The professional summary or objective statement." },
        experience: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    company: { type: Type.STRING },
                    jobTitle: { type: Type.STRING },
                    dates: { type: Type.STRING, description: "Employment dates, e.g., 'Jan 2020 - Present'." },
                    description: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of achievements and responsibilities as bullet points." }
                },
                required: ["company", "jobTitle", "dates", "description"]
            }
        },
        education: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    institution: { type: Type.STRING },
                    degree: { type: Type.STRING },
                    dates: { type: Type.STRING, description: "Dates of attendance, e.g., 'Graduated May 2016'." },
                    gpa: { type: Type.STRING, description: "Grade Point Average, if available." },
                },
                required: ["institution", "degree", "dates"]
            }
        },
        skills: { 
            type: Type.ARRAY, 
            items: { 
                type: Type.OBJECT,
                properties: {
                    category: { type: Type.STRING, description: "The category of the skill, e.g., 'Cloud & Platforms'." },
                    details: { type: Type.STRING, description: "A comma-separated string of skills for that category." }
                },
                required: ["category", "details"]
            }, 
            description: "List of relevant skills, grouped by category." 
        },
        certifications: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of certifications." },
    },
    required: ["name", "contact", "summary", "experience", "education", "skills"]
};

/**
 * CORE PARSING FUNCTION: Transform Raw Text → Structured ResumeData
 * 
 * Uses Google's Gemini 2.5 Flash model with structured output to extract resume
 * information from unformatted text. The AI identifies sections (experience,
 * education, skills, etc.) and returns data conforming to our schema.
 * 
 * This is the heart of the app's value proposition: turning messy, unstructured
 * resume text into clean, ATS-optimized data that can be edited and exported.
 * 
 * @param rawText - Unformatted resume text pasted by the user
 * @returns Promise<ResumeData> - Structured resume data ready for preview/export
 * @throws Error if AI fails to parse or returns invalid JSON
 */
export const parseResumeText = async (rawText: string): Promise<ResumeData> => {
  const prompt = `You are an expert resume parsing AI. Extract the information from the following raw resume text and return it as a structured JSON object. 
If skills are categorized (e.g., 'Cloud & Platforms: ...'), extract them into a 'skills' array where each object has a 'category' and a 'details' string.
Ensure each description point for work experience is a separate string in the description array.

Resume Text:
---
${rawText}
---`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: resumeSchema,
    },
  });

  const jsonText = response.text.trim();
  return JSON.parse(jsonText) as ResumeData;
};

/**
 * STRUCTURED SCHEMA FOR ATS ANALYSIS
 * 
 * Defines the structure for ATS (Applicant Tracking System) scoring and analysis.
 * The AI evaluates the resume against best practices and (optionally) a specific
 * job description to provide actionable feedback.
 */
const atsSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.NUMBER, description: "Overall ATS score from 0 to 100." },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of actionable suggestions for improvement." },
        keywords: {
            type: Type.OBJECT,
            properties: {
                matched: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Keywords from the job description found in the resume." },
                missing: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Important keywords from the job description missing from the resume." },
            },
        },
    },
    required: ["score", "suggestions"]
};

/**
 * ATS ANALYSIS FUNCTION: Evaluate Resume Quality & Keyword Matching
 * 
 * Analyzes the structured resume data against ATS best practices and (if provided)
 * a specific job description. Returns a score (0-100) based on weighted criteria:
 * 
 * - Section Completeness (25%): All major sections present
 * - Keyword Relevance (25%): Action verbs, technical skills
 * - Appropriate Length (15%): Ideally 400-800 words
 * - Contact Info (15%): Email, phone, location all present
 * - Format Cleanliness (20%): Proper structure and organization
 * 
 * When a job description is provided, the AI performs keyword matching to identify:
 * - Matched keywords: Present in both resume and JD (good alignment)
 * - Missing keywords: In JD but not in resume (opportunities for improvement)
 * 
 * @param resumeData - Structured resume data from parseResumeText()
 * @param jobDescription - Optional job description for keyword analysis
 * @returns Promise<AtsAnalysis> - Score, suggestions, and keyword analysis
 * @throws Error if AI fails to analyze or returns invalid JSON
 */
export const analyzeAts = async (resumeData: ResumeData, jobDescription: string): Promise<AtsAnalysis> => {
    const resumeJsonString = JSON.stringify(resumeData, null, 2);

    const prompt = `You are an expert ATS (Applicant Tracking System) optimization assistant.
Analyze the provided resume JSON data. Calculate an overall ATS score from 0 to 100 based on these weighted criteria:
- Section Completeness (all major sections present): 25%
- Keyword Relevance (action verbs, technical skills): 25%
- Appropriate Length (ideally 400-800 words): 15%
- Contact Info Completeness (email, phone, location): 15%
- Format Cleanliness (based on structure): 20%

Provide a list of 3-5 concise, actionable suggestions for improvement.

${jobDescription ? `A job description has been provided. Tailor your keyword analysis to it. Identify keywords present in both the resume and description, and keywords missing from the resume.

Job Description:
---
${jobDescription}
---` : 'No job description provided. Perform a general analysis.'}

Resume Data:
---
${resumeJsonString}
---

Return the result as a JSON object.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: atsSchema,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as AtsAnalysis;
};