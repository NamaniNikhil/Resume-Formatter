# Resume Formatter - Business Logic Flow Documentation

## Overview

The Smart Resume Formatter & ATS Optimizer transforms raw resume text into structured, ATS-optimized data through a series of well-defined steps. This document traces the complete flow from when a user pastes resume text to the final export.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER ACTION                                 │
│                    Pastes Resume Text into InputPanel                   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. INPUT FLOW                                                            │
│ Component: InputPanel.tsx                                                │
│ • Textarea captures raw resume text                                     │
│ • Optional job description textarea                                     │
│ • State: rawText, jobDescription managed by App.tsx                     │
│ • Triggers: "Format & Optimize" button → handleParse()                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. DATA PARSING                                                          │
│ Service: geminiService.ts                                                │
│ • Function: parseResumeText(rawText: string)                            │
│ • Google GenAI (gemini-2.5-flash) with structured schema                │
│ • Schema defines: name, contact, summary, experience, education,        │
│   skills, certifications                                                 │
│ • Returns: Promise<ResumeData>                                          │
│ • Status: AppStatus.PARSING                                              │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. DATA PROCESSING & VALIDATION                                          │
│ Location: App.tsx handleParse()                                          │
│ • Validates rawText is not empty                                        │
│ • AI parsing extracts structured ResumeData                             │
│ • Status: AppStatus.ANALYZING                                            │
│ • If jobDescription provided → analyzeAts() for keyword matching        │
│ • Returns: AtsAnalysis (score, suggestions, matched/missing keywords)   │
│ • Status: AppStatus.SUCCESS on completion                                │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. DISPLAY/PREVIEW                                                       │
│ Component: PreviewPanel.tsx                                              │
│ • Receives: resumeData, atsAnalysis, selectedTemplate                   │
│ • Renders: ClassicPreview OR ModernPreview based on template            │
│ • AtsScoreCard displays score and suggestions (if available)            │
│ • Templates use EditableField components for inline editing             │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. USER INTERACTION (Inline Editing)                                     │
│ Components: EditableField.tsx, EditableList.tsx                          │
│ • User clicks on any field → becomes editable input                     │
│ • onChange handlers update local value                                  │
│ • Callbacks: onUpdate(newData: ResumeData) → App.setResumeData()       │
│ • Updates propagate immediately to state                                 │
│ • Delete buttons on list items remove individual entries                │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 6. PERSISTENCE                                                           │
│ Service: supabaseService.ts                                              │
│ • Function: saveResume(payload: ResumePayload)                          │
│ • Saves both raw_text and resume_data (structured JSON)                 │
│ • Uses upsert: creates new if no ID, updates if ID exists               │
│ • Status: AppStatus.SAVING → AppStatus.SUCCESS                           │
│ • Updates savedResumes list and currentResumeId in state                │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 7. EXPORT/OUTPUT                                                         │
│ Service: docxService.ts                                                  │
│ • Function: generateDocx(data: ResumeData, template: Template)          │
│ • Creates Classic or Modern Word document using docx library            │
│ • Classic: Traditional chronological layout                             │
│ • Modern: Two-column hybrid layout with color accents                   │
│ • Returns: Promise<Blob>                                                │
│ • Uses file-saver to download as .docx file                             │
│ • PDF export uses window.print() for browser print dialog               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Flow Breakdown

### 1. Input Flow

**Component:** `InputPanel.tsx`

**Key Elements:**
- **Textarea Input** (`id="resume-input"`): Captures raw resume text
  - `value={rawText}` bound to App state
  - `onChange={(e) => setRawText(e.target.value)}` updates state
  - Character and word count displayed (optimal: 300-1000 words)

- **Job Description Input** (`id="jd-input"`): Optional, for ATS analysis
  - `value={jobDescription}` bound to App state
  - Used for keyword matching in ATS optimization

