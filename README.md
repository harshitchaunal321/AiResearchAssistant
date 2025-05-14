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
3. Create a `server/config/apiKeys.js` file with your API keys (see example below)
4. Start the server: `npm start`

### API Keys Configuration

Create a `server/config/apiKeys.js` file with the following content:

```javascript
module.exports = {
    gemini: 'YOUR_GEMINI_API_KEY',
    togetherAI: 'YOUR_TOGETHER_AI_API_KEY',
    serpAPI: 'YOUR_SERP_API_KEY',
    openAlex: 'YOUR_OPENALEX_API_KEY', // Optional
    crossref: 'YOUR_CROSSREF_API_KEY' // Optional
};