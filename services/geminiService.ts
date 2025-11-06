
import { GoogleGenAI, Type } from "@google/genai";
import { ResumeData, AtsAnalysis } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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