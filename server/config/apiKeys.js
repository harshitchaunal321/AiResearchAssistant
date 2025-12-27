// Load environment variables
require('dotenv').config();

module.exports = {
    gemini: process.env.GEMINI_API_KEY || '',
    togetherAI: process.env.TOGETHER_AI_API_KEY || '',
    serpAPI: process.env.SERP_API_KEY || '',
    openAlex: process.env.OPENALEX_API_KEY || '', // Optional for academic search
    crossref: process.env.CROSSREF_API_KEY || '' // Optional for citation data
};