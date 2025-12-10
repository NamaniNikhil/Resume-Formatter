# Resume Formatter - Flow Diagram

## Visual Flow: Paste → Parse → Preview → Export

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                  │
│                                                                           │
│  ┌─────────────────────┐              ┌──────────────────────────────┐  │
│  │   InputPanel        │              │      PreviewPanel             │  │
│  │                     │              │                               │  │
│  │  ┌───────────────┐  │              │  ┌────────────────────────┐  │  │
│  │  │ Resume Text   │  │              │  │  ClassicPreview  OR    │  │  │
│  │  │   Textarea    │  │              │  │  ModernPreview         │  │  │
│  │  └───────────────┘  │              │  │                        │  │  │
│  │  ┌───────────────┐  │              │  │  ┌──────────────────┐ │  │  │
│  │  │ Job Desc.     │  │              │  │  │ AtsScoreCard     │ │  │  │
│  │  │   Textarea    │  │              │  │  │ (if applicable)  │ │  │  │
│  │  └───────────────┘  │              │  │  └──────────────────┘ │  │  │
│  │         │           │              │  │                        │  │  │
│  │         ▼           │              │  │  All fields editable   │  │  │
│  │  ┌───────────────┐  │              │  │  via EditableField     │  │  │
│  │  │Format & Opt.  │  │              │  └────────────────────────┘  │  │
│  │  │    Button     │  │              │                               │  │
│  │  └───────────────┘  │              └──────────────────────────────┘  │
│  │         │           │                             ▲                   │
│  └─────────┼───────────┘                             │                   │
│            │                                         │                   │
└────────────┼─────────────────────────────────────────┼───────────────────┘
             │                                         │
             │ handleParse()                           │ setResumeData()
             ▼                                         │
┌──────────────────────────────────────────────────────┼───────────────────┐
│                         APP.TSX (STATE MANAGEMENT)   │                   │
│                                                      │                   │
│  AppState {                                         │                   │
│    rawText: string ────────────────┐                │                   │
│    jobDescription: string          │                │                   │
│    resumeData: ResumeData | null ──┼────────────────┘                   │
│    atsAnalysis: AtsAnalysis | null                                      │
│    status: AppStatus (IDLE → PARSING → ANALYZING → SUCCESS)            │
│    selectedTemplate: Template                                            │
│    currentResumeId: string | null                                        │
│    ...                                                                   │
│  }                                                                       │
│                                                                          │
│  ┌────────────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │ handleParse()  │───▶│ handleSave() │───▶│ handleDownloadDocx() │   │
│  └────────────────┘    └──────────────┘    └──────────────────────┘   │
│          │                     │                       │                │
└──────────┼─────────────────────┼───────────────────────┼────────────────┘
           │                     │                       │
           ▼                     ▼                       ▼
┌──────────────────────┐ ┌─────────────────┐  ┌─────────────────────┐
│  geminiService.ts    │ │ supabaseService │  │  docxService.ts     │
│                      │ │                 │  │                     │
│ parseResumeText()    │ │ saveResume()    │  │ generateDocx()      │
│  │                   │ │  │              │  │  │                  │
│  │ 1. Build prompt   │ │  │ 1. Auth     │  │  │ 1. Select       │
│  │ 2. Call GenAI     │ │  │ 2. Construct│  │  │    template     │
│  │ 3. Parse JSON     │ │  │    payload  │  │  │ 2. Build        │
│  │ 4. Return data    │ │  │ 3. Upsert   │  │  │    Document     │
│  │                   │ │  │    to DB    │  │  │ 3. Pack to Blob │
│  ▼                   │ │  │ 4. Return   │  │  │ 4. Download     │
│ ResumeData           │ │  │    saved    │  │  │                  │
│                      │ │  │    record   │  │  ▼                  │
│ analyzeAts()         │ │  ▼             │  │ .docx file         │
│  │                   │ │ SavedResume    │  │                     │
│  │ 1. Build prompt   │ │                │  └─────────────────────┘
│  │ 2. Score criteria │ └─────────────────┘
│  │ 3. Keyword match  │
│  │ 4. Suggestions    │
│  │                   │
│  ▼                   │
│ AtsAnalysis          │
│                      │
└──────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                     GOOGLE GENAI API                                │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Model: gemini-2.5-flash                                     │  │
│  │  Input: Prompt + Raw Resume Text                             │  │
│  │  Output: Structured JSON (enforced by schema)                │  │
│  │                                                               │  │
│  │  Schema defines:                                              │  │
│  │  - name, contact (phone, email, location, linkedin, etc.)    │  │
│  │  - summary (professional objective)                           │  │
│  │  - experience[] (company, jobTitle, dates, description[])    │  │
│  │  - education[] (institution, degree, dates, gpa)             │  │
│  │  - skills[] (category, details)                              │  │
│  │  - certifications[]                                           │  │
│  └─────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                        SUPABASE DATABASE                            │
│                                                                     │
│  Table: resumes                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  id (UUID)                                                    │ │
│  │  user_id (UUID) ──> auth.users                                │ │
│  │  name (TEXT)                                                  │ │
│  │  raw_text (TEXT)         ← Original pasted text               │ │
│  │  resume_data (JSONB)     ← Parsed + edited structured data   │ │
│  │  created_at (TIMESTAMP)                                       │ │
│  │  updated_at (TIMESTAMP)                                       │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

## Key Data Transformations

### 1. Raw Text → Structured Data
```
Input (rawText):
"John Doe
San Francisco, CA | john@email.com | (555) 123-4567
Software Engineer with 5 years experience...
EXPERIENCE
Senior Developer at TechCorp
Jan 2020 - Present
- Led team of 5 engineers..."

                    ↓ parseResumeText()

Output (ResumeData):
{
  name: "John Doe",
  contact: {
    location: "San Francisco, CA",
    email: "john@email.com",
    phone: "(555) 123-4567",
    linkedin: "",
    portfolio: ""
  },
  summary: "Software Engineer with 5 years experience...",
  experience: [
    {
      company: "TechCorp",
      jobTitle: "Senior Developer",
      dates: "Jan 2020 - Present",
      description: [
        "Led team of 5 engineers..."
      ]
    }
  ],
  education: [...],
  skills: [...],
  certifications: [...]
}
```

### 2. Structured Data + Job Description → ATS Analysis
```
Input:
- ResumeData (structured)
- Job Description: "Looking for React developer with AWS experience..."

                    ↓ analyzeAts()

Output (AtsAnalysis):
{
  score: 85,
  suggestions: [
    "Add more React-specific keywords",
    "Quantify achievements with metrics",
    "Include cloud certifications"
  ],
  keywords: {
    matched: ["React", "JavaScript", "AWS", "Git"],
    missing: ["Docker", "Kubernetes", "CI/CD"]
  }
}
```

### 3. Structured Data → Word Document
```
Input:
- ResumeData (structured)
- Template (CLASSIC or MODERN)

                    ↓ generateDocx()

Output:
- Blob (Word document)
- Downloaded as: John_Doe_Resume.docx
```

## Status Flow

```
IDLE
  ↓ User clicks "Format & Optimize"
PARSING
  ↓ AI extraction complete
ANALYZING (if job description provided)
  ↓ ATS analysis complete
SUCCESS
  ↓ User edits inline
SUCCESS (state updates)
  ↓ User clicks "Save"
SAVING
  ↓ Supabase save complete
SUCCESS (with currentResumeId)
  ↓ User clicks ".docx"
GENERATING
  ↓ Document generation complete
SUCCESS
```

## Error Handling

```
Any Status
  ↓ Error occurs
ERROR
  ↓ Error message displayed in PreviewPanel
  ↓ User can retry or fix input
IDLE (ready for retry)
```

## Inline Edit Flow

```
User clicks on name field in preview
  ↓
EditableField receives focus
  ↓
Background changes to indigo-50 (visual feedback)
  ↓
User types "Jane Smith"
  ↓
onChange fires on every keystroke
  ↓
handleUpdate('name', 'Jane Smith')
  ↓
onUpdate({ ...data, name: 'Jane Smith' })
  ↓
App.setResumeData(updatedData)
  ↓
State updates, preview re-renders
  ↓
Change persists in state (available for save/export)
```

## Persistence Flow

```
User has edited resume data
  ↓
Clicks "Save" button
  ↓
handleSaveResume()
  ↓
Constructs payload: { id?, raw_text, resume_data, name }
  ↓
supabaseService.saveResume()
  ↓
Authenticates user
  ↓
Upserts to database (create new or update existing)
  ↓
Returns SavedResume with id
  ↓
App updates savedResumes list and currentResumeId
  ↓
Save button changes to "Saved" (green checkmark)
  ↓
User can continue editing or close
```

## Export Flow (DOCX)

```
User selects template (Classic or Modern)
  ↓
Clicks ".docx" button
  ↓
handleDownloadDocx()
  ↓
generateDocx(resumeData, selectedTemplate)
  ↓
Switch on template type
  ↓
createClassicDoc() OR createModernDoc()
  ↓
Build docx.Document with sections, paragraphs, runs
  ↓
Apply fonts, spacing, borders, colors
  ↓
docx.Packer.toBlob(document)
  ↓
saveAs(blob, 'John_Doe_Resume.docx')
  ↓
Browser downloads file
```

## Export Flow (PDF)

```
User clicks ".pdf" button
  ↓
handleDownloadPdf()
  ↓
window.print()
  ↓
Browser opens print dialog
  ↓
Print CSS hides non-printable elements
  ↓
User selects "Save as PDF"
  ↓
Browser saves PDF
```
