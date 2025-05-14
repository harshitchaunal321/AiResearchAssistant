// GeminiService for AI text generation
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { gemini } = require('../config/apiKeys');

const genAI = new GoogleGenerativeAI(gemini);

function splitTextIntoChunks(text, chunkSize = 55000) {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.substring(i, i + chunkSize));
    }
    return chunks;
}

/**
 * Summarizes full text content by breaking it into chunks
 * Compatible with the original implementation
 */
async function summarizeSections(text) {
    try {
        console.log(`Starting summarization of text (${text.length} characters)`);

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Split text into manageable chunks for Gemini
        const chunks = splitTextIntoChunks(text, 55000);
        console.log(`Text split into ${chunks.length} chunks for processing`);

        let partialSummaries = [];

        // Process each chunk
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunk.length} characters)`);

            const prompt = `Summarize this document section in academic research paper style:
            
            ${chunk}
            
            Return a concise summary only.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const content = response.text();
            partialSummaries.push(content);

            console.log(`Completed chunk ${i + 1}, summary length: ${content.length} characters`);
        }

        console.log(`All chunks processed. Generating final summary from ${partialSummaries.length} partial summaries`);

        // Final prompt to generate the structured summary
        const finalPrompt = `Based on these summarized parts, generate a final structured research summary in detail with not more than 50000 words covering all the important details with sections:

        1. Abstract
        2. Introduction
        3. Methodology
        4. Findings
        5. Conclusion
           - Key Contributions
           - Identified Gaps
           - Relevance of the work
        
        Use proper HTML formatting.
        
        Here are the parts:
        
        ${partialSummaries.join("\n\n")}`;

        const finalResult = await model.generateContent(finalPrompt);
        const finalResponse = await finalResult.response;
        const finalContent = finalResponse.text();

        console.log(`Final summary generated successfully (${finalContent.length} characters)`);
        return finalContent;
    } catch (error) {
        console.error('Error in summarizeSections:', error);
        throw new Error(`Summarization failed: ${error.message}`);
    }
}

// For academic query interpretation
async function interpretQuery(query) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `Interpret this research query and extract key concepts and keywords: "${query}"`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            interpretedQuery: text,
            keywords: text.match(/\b\w{4,}\b/g) || [],
            concepts: []
        };
    } catch (error) {
        console.error('Error interpreting query:', error);
        throw new Error(`Query interpretation failed: ${error.message}`);
    }
}

module.exports = {
    interpretQuery,
    summarizeSections,
    summarizeText: summarizeSections // alias for compatibility
};