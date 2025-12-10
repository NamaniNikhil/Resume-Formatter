# Documentation Summary

This document provides a quick reference to the comprehensive documentation available for the Smart Resume Formatter & ATS Optimizer application.

## Documentation Files

### 1. BUSINESS_LOGIC_FLOW.md (1,207 lines)
**Purpose**: Complete technical documentation of the application's business logic

**Contents**:
- Architecture diagram showing the complete flow
- Detailed breakdown of each stage (Input → Parse → Display → Edit → Persist → Export)
- Key data structures and interfaces
- Function signatures and their purposes
- Business logic and validation rules
- State management patterns
- Error handling strategies
- 10 detailed recommendations for improvements with code examples

**Best for**: Understanding how the application works, onboarding new developers, planning enhancements

### 2. FLOW_DIAGRAM.md (316 lines)
**Purpose**: Visual representation of data flow and component interactions

**Contents**:
- High-level architecture diagram
- Component relationship diagrams
- Data transformation examples (raw text → structured data → documents)
- Status flow state machine
- Inline editing flow
- Persistence and export flows
- Step-by-step visual guides for each major operation

**Best for**: Quick visual reference, understanding data flow, debugging issues

### 3. Code Comments (Added to source files)
**Purpose**: In-context documentation for developers reading the code

**Files Enhanced**:
- `App.tsx` - Main business logic functions (handleParse, handleSave, handleDownload)
- `services/geminiService.ts` - AI parsing and ATS analysis
- `services/docxService.ts` - Document generation
- `components/templates/EditableField.tsx` - Inline editing components
- `components/templates/ClassicPreview.tsx` - Update flow explanation

**Best for**: Understanding specific functions while coding, IDE hover hints

## Quick Reference: Main Business Logic Flow

```
User pastes resume text
    ↓
Click "Format & Optimize"
    ↓
handleParse() in App.tsx
    ↓
parseResumeText() in geminiService.ts
    ↓
Google Gemini AI extracts structured data
    ↓
ResumeData returned (name, contact, experience, education, skills, etc.)
    ↓
If job description provided: analyzeAts() for keyword matching
    ↓
PreviewPanel renders with ClassicPreview or ModernPreview
    ↓
User edits inline via EditableField components
    ↓
Changes propagate to App state immediately
    ↓
User clicks "Save" → saveResume() in supabaseService.ts
    ↓
Data stored in Supabase (both raw text and structured data)
    ↓
User clicks ".docx" → generateDocx() in docxService.ts
    ↓
Word document generated and downloaded
```

## Key Components and Their Roles

| Component | Role | Key Functions |
|-----------|------|---------------|
| `App.tsx` | State management & orchestration | handleParse, handleSave, handleDownload |
| `InputPanel.tsx` | User input capture | Textarea for resume text and job description |
| `PreviewPanel.tsx` | Display controller | Routes to appropriate template |
| `ClassicPreview.tsx` | Classic template renderer | Displays structured data with inline editing |
| `ModernPreview.tsx` | Modern template renderer | Two-column layout with inline editing |
| `EditableField.tsx` | Inline editing component | Enables direct editing of parsed data |
| `geminiService.ts` | AI integration | parseResumeText, analyzeAts |
| `docxService.ts` | Document generation | generateDocx, createClassicDoc, createModernDoc |
| `supabaseService.ts` | Persistence | getResumes, saveResume, deleteResume |

## Key Data Structures

### ResumeData
```typescript
{
  name: string,
  contact: { phone, email, location, linkedin?, portfolio? },
  summary: string,
  experience: [{ company, jobTitle, dates, description[] }],
  education: [{ institution, degree, dates, gpa? }],
  skills: [{ category, details }],
  certifications: string[]
}
```

### AtsAnalysis
```typescript
{
  score: number (0-100),
  suggestions: string[],
  keywords: {
    matched: string[],
    missing: string[]
  }
}
```

### AppStatus
```typescript
enum {
  IDLE,
  PARSING,
  ANALYZING,
  GENERATING,
  SUCCESS,
  ERROR,
  LOADING_DATA,
  SAVING
}
```

## Core Services