- **Action Buttons:**
  - "Format & Optimize" → triggers `onParse()` → `App.handleParse()`
  - "Use Example" → loads `PLACEHOLDER_RESUME` from constants
  - "Clear" → resets all state

**Validation:**
```typescript
// App.tsx line 65-67
if (!state.rawText.trim()) {
  setState(s => ({ ...s, error: 'Resume text cannot be empty.' }));
  return;
}
```

**Status Transitions:**
- IDLE → PARSING (on button click)
- Button disabled during PARSING, ANALYZING, or SAVING states

---

### 2. Data Parsing

**Service:** `geminiService.ts`

**Function:** `parseResumeText(rawText: string): Promise<ResumeData>`

**Process:**
1. **AI Prompt Construction** (lines 71-78):
   - Expert system prompt for resume parsing
   - Instructs AI to extract skills as categorized objects
   - Ensures work experience descriptions are separate strings

2. **Google GenAI API Call** (lines 80-87):
   - Model: `gemini-2.5-flash`
   - Response format: `application/json`
   - **Structured Schema Enforcement** using `responseSchema`

3. **Schema Definition** (`resumeSchema`, lines 11-68):
   ```typescript
   {
     name: string,
     contact: {
       phone: string (required),
       email: string (required),
       location: string (required),
       linkedin?: string,
       portfolio?: string
     },
     summary: string,
     experience: Array<{
       company: string,
       jobTitle: string,
       dates: string,
       description: string[]  // Array of bullet points
     }>,
     education: Array<{
       institution: string,
       degree: string,
       dates: string,
       gpa?: string
     }>,
     skills: Array<{
       category: string,      // e.g., "Cloud & Platforms"
       details: string        // Comma-separated skills
     }>,
     certifications?: string[]
   }
   ```

4. **Response Parsing** (lines 89-90):
   - Extracts JSON text from AI response
   - Parses into typed `ResumeData` object

**Key Business Logic:**
- **Required fields** enforce data completeness
- **Skills categorization** improves ATS readability
- **Experience descriptions as arrays** enable bullet point editing
- **Type safety** via TypeScript interfaces

**Error Handling:**
```typescript
// App.tsx lines 79-82
catch (err: any) {
  console.error("Parse/Analyze Error:", err.message || err);
  setState(s => ({ 
    ...s, 
    status: AppStatus.ERROR, 
    error: err.message || 'The AI failed to understand the resume structure...'
  }));
}
```

---

### 3. Data Processing & Validation

**Location:** `App.tsx` `handleParse()` function (lines 64-83)

**Flow:**
1. **Pre-validation**: Check rawText is not empty
2. **Status Update**: Set to `AppStatus.PARSING`
3. **Parse Resume**: Call `parseResumeText(rawText)`
4. **Store Result**: Update state with `resumeData`
5. **ATS Analysis** (conditional):
   - If `jobDescription.trim()` exists
   - Status: `AppStatus.ANALYZING`
   - Call `analyzeAts(parsedData, jobDescription)`
   - Returns: `AtsAnalysis` object

**ATS Analysis Function:** `geminiService.analyzeAts()`

**Scoring Criteria** (lines 112-118):
- **Section Completeness** (25%): All major sections present
- **Keyword Relevance** (25%): Action verbs, technical skills
- **Appropriate Length** (15%): Ideal 400-800 words
- **Contact Info Completeness** (15%): Email, phone, location
- **Format Cleanliness** (20%): Based on structure

**ATS Schema** (lines 93-107):
```typescript
{
  score: number,              // 0-100
  suggestions: string[],      // 3-5 actionable items
  keywords: {
    matched: string[],        // Present in both resume & JD
    missing: string[]         // In JD but not in resume
  }
}
```

**Keyword Matching Logic:**
- Compares resume content against job description
- Identifies matched keywords (good alignment)
- Identifies missing keywords (opportunities to improve)
- Tailored suggestions based on specific job requirements

---

### 4. Display/Preview

**Component:** `PreviewPanel.tsx`

**Rendering Logic** (lines 21-58):

```typescript
if (status === AppStatus.PARSING || status === AppStatus.ANALYZING) {
  // Show spinner with status message
}

if (error) {
  // Show error state with message
}

if (status === AppStatus.SUCCESS && resumeData) {
  // Render selected template with data
}

// Default: Show empty state with instructions
```

**Template Selection:**
- `Template.CLASSIC` → `ClassicPreview.tsx`
- `Template.MODERN` → `ModernPreview.tsx`

**Classic Template** (`ClassicPreview.tsx`):
- Traditional chronological layout
- Centered header with name and contact
- Bold section titles with bottom borders
- Experience: Job title | Company, aligned dates
- Bullet points for achievements
- Inline editable fields throughout

**Modern Template** (`ModernPreview.tsx`):
- Two-column hybrid layout (33% / 67%)
- Left column: Contact, Skills, Education, Certifications
- Right column: Summary, Experience
- Color accents (purple/indigo theme)
- Professional and contemporary design

**ATS ScoreCard** (if `atsAnalysis` exists):
- Displays at top of preview (sticky position)
- Shows score as progress bar with color coding
- Lists suggestions as actionable items
- Shows matched and missing keywords

---

### 5. User Interaction (Inline Editing)

**Components:** `EditableField.tsx`, `EditableList.tsx`

**EditableField Component:**

**Features:**
- Renders as `<input>` or `<textarea>` based on `isTextarea` prop
- Invisible until focused (transparent background)
- Focus state: Indigo highlight background + ring
- `onChange` handler fires on every keystroke
- Updates propagate immediately to parent

**Implementation:**
```typescript
// EditableField.tsx lines 15-17
const handleChange = (e: React.ChangeEvent<...>) => {
  onChange(e.target.value);  // Immediate callback
};
```

**EditableList Component:**

**Features:**
- Renders array of strings as editable list items
- Each item has delete button (visible on hover)
- Delete removes item from array
- Changes propagate via `onChange(newItems: string[])`

**Update Flow in ClassicPreview:**

```typescript
// Example: Updating experience job title
handleArrayUpdate(
  'experience',     // section
  0,                // index
  'jobTitle',       // field
  'New Job Title'   // value
)
  ↓
const newArray = [...data[section]];
newArray[index] = { ...newArray[index], jobTitle: 'New Job Title' };
onUpdate({ ...data, experience: newArray });
  ↓
App.setResumeData(updatedData)
  ↓
State updates, preview re-renders
```

**Supported Edit Operations:**
1. **Direct field edits**: name, summary, contact fields
2. **Nested object edits**: contact.email, contact.phone, etc.
3. **Array item edits**: experience[0].jobTitle, skills[1].category
4. **List item edits**: description bullet points
5. **List item deletion**: Remove individual bullets or certifications

**Data Integrity:**
- Immutable state updates (spread operators)
- Type-safe operations via TypeScript
- Immediate UI feedback

---

### 6. Persistence

**Service:** `supabaseService.ts`

**Function:** `saveResume(payload: ResumePayload): Promise<SavedResume>`

**Process:**

