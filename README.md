# Smart Resume Formatter & ATS Optimizer

Transform raw resume text into polished, ATS-optimized Word documents using AI-powered parsing and professional templates.

## Features

- **AI-Powered Parsing**: Converts unstructured resume text into clean, structured data using Google Gemini
- **ATS Optimization**: Analyzes resumes against job descriptions with keyword matching and scoring
- **Inline Editing**: Edit parsed resume data directly in the preview with immediate feedback
- **Professional Templates**: Choose between Classic (traditional) or Modern (two-column) layouts
- **Multiple Export Formats**: Download as .docx (Word) or .pdf (print-to-PDF)
- **Cloud Persistence**: Save and load resumes via Supabase authentication and storage
- **Real-time Preview**: See changes instantly as you edit

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Documentation

For developers and contributors, comprehensive documentation is available:

- **[BUSINESS_LOGIC_FLOW.md](./BUSINESS_LOGIC_FLOW.md)** - Detailed explanation of the main business logic flow from paste → parse → preview → export, including:
  - Step-by-step breakdown of each stage
  - Key functions and methods
  - Data structures and schemas
  - Validation rules and business logic
  - Recommendations for improvements

- **[FLOW_DIAGRAM.md](./FLOW_DIAGRAM.md)** - Visual flow diagrams showing:
  - Component interactions
  - State management flow
  - Data transformations
  - API integrations
  - User interaction patterns

These documents provide a complete understanding of how the application works under the hood.