### geminiService.ts
- **parseResumeText(rawText)**: Converts unstructured text to ResumeData using Google Gemini AI with structured schema
- **analyzeAts(resumeData, jobDescription)**: Scores resume (0-100) and identifies matched/missing keywords

### docxService.ts
- **generateDocx(data, template)**: Creates Word document Blob
- **createClassicDoc(data)**: Traditional chronological layout
- **createModernDoc(data)**: Two-column hybrid layout

### supabaseService.ts
- **getResumes()**: Fetches all resumes for authenticated user
- **saveResume(payload)**: Upserts resume (create or update)
- **deleteResumeById(id)**: Removes resume from database

## Common Development Tasks

### Adding a New Field to Resume
1. Update `ResumeData` interface in `types.ts`
2. Update `resumeSchema` in `geminiService.ts`
3. Add field to template components (`ClassicPreview.tsx`, `ModernPreview.tsx`)
4. Add EditableField for the new field
5. Update `createClassicDoc` and `createModernDoc` in `docxService.ts`

### Adding a New Template
1. Add new value to `Template` enum in `types.ts`
2. Create new preview component (e.g., `CreativePreview.tsx`)
3. Add case in `PreviewPanel.tsx` to render new template
4. Create generator function in `docxService.ts` (e.g., `createCreativeDoc`)
5. Add case in `generateDocx` switch statement
6. Add option to `TemplateSelector.tsx`

### Modifying ATS Scoring Criteria
1. Update weights in `analyzeAts` prompt in `geminiService.ts`
2. Adjust score interpretation in `AtsScoreCard.tsx` if needed
3. Update documentation in `BUSINESS_LOGIC_FLOW.md`

## Testing the Application

### Manual Testing Flow
1. Start dev server: `npm run dev`
2. Log in with test account
3. Paste sample resume text or click "Use Example"
4. Click "Format & Optimize" - verify parsing works
5. (Optional) Add job description and verify ATS analysis
6. Edit fields inline - verify changes persist
7. Click "Save" - verify save status changes
8. Click ".docx" - verify document downloads correctly
9. Click ".pdf" - verify print dialog opens
10. Go to Dashboard - verify saved resume appears
11. Load saved resume - verify data restores correctly
12. Delete resume - verify deletion works

### Common Issues & Solutions
- **Parse fails**: Check API key is set, resume text has clear sections
- **Save fails**: Verify Supabase connection, user is authenticated
- **Export fails**: Check ResumeData is valid and complete
- **Inline edit doesn't work**: Verify EditableField onChange is wired correctly

## Performance Considerations

- AI parsing typically takes 2-5 seconds
- ATS analysis adds 1-3 seconds
- DOCX generation is nearly instant (<100ms)
- Supabase operations typically <500ms

## Security Notes

- API key stored in environment variable (never committed)
- Supabase RLS ensures users only access their own resumes
- No PII is logged or exposed
- All data encrypted in transit (HTTPS)

## Future Enhancement Ideas

See the "Recommendations" section in `BUSINESS_LOGIC_FLOW.md` for detailed suggestions including:
- Improved error handling with retry logic
- Data validation and sanitization
- Performance optimization (React.memo, debouncing)
- Undo/redo functionality
- Additional templates and customization
- Offline support with IndexedDB
- Batch operations
- Analytics and tracking
- Accessibility improvements
- Comprehensive test suite

## Support and Contribution

When contributing:
1. Read `BUSINESS_LOGIC_FLOW.md` to understand the architecture
2. Use `FLOW_DIAGRAM.md` for visual reference
3. Follow existing code patterns and naming conventions
4. Add comments for complex logic
5. Update documentation when adding features
6. Test all flows manually before submitting

## Questions?

For specific questions about:
- **How something works**: Check `BUSINESS_LOGIC_FLOW.md` (search for the component/function name)
- **Data flow**: Check `FLOW_DIAGRAM.md` (visual diagrams)
- **Implementation details**: Read the code comments in the relevant files
- **API usage**: Check service files (`geminiService.ts`, `supabaseService.ts`, `docxService.ts`)

---

*Last updated: 2024*
*Documentation maintained alongside code changes*