1. **Authentication Check** (lines 34-35):
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) throw new Error('User not authenticated');
   ```

2. **Payload Construction** (lines 37-43):
   ```typescript
   {
     name: string,           // Derived from resumeData.name
     raw_text: string,       // Original pasted text
     resume_data: ResumeData, // Structured JSON object
     user_id: string,        // Current user's ID
     updated_at: string      // ISO timestamp
   }
   ```

3. **Upsert Operation** (lines 51-55):
   - If `id` exists: Updates existing resume
   - If no `id`: Creates new resume (DB generates UUID)
   - Uses `.single()` to return saved record

4. **State Management** (App.tsx lines 106-118):
   ```typescript
   // Remove old version from list (if updating)
   const updatedResumes = state.savedResumes.filter(r => r.id !== saved.id);
   
   // Add saved version to list
   setState(s => ({
     savedResumes: [...updatedResumes, saved],
     currentResumeId: saved.id,  // Track as saved
     status: AppStatus.SUCCESS
   }));
   ```

**Save Button States:**
- **Disabled**: No resumeData OR currently parsing/analyzing/saving
- **"Save"**: Resume has unsaved changes
- **"Saved" (green)**: Current state matches saved version (currentResumeId exists)

**Supabase Table Structure:**
```sql
resumes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT,
  raw_text TEXT,
  resume_data JSONB,
  updated_at TIMESTAMP,
  created_at TIMESTAMP
)
```

**Loading Saved Resumes** (`getResumes()`):
- Fetches all resumes for authenticated user
- Called on session initialization
- Populates Dashboard with user's saved resumes

**Deleting Resumes** (`deleteResumeById()`):
- Verifies user owns resume (user_id check)
- Removes from database and local state
- Prevents accidental data loss

---

### 7. Export/Output

**Service:** `docxService.ts`

**Function:** `generateDocx(data: ResumeData, template: Template): Promise<Blob>`

#### Classic Template Generation

**Function:** `createClassicDoc(data: ResumeData)` (lines 11-61)

**Structure:**
1. **Header Section**:
   - Name in uppercase, bold, 20pt, centered
   - Contact line: Location | Phone | Email, centered

2. **Section Pattern**:
   ```typescript
   createSectionTitle('Section Name')
     → Bold, 12pt, bottom border
   
   Section content paragraphs
   ```

3. **Experience Formatting** (lines 69-96):
   - Header paragraph with tab stops
   - Job Title (bold) | Company → Dates (right-aligned via tab)
   - Bullet points for descriptions (360 DXA indent)

4. **Education Formatting** (lines 98-121):
   - Institution (bold) → Dates (right-aligned)
   - Degree line (italic), includes GPA if present

5. **Skills Formatting** (lines 124-130):
   - Category (bold): Details
   - Each skill on separate line

**Document Properties:**
- Page size: A4 (11906 × 16838 DXA)
- Margins: 720 DXA (0.5 inches) on all sides
- Font: Calibri, 11pt body text
- Professional, traditional layout

#### Modern Template Generation

**Function:** `createModernDoc(data: ResumeData)` (lines 134-201)

**Structure:**
1. **Header**:
   - Name as H1 (30pt)
   - Job title as H3 (14pt, purple color)

2. **Two-Column Table Layout**:
   - **Left Column (33%)**:
     - Contact information
     - Skills (categorized)
     - Education
     - Certifications
   
   - **Right Column (67%)**:
     - Professional Summary
     - Experience (with bullet points)

3. **Experience Formatting** (lines 205-225):
   - Job Title (bold) → Dates (right-aligned)
   - Company (bold, purple color)
   - Bullet points for achievements

4. **Styling**:
   - Font: Arial
   - Color accents: Purple/Indigo (#5B21B6, #4C1D95)
   - Modern, contemporary design
   - Section titles in uppercase

**Document Properties:**
- Invisible table borders (borderless layout)
- Column widths: 33% / 67%
- Vertical alignment: Top
- Clean, professional appearance

#### Export Process

**DOCX Export** (App.tsx lines 85-96):
```typescript
const blob = await generateDocx(state.resumeData, state.selectedTemplate);
saveAs(blob, `${state.resumeData.name.replace(' ', '_')}_Resume.docx`);
```

**PDF Export** (App.tsx lines 98-100):
```typescript
const handleDownloadPdf = () => {
  window.print();  // Opens browser print dialog
};
```

**Print Styling:**
- CSS classes `printable-area` and `non-printable`
- Hides input panel, buttons, and ATS card on print
- Optimizes preview panel for print layout

---

## Key Data Structures

### ResumeData (types.ts lines 31-39)

```typescript
interface ResumeData {
  name: string;
  contact: Contact;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  certifications: string[];
}
```

### AppState (types.ts lines 75-87)

```typescript
interface AppState {
  status: AppStatus;              // Current operation status
  rawText: string;                // Original pasted text
  jobDescription: string;         // Optional JD for ATS
  resumeData: ResumeData | null;  // Structured resume
  atsAnalysis: AtsAnalysis | null; // ATS score & suggestions
  selectedTemplate: Template;     // CLASSIC or MODERN
  error: string | null;           // Error message
  session: Session | null;        // Supabase auth session
  showDashboard: boolean;         // Dashboard visibility
  savedResumes: SavedResume[];    // User's saved resumes
  currentResumeId: string | null; // ID of current resume
}
```

### AppStatus (types.ts lines 64-73)

```typescript
enum AppStatus {
  IDLE = 'IDLE',              // Ready for input
  PARSING = 'PARSING',        // AI parsing resume
  ANALYZING = 'ANALYZING',    // AI analyzing ATS
  GENERATING = 'GENERATING',  // Creating DOCX file
  SUCCESS = 'SUCCESS',        // Operation complete
  ERROR = 'ERROR',            // Operation failed
  LOADING_DATA = 'LOADING_DATA', // Fetching from DB
  SAVING = 'SAVING'           // Saving to DB
}
```

---

## Business Logic & Validation Rules

### Input Validation

1. **Empty Text Check**:
   - Resume text must not be empty or whitespace-only
   - Error message: "Resume text cannot be empty."

2. **Word Count Indicator**:
   - Green: 300-1000 words (optimal)
   - Amber: Outside optimal range
   - No hard limits enforced

### AI Parsing Rules

1. **Required Fields**:
   - Name, contact (phone, email, location), summary, experience, education, skills
   - Missing fields will cause parsing to fail

2. **Data Transformation**:
   - Skills: Extracted as categorized objects (category + details)
   - Experience descriptions: Split into array of bullet points
   - Dates: Preserved as strings (flexible format)

3. **Optional Fields**:
   - LinkedIn, portfolio, GPA, certifications
   - Gracefully handled if missing

### ATS Scoring Logic

**Scoring Components** (weighted):
- Section completeness: 25%
- Keyword relevance: 25%
- Appropriate length: 15%
- Contact info: 15%
- Format cleanliness: 20%

**Score Interpretation**:
- 90-100: Excellent
- 75-89: Good
- 60-74: Fair
- Below 60: Needs improvement

**Keyword Analysis**:
- Only performed if job description provided
- Identifies matched keywords (positive signal)
- Identifies missing keywords (improvement opportunities)

### Persistence Rules

1. **Authentication Required**:
   - All CRUD operations require valid Supabase session
   - User can only access their own resumes (RLS enforced)

2. **Upsert Logic**:
   - No ID: Create new resume (DB generates UUID)
   - With ID: Update existing resume
   - Both raw_text and resume_data saved for flexibility

3. **Data Integrity**:
   - Updated_at timestamp on every save
   - Name field required for listing in dashboard

### Export Rules

1. **DOCX Generation**:
   - Requires valid ResumeData object
   - Template selection determines layout
   - Filename: `{Name}_Resume.docx` (spaces replaced with underscores)

2. **PDF Export**:
   - Uses browser's native print functionality
   - CSS media queries optimize print layout
   - Works with any browser's "Save as PDF" option

---

## State Management Flow

### State Update Patterns

1. **Immutable Updates**:
   ```typescript
   setState(s => ({ ...s, field: newValue }))
   ```

2. **Nested Object Updates**:
   ```typescript
   setState(s => ({ ...s, contact: { ...s.contact, email: newEmail } }))
   ```

3. **Array Updates**:
   ```typescript
   const newArray = [...oldArray];
   newArray[index] = { ...newArray[index], field: newValue };
   setState(s => ({ ...s, arrayField: newArray }))
   ```

### Status Transitions

```
IDLE
  ↓ (User clicks "Format & Optimize")
