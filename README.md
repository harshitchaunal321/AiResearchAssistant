# AI Research Assistant

An AI-powered research assistant for Engineering and MBA faculty and students.

## Features

1. Literature Search Assistant
2. Research Paper Summarizer
3. Citation & Reference Generator
4. Topic Refinement & Gap Finder
5. Plagiarism Pre-check

## Setup Instructions

1. Clone this repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env`: `cp .env.example .env`
4. Fill in your API keys in the `.env` file
5. Start the server: `npm start`

### API Keys Configuration

The application uses environment variables for API keys to keep them secure. 

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your actual API keys:
   ```
   GEMINI_API_KEY=your_actual_gemini_key
   TOGETHER_AI_API_KEY=your_actual_together_ai_key
   SERP_API_KEY=your_actual_serp_api_key
   OPENALEX_API_KEY=your_actual_openalex_key  # Optional
   CROSSREF_API_KEY=your_actual_crossref_key  # Optional
   ```