PARSING
  ↓ (AI parsing complete)
ANALYZING (if job description provided)
  ↓ (ATS analysis complete)
SUCCESS
```

```
SUCCESS
  ↓ (User clicks "Save")
SAVING
  ↓ (Supabase save complete)
SUCCESS (with currentResumeId set)
```

```
SUCCESS
  ↓ (User clicks ".docx")
GENERATING
  ↓ (DOCX generation complete)
SUCCESS
```

```
Any Status
  ↓ (Error occurs)
ERROR (with error message)
```

---

## Recommendations

### Current Strengths

1. **Clean Separation of Concerns**:
   - UI components (InputPanel, PreviewPanel, templates)
   - Business logic services (geminiService, docxService, supabaseService)
   - Type definitions (types.ts)
   - Constants (constants.ts)

2. **Type Safety**:
   - Strong TypeScript typing throughout
   - Structured schemas enforce AI output consistency
   - Interfaces prevent data mismatches

3. **User Experience**:
   - Inline editing for immediate feedback
   - Real-time word/character count
   - Clear status indicators during operations
   - Error messages guide users

4. **ATS Optimization**:
   - Structured data improves ATS parsing
   - Keyword matching against job descriptions
   - Actionable suggestions for improvement

### Areas for Improvement

#### 1. Error Handling & User Feedback

**Current Issues**:
- Generic error messages may not help users fix issues
- No retry mechanism for failed AI requests
- Network errors not distinguished from parsing errors

**Recommendations**:
```typescript
// Add more specific error types
enum ErrorType {
  NETWORK_ERROR,
  AI_PARSE_ERROR,
  VALIDATION_ERROR,
  AUTH_ERROR,
  DATABASE_ERROR
}

// Add retry logic for transient failures
const parseWithRetry = async (text: string, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await parseResumeText(text);
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await delay(1000 * (i + 1)); // Exponential backoff
    }
  }
};
```

#### 2. Data Validation & Sanitization

**Current Issues**:
- AI output trusted without validation
- No checks for malformed data (e.g., invalid email format)
- Large text inputs could cause performance issues

**Recommendations**:
```typescript
// Add validation service
export const validateResumeData = (data: ResumeData): ValidationResult => {
  const errors: string[] = [];
  
  // Email validation
  if (!isValidEmail(data.contact.email)) {
    errors.push('Invalid email format');
  }
  
  // Phone validation
  if (!isValidPhone(data.contact.phone)) {
    errors.push('Invalid phone format');
  }
  
  // Experience validation
  if (data.experience.length === 0) {
    errors.push('At least one experience entry required');
  }
  
  // Check for empty descriptions
  data.experience.forEach((exp, idx) => {
    if (exp.description.length === 0) {
      errors.push(`Experience ${idx + 1} has no descriptions`);
    }
  });
  
  return { valid: errors.length === 0, errors };
};

// Apply after AI parsing
const parsedData = await parseResumeText(state.rawText);
const validation = validateResumeData(parsedData);
if (!validation.valid) {
  // Show validation errors to user with fix suggestions
}
```

#### 3. Performance Optimization

**Current Issues**:
- Entire state object spread on every update
- Preview re-renders on any state change
- No debouncing on inline edits

**Recommendations**:
```typescript
// Add React.memo to prevent unnecessary re-renders
export const PreviewPanel: React.FC<PreviewPanelProps> = React.memo(({ ... }) => {
  // Component logic
});

// Debounce inline edits
const debouncedUpdate = useMemo(
  () => debounce((newValue: string) => {
    onChange(newValue);
  }, 300),
  [onChange]
);

// Use useReducer for complex state management
const [state, dispatch] = useReducer(appReducer, initialState);

// Actions
dispatch({ type: 'UPDATE_RESUME_FIELD', payload: { field: 'name', value: 'John Doe' } });
dispatch({ type: 'SET_STATUS', payload: AppStatus.PARSING });
```

#### 4. Undo/Redo Functionality

**Current Issues**:
- No way to undo inline edits
- Users might accidentally delete important data
- No history tracking

**Recommendations**:
```typescript
// Implement history stack
interface HistoryState {
  past: ResumeData[];
  present: ResumeData;
  future: ResumeData[];
}

const handleUndo = () => {
  if (history.past.length > 0) {
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    setHistory({
      past: newPast,
      present: previous,
      future: [history.present, ...history.future]
    });
  }
};

const handleRedo = () => {
  if (history.future.length > 0) {
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    setHistory({
      past: [...history.past, history.present],
      present: next,
      future: newFuture
    });
  }
};

// Keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      handleUndo();
    }
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      handleRedo();
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [history]);
```

#### 5. Additional Template Features

**Current Issues**:
- Only two templates available
- No customization options (colors, fonts)
- No preview before export

**Recommendations**:
```typescript
// Add template customization
interface TemplateOptions {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: 'Calibri' | 'Arial' | 'Times New Roman' | 'Georgia';
  fontSize: 10 | 11 | 12;
  margins: 'narrow' | 'normal' | 'wide';
}

// Add more templates
enum Template {
  CLASSIC = 'Classic Chronological',
  MODERN = 'Modern Hybrid',
  CREATIVE = 'Creative Portfolio',
  EXECUTIVE = 'Executive Summary',
  TECHNICAL = 'Technical Skills-First'
}

// Preview modal before download
const [showPreviewModal, setShowPreviewModal] = useState(false);

const handlePreviewDocx = () => {
  setShowPreviewModal(true);
  // Render preview of how DOCX will look
};
```

#### 6. Offline Support

**Current Issues**:
- Requires internet for AI parsing
- No offline editing capability
- Data loss risk if connection drops

**Recommendations**:
```typescript
// Use IndexedDB for local storage
import { openDB } from 'idb';

const db = await openDB('resume-formatter', 1, {
  upgrade(db) {
    db.createObjectStore('drafts', { keyPath: 'id' });
  }
});

// Auto-save drafts
useEffect(() => {
  const autosave = setInterval(() => {
    if (state.resumeData) {
      db.put('drafts', {
        id: 'current-draft',
        data: state.resumeData,
        timestamp: Date.now()
      });
    }
  }, 30000); // Every 30 seconds
  
  return () => clearInterval(autosave);
}, [state.resumeData]);

// Restore draft on load
useEffect(() => {
  db.get('drafts', 'current-draft').then(draft => {
    if (draft && !state.resumeData) {
      // Prompt user to restore draft
      if (confirm('Found unsaved draft. Restore?')) {
        setState(s => ({ ...s, resumeData: draft.data }));
      }
    }
  });
}, []);
```

#### 7. Batch Operations

**Current Issues**:
- Can only process one resume at a time
- No bulk export functionality
- No template comparison view

**Recommendations**:
```typescript
// Add batch processing
const handleBatchParse = async (textArray: string[]) => {
  const results = await Promise.allSettled(
    textArray.map(text => parseResumeText(text))
  );
  
  const successful = results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<ResumeData>).value);
  
  const failed = results
    .filter(r => r.status === 'rejected')
    .length;
  
  return { successful, failed };
};

// Template comparison view
const [comparisonMode, setComparisonMode] = useState(false);

{comparisonMode && (
  <div className="grid grid-cols-2 gap-4">
    <ClassicPreview data={resumeData} />
    <ModernPreview data={resumeData} />
  </div>
)}
```

#### 8. Analytics & Tracking

**Current Issues**:
- No usage metrics
- Can't identify common parsing failures
- No user behavior insights

**Recommendations**:
```typescript
// Add analytics service
export const trackEvent = (event: string, properties?: Record<string, any>) => {
  // Use privacy-respecting analytics (e.g., Plausible, Fathom)
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(event, { props: properties });
  }
};

// Track key events
trackEvent('resume_parsed', { wordCount: rawText.split(/\s+/).length });
trackEvent('template_selected', { template: selectedTemplate });
trackEvent('ats_score', { score: atsAnalysis.score });
trackEvent('export_format', { format: 'docx' });

// Error tracking
trackEvent('parse_error', { 
  errorMessage: err.message,
  textLength: rawText.length 
});
```

#### 9. Accessibility Improvements

**Current Issues**:
- Focus management not optimized
- Screen reader support could be better
- Keyboard navigation limited

**Recommendations**:
```typescript
// Add ARIA labels
<button
  onClick={onParse}
  aria-label="Format and optimize resume using AI"
  aria-busy={isLoading}
  aria-disabled={isLoading || isSaving}
>
  {isLoading ? 'Processing...' : 'Format & Optimize'}
</button>

// Add keyboard shortcuts
<div role="region" aria-label="Resume preview">
  {/* Preview content */}
</div>

// Skip links for keyboard users
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

// Focus management
useEffect(() => {
  if (status === AppStatus.SUCCESS && previewRef.current) {
    previewRef.current.focus();
  }
}, [status]);
```

#### 10. Testing & Quality Assurance

**Current Issues**:
- No automated tests
- Manual testing only
- No CI/CD pipeline

**Recommendations**:
```typescript
// Unit tests for services
describe('geminiService', () => {
  it('should parse resume text correctly', async () => {
    const result = await parseResumeText(mockResumeText);
    expect(result.name).toBe('John Doe');
    expect(result.experience).toHaveLength(2);
  });
  
  it('should handle parsing errors gracefully', async () => {
    await expect(parseResumeText('')).rejects.toThrow();
  });
});

// Integration tests
describe('Resume flow', () => {
  it('should parse, edit, and export resume', async () => {
    render(<App />);
    
    // Paste text
    const textarea = screen.getByLabelText('Paste Your Resume Text');
    fireEvent.change(textarea, { target: { value: mockResumeText } });
    
    // Click parse
    const parseButton = screen.getByText('Format & Optimize');
    fireEvent.click(parseButton);
    
    // Wait for parsing
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Edit name
    const nameField = screen.getByDisplayValue('John Doe');
    fireEvent.change(nameField, { target: { value: 'Jane Smith' } });
    
    // Export
    const exportButton = screen.getByText('.docx');
    fireEvent.click(exportButton);
    
    // Verify download
    expect(mockSaveAs).toHaveBeenCalledWith(
      expect.any(Blob),
      'Jane_Smith_Resume.docx'
    );
  });
});

// E2E tests with Playwright
test('full resume workflow', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Login
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button:has-text("Sign In")');
  
  // Paste resume
  await page.fill('textarea#resume-input', mockResumeText);
  
  // Parse
  await page.click('button:has-text("Format & Optimize")');
  
  // Wait for result
  await page.waitForSelector('text=John Doe');
  
  // Edit inline
  await page.click('text=John Doe');
  await page.fill('[value="John Doe"]', 'Jane Smith');
  
  // Save
  await page.click('button:has-text("Save")');
  await page.waitForSelector('text=Saved');
  
  // Export
  await page.click('button:has-text(".docx")');
  
  // Verify download
  const download = await page.waitForEvent('download');
  expect(download.suggestedFilename()).toBe('Jane_Smith_Resume.docx');
});
```

---

## Conclusion

The Resume Formatter application provides a streamlined, AI-powered workflow for transforming raw resume text into polished, ATS-optimized documents. The architecture is well-organized with clear separation of concerns, making it maintainable and extensible.

The main business logic flow follows a clear path:
1. **Input** → User pastes text
2. **Parse** → AI extracts structure
3. **Display** → Formatted preview rendered
4. **Edit** → Inline modifications
5. **Persist** → Save to cloud
6. **Export** → Generate professional document

The recommendations above focus on improving robustness, user experience, and functionality while maintaining the clean architecture that makes the codebase easy to work with.
