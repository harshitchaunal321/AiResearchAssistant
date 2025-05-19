const express = require('express');
const router = express.Router();
const academicService = require('./services/academicService');
const geminiService = require('./services/geminiService');
const togetherService = require('./services/togetherService');
const serpService = require('./services/serpService');
const pdfService = require('./services/pdfService');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const { Packer } = require('docx');
const PDFDocument = require('pdfkit');

// const { fileURLToPath } = require('url');


// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const ERROR_MESSAGES = {
    DEFAULT: "An unexpected error occurred. Please try again later.",
    INVALID_INPUT: "Please provide valid input for this operation.",
    PDF_EXTRACTION: "We couldn't extract text from the PDF. Please ensure it's a valid research paper.",
    SUMMARIZATION: "We couldn't summarize this content. Please try with different content.",
    CITATION: "We couldn't generate a citation for this paper. Please check the details and try again.",
    TOPIC_REFINEMENT: "We couldn't refine your research topic. Please try with a different description.",
    PLAGIARISM: "We couldn't check for plagiarism at this time. Please try again later.",
    DRAFT_GENERATION: "We couldn't generate your research draft. Please check your inputs and try again.",
    EXPORT: "We couldn't generate the export file. Please try again or contact support.",
    API_LIMIT: "We're experiencing high demand. Please try again in a few minutes.",
    NETWORK: "Network error occurred. Please check your connection and try again."
};

const filePath = path.join(__dirname, '../downloads', `${Date.now()}.pdf`);


// Helper function to format errors
function formatError(error, customMessage = null) {
    console.error('Server Error:', error); // Log detailed error for debugging

    const statusCode = error.statusCode || 500;
    const message = customMessage ||
        error.userMessage ||
        ERROR_MESSAGES[error.type] ||
        ERROR_MESSAGES.DEFAULT;

    return {
        statusCode,
        error: 'API Error',
        message,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
}

async function downloadPDFViaPuppeteer(url, filePath) {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    let pdfDownloaded = false;

    page.on('response', async (response) => {
        const contentType = response.headers()['content-type'];
        if (contentType && contentType.includes('application/pdf') && !pdfDownloaded) {
            const buffer = await response.buffer();
            fs.writeFileSync(filePath, buffer);
            pdfDownloaded = true;
        }
    });

    await page.goto(url, { waitUntil: 'networkidle2' });
    await browser.close();

    if (!pdfDownloaded) {
        throw new Error('Failed to download PDF from the provided URL');
    }
}


// Literature Search
router.post('/literature/search', async (req, res) => {
    try {
        // Ensure body parser is configured properly in app.js
        const { topic } = req.body;

        if (!topic || typeof topic !== 'string') {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Topic parameter is required and must be a string',
                userMessage: 'Please enter a valid research topic to search'
            });
        }

        console.log(`Received search request for topic: "${topic}"`); // Debug log

        // First refine the query
        const refinedQuery = await academicService.refineQuery(topic);
        console.log(`Refined query: "${refinedQuery}"`); // Debug log

        // Search with the refined query
        const papers = await academicService.searchPapers(refinedQuery || topic);
        console.log(`Found ${papers.length} papers`); // Debug log

        res.json({
            papers,
            originalQuery: topic,
            refinedQuery: refinedQuery || topic
        });
    } catch (error) {
        console.error('Error in literature search:', error);
        const formattedError = formatError(error, 'We encountered a problem searching for literature. Please try a different search term.');
        res.status(formattedError.statusCode).json(formattedError);
        // res.status(500).json({
        //     error: 'Internal server error',
        //     message: error.message,
        //     details: error.stack // Only for development
        // });
    }
});

// Paper Summarizer
router.post('/summarize-pdf', async (req, res) => {
    console.log('Received request to /summarize-pdf');
    console.log("filepath", req.file.path)
    try {
        if (!req.file) {
            throw {
                statusCode: 400,
                type: 'INVALID_INPUT',
                message: 'No file uploaded',
                userMessage: 'Please upload a PDF file to summarize'
            };
        }
        const filePath = req.file.path;
        const text = await extractTextFromPDF(filePath);
        const summary = await summarizeSections(text);
        fs.unlinkSync(filePath);
        res.json(summary);
    } catch (err) {
        // console.error(err);
        // res.status(500).json({ error: 'Failed to summarize PDF' });
        const formattedError = formatError(error, ERROR_MESSAGES.PDF_EXTRACTION);

        // Clean up temp file if it exists
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(formattedError.statusCode).json(formattedError);
    }
});

// URL Summarization (matches old endpoint)
router.post('/summarize-url', async (req, res) => {
    console.log('Received request to /summarize-url');
    console.log('Request body:', req.body);

    try {
        const { url } = req.body;

        if (!url) {
            throw {
                statusCode: 400,
                type: 'INVALID_INPUT',
                message: 'URL is required',
                userMessage: 'Please provide a valid URL to summarize'
            };
        }

        // Direct PDF handling
        if (url.toLowerCase().endsWith('.pdf')) {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            const tempPath = path.join(__dirname, '../temp', `${Date.now()}.pdf`);
            fs.writeFileSync(tempPath, response.data);

            const text = await extractTextFromPDF(tempPath);
            fs.unlinkSync(tempPath);

            const summary = await summarizeSections(text);
            return res.json(summary);
        }

        // HTML content handling
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const cheerio = require('cheerio');
        const $ = cheerio.load(response.data);
        $('script, style, nav, footer').remove();

        let text = '';
        $('body').find('p, article, section, div').each((i, elem) => {
            text += $(elem).text() + '\n';
        });

        if (!text.trim()) {
            throw new Error('No readable content found on page');
        }

        const summary = await summarizeSections(text);
        res.json(summary);
    } catch (error) {
        const formattedError = formatError(error, ERROR_MESSAGES.SUMMARIZATION);
        res.status(formattedError.statusCode).json(formattedError);
    }
});

async function extractTextFromPDF(filePath) {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdf = await getDocument({ data }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str).join(' ');
        text += strings + '\n';
    }
    return text;
}

function splitTextIntoChunks(text, chunkSize = 55000) {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
}

const GEMINI_API_KEY = "AIzaSyAULoCw_VX9xKlhhakon0Fm19JpkDMnis0";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function summarizeSections(text) {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const chunks = splitTextIntoChunks(text, 55000);
    let partialSummaries = [];

    for (const chunk of chunks) {
        const prompt = `Summarize this document section in academic research paper style:
  
  ${chunk}
  
  Return a concise summary only.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text();
        partialSummaries.push(content);
    }

    console.log('contentHereeeeeeeeeeeeee', partialSummaries)

    const finalPrompt = `Based on these summarized parts, generate a final structured research in detail with not more than 50000 words covering all the important details with sections:
  
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
  
  ${partialSummaries.join("\n\n")}
  `;

    console.log('Final Prompt:', finalPrompt);

    const finalResult = await model.generateContent(finalPrompt);
    console.log('finalResult:', finalResult);

    const finalResponse = await finalResult.response;
    console.log('finalResponse:', finalResponse);

    const finalContent = finalResponse.text();
    console.log('finalContent:', finalContent);

    const cleanedContent = finalContent.replace(/^```html\s*/, '').replace(/```$/, '');

    console.log('cleanedContent:', cleanedContent);


    return cleanedContent;
}

// Citation Generator
router.post('/citations/generate', async (req, res) => {
    try {
        const { paperId, style } = req.body;
        const citationData = await academicService.generateCitation(paperId, style || 'apa');
        res.json(citationData);
    } catch (error) {
        console.error('Error generating citation:', error);
        res.status(500).json({ error: error.message });
    }
});

// Topic Refinement
router.post('/topics/refine', async (req, res) => {
    try {
        const { researchProblem } = req.body;

        // Enhanced prompt to get more detailed results
        const prompt = `You are an expert research advisor. Analyze this research topic in depth:
1. 10 potential research gaps (clearly identified gaps in current research)
2. 15 possible hypotheses (testable statements that could address the gaps)
3. 8 suggested narrowed topics (specific, researchable topics)

Topic: ${researchProblem}

Respond in JSON format like:
{
    "researchGaps": [],
    "hypotheses": [],
    "narrowedTopics": []
}`;

        const response = await togetherService.analyzeWithPrompt(prompt);
        res.json(response);
    } catch (error) {
        console.error('Error refining topic:', error);
        res.status(500).json({ error: error.message });
    }
});

// Plagiarism Check
router.post('/plagiarism/check', async (req, res) => {
    try {
        const { text } = req.body;

        // Check for plagiarism
        const plagiarismData = await serpService.checkPlagiarism(text);

        // Get paraphrasing suggestions for plagiarized sentences
        const plagiarizedSentences = plagiarismData.plagiarismResults
            .filter(r => r.isPlagiarized)
            .map(r => r.text);

        const paraphrasedResults = await togetherService.paraphraseSentences(plagiarizedSentences);

        // Map paraphrased results back to original data
        plagiarismData.paraphrasedResults = paraphrasedResults;

        res.json(plagiarismData);
    } catch (error) {
        console.error('Error checking plagiarism:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/drafts/generate', async (req, res) => {
    try {
        const {
            title,
            objective,
            summaries = [],
            citations = [],
            refinementData = {},
            sections = [],
            citationStyle = 'apa',
            wordCount = 2000,
            tone = 'academic',
            includeGapAnalysis = false
        } = req.body;

        // Validate input
        if (!title && !objective) {
            return res.status(400).json({
                error: 'Either title or research objective is required'
            });
        }

        const researchTopic = refinementData.topic || objective || title;
        const totalWords = parseInt(wordCount) || 2000;
        const draft = {};

        // Helper function to generate section
        const generateSection = async (section, generator, params) => {
            if (sections.includes(section)) {
                try {
                    draft[section] = await generator(params);
                } catch (error) {
                    console.error(`Error generating ${section}:`, error);
                    draft[section] = `Could not generate ${section} section.`;
                }
            }
        };

        // Generate each section
        await generateSection('abstract', generateAbstract, {
            title: title || 'Research Paper',
            researchTopic,
            paperSummaries: summaries,
            keywordsList: refinementData.keywords || [],
            targetWordCount: Math.floor(totalWords * 0.05),
            tone
        });

        await generateSection('introduction', generateIntroduction, {
            researchTopic,
            refinedResearchQuestion: objective || `Exploring ${title}`,
            gapSummary: includeGapAnalysis ? (refinementData.researchGaps || []) : [],
            citationList: citations,
            targetWordCount: Math.floor(totalWords * 0.15),
            citationStyle,
            tone
        });

        await generateSection('literature-review', generateLiteratureReview, {
            researchTopic,
            paperSummaries: summaries,
            citationStyle,
            targetWordCount: Math.floor(totalWords * 0.3),
            tone
        });

        await generateSection('methodology', generateMethodology, {
            researchTopic,
            discipline: refinementData.discipline || 'General',
            targetWordCount: Math.floor(totalWords * 0.2),
            tone
        });

        await generateSection('findings', generateFindings, {
            researchTopic,
            keyFindingsList: summaries.map(s => s.keyFindings || s.content),
            targetWordCount: Math.floor(totalWords * 0.2),
            tone
        });

        await generateSection('conclusion', generateConclusion, {
            draftTitle: title || 'Research Paper',
            researchTopic,
            gapSummary: includeGapAnalysis ? (refinementData.researchGaps || []) : [],
            targetWordCount: Math.floor(totalWords * 0.1),
            tone
        });

        // Generate references if citations exist
        if (citations.length > 0) {
            draft.references = await generateReferences({
                citations,
                style: citationStyle,
                tone
            });
        }
        else {
            // Use a default citation if none are provided
            const defaultCitation = [{
                title: 'Foundations of Research',
                author: 'Smith, John',
                year: '2020',
                journal: 'Journal of Research Methodologies',
                publisher: 'Academic Press',
            }];

            draft.references = await generateReferences({
                citations: defaultCitation,
                style: citationStyle,
                tone
            });
        }

        res.json(draft);
    } catch (error) {
        console.error('Error generating draft:', error);
        res.status(500).json({
            error: 'Failed to generate draft',
            details: error.message
        });
    }
});

async function generateReferences(params) {
    console.log('Generating references with params:', params);
    const { citations, style = 'apa', tone = 'academic' } = params;

    const prompt = `Generate a properly formatted References section in ${style} citation style. 
Include all these citations, formatted correctly:

${JSON.stringify(citations)}

Return only the references list, with each entry on a new line. 
Use ${tone} academic style and ensure proper formatting for ${style} style.`;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating references:', error);
        return 'References could not be generated automatically. Please add them manually.';
    }
}

router.post('/generate-references', async (req, res) => {
    try {
        const { citations, style } = req.body;

        // Generate formatted references
        const references = citations.map(citation => {
            return formatCitation(citation, style);
        }).join('\n\n');

        res.json(references);
    } catch (error) {
        console.error('Error generating references:', error);
        res.status(500).json({ error: error.message });
    }
});

// async function analyzeWithPrompt(prompt) {
//     try {
//         const response = await this.client.post('/chat/completions', {
//             model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
//             messages: [
//                 { role: 'user', content: prompt }
//             ],
//             temperature: 0.7,
//             max_tokens: 1500
//         });

//         const content = response.data.choices[0].message.content;

//         try {
//             return JSON.parse(content);
//         } catch (e) {
//             console.error('Error parsing JSON response:', e);
//             return this.parseTextResponse(content);
//         }
//     } catch (error) {
//         console.error('TogetherAI API error:', error);
//         throw error;
//     }
// }

function formatCitation(citation, style) {
    // Implement your citation formatting logic here
    // This is a simplified example - you'll want to use a proper citation formatting library

    if (style === 'apa') {
        return `${citation.authors} (${citation.year}). ${citation.title}. ${citation.journal || citation.publisher}.`;
    } else if (style === 'mla') {
        return `${citation.authors}. "${citation.title}." ${citation.journal || citation.publisher}, ${citation.year}.`;
    } else if (style === 'ieee') {
        return `[${citation.id}] ${citation.authors}, "${citation.title}," ${citation.journal || citation.publisher}, ${citation.year}.`;
    } else {
        // Default to APA
        return `${citation.authors} (${citation.year}). ${citation.title}. ${citation.journal || citation.publisher}.`;
    }
}

// Updated section generation functions that use Gemini directly
async function generateAbstract(params) {
    const { title, researchTopic, paperSummaries, keywordsList, targetWordCount, tone } = params;

    const prompt = `Write an academic abstract of approximately ${targetWordCount} words for a research paper titled "${title}". 
The research focuses on "${researchTopic}". Based on the following summaries of research papers and keywords identified, 
write a concise overview covering the objective, methodology, key findings, and contribution of this research:

Summarized Research Content: ${JSON.stringify(paperSummaries)}

Research Keywords: ${keywordsList.join(', ')}

Tone: ${tone}. Output format: One paragraph.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

async function generateIntroduction(params) {
    const { researchTopic, refinedResearchQuestion, gapSummary, citationList, targetWordCount, citationStyle, tone } = params;

    const prompt = `Write the Introduction section (${targetWordCount} words) for a research paper on the topic: "${researchTopic}". 
Begin by introducing the broad area of research, then narrow down to the specific research problem. 
Use the following refined research question and AI-identified research gaps to frame the relevance of this study:

Refined Research Question: ${refinedResearchQuestion}

Identified Gaps in Literature: ${gapSummary.join('; ')}

Also include 2-3 citations from the related literature: ${JSON.stringify(citationList.slice(0, 3))}

Preferred Citation Style: ${citationStyle}.
Tone: ${tone}. 
Word Count: Approximately ${targetWordCount}.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

async function generateLiteratureReview(params) {
    const { researchTopic, paperSummaries, citationStyle, targetWordCount, tone } = params;

    const prompt = `Write a Literature Review section (${targetWordCount} words) summarizing and synthesizing key findings from research papers related to the topic "${researchTopic}". 
Each summary includes the main contribution and methodology of the paper. Group the insights thematically where possible and critically compare findings. 
Mention any patterns, contradictions, or areas of consensus.

Research Paper Summaries: ${JSON.stringify(paperSummaries)}

Preferred Citation Style: ${citationStyle}. 
Output format: Structured paragraphs with embedded citations. 
Tone: ${tone}.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

async function generateMethodology(params) {
    const { researchTopic, discipline, targetWordCount, tone } = params;

    const prompt = `Write the Methodology section (${targetWordCount} words) for a research study on the topic: "${researchTopic}". 
Propose a suitable research design (qualitative, quantitative, or mixed methods) along with details like data sources, sampling techniques, tools of data collection, and analysis methods. 
Use the following context and discipline reference: ${discipline}.

Mention limitations if applicable. 
Tone: ${tone}. 
Output format: Paragraphs with subheadings (if needed).`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

async function generateFindings(params) {
    const { researchTopic, keyFindingsList, targetWordCount, tone } = params;

    const prompt = `Write the Findings section (${targetWordCount} words) based on the following extracted findings from previously reviewed research papers. 
Summarize them thematically or in a comparative format. Do not fabricate new data. 
Instead, synthesize the findings to support the research direction on "${researchTopic}".

Key Findings from Research Papers: ${keyFindingsList.join('\n\n')}

Use clear language and structured reporting. 
Tone: ${tone}.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

async function generateConclusion(params) {
    const { draftTitle, researchTopic, gapSummary, targetWordCount, tone } = params;

    const prompt = `Write the Conclusion section (${targetWordCount} words) for a research paper titled "${draftTitle}" on the topic "${researchTopic}". 
Summarize the purpose of the study, key insights from literature, and proposed methodology. 
Then, discuss the expected or theoretical contributions and potential areas for future research (based on the identified gaps below).

Identified Research Gaps: ${gapSummary.join('; ')}

Tone: ${tone}. 
Output format: 2-3 structured paragraphs.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

router.post('/drafts/save', async (req, res) => {
    try {
        const { content } = req.body;

        // In a real app, you would save this to a database
        // For now, we'll just store it in memory/local storage
        const drafts = JSON.parse(localStorage.getItem('savedDrafts') || []);
        drafts.push({
            id: Date.now().toString(),
            content,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('savedDrafts', JSON.stringify(drafts));

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving draft:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/export/docx', async (req, res) => {
    try {
        const { title, sections, style } = req.body;
        const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');

        // Create document with proper styles
        const doc = new Document({
            styles: {
                paragraphStyles: [{
                    id: "Normal",
                    name: "Normal",
                    run: {
                        size: 24, // 12pt (24 half-points)
                        font: "Times New Roman"
                    },
                    paragraph: {
                        spacing: { line: 276 }, // 1.15 line spacing
                        alignment: AlignmentType.JUSTIFIED
                    }
                }],
            },
            sections: [{
                properties: {},
                children: [
                    // Title page
                    new Paragraph({
                        text: title,
                        heading: HeadingLevel.TITLE,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 300 }
                    }),
                    // Author info (you can add this if available)
                    // new Paragraph({
                    //     text: "Author Name",
                    //     alignment: AlignmentType.CENTER,
                    //     spacing: { after: 400 }
                    // }),
                    // Add all sections
                    ...sections.flatMap(section => [
                        new Paragraph({
                            text: section.title,
                            heading: section.title === 'Abstract' ? HeadingLevel.HEADING_1 :
                                section.title === 'References' ? HeadingLevel.HEADING_2 :
                                    HeadingLevel.HEADING_2,
                            spacing: { before: 400, after: 200 }
                        }),
                        ...section.content
                            .replace(/<[^>]+>/g, '\n') // Remove HTML tags
                            .split('\n')
                            .filter(line => line.trim())
                            .map(line => new Paragraph({
                                children: [new TextRun(line.trim())],
                                spacing: { after: 100 }
                            }))
                    ]),
                    // Ensure References section is properly formatted
                    ...(sections.some(s => s.title === 'References') ? [] : [
                        new Paragraph({
                            text: "References",
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 400, after: 200 }
                        }),
                        new Paragraph({
                            text: "References will be automatically generated here",
                            spacing: { after: 100 }
                        })
                    ])
                ]
            }]
        });

        const buffer = await Packer.toBuffer(doc);

        res.setHeader('Content-Disposition', `attachment; filename=${title}.docx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.send(buffer);
    } catch (error) {
        console.error('Error generating DOCX:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/export/pdf', async (req, res) => {
    try {
        const { title, sections, style } = req.body;
        const PDFDocument = require('pdfkit');
        const fs = require('fs');
        const path = require('path');

        // Create a document
        const doc = new PDFDocument({
            margins: {
                top: 72,
                bottom: 72,
                left: 72,
                right: 72
            },
            size: 'A4'
        });

        // Set up buffers
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            res.setHeader('Content-Disposition', `attachment; filename=${title}.pdf`);
            res.setHeader('Content-Type', 'application/pdf');
            res.send(pdfData);
        });

        // Set font styles
        const titleFont = 'Helvetica-Bold';
        const headingFont = 'Helvetica-Bold';
        const bodyFont = 'Helvetica';
        const fontSize = 12;
        const lineHeight = 1.15;

        // Add title page
        doc.font(titleFont)
            .fontSize(20)
            .text(title, {
                align: 'center',
                underline: false,
                lineGap: 10
            })
            .moveDown(2);

        // doc.font(bodyFont)
        //     .fontSize(14)
        //     .text('Author Name', { align: 'center' })
        //     .addPage(); // Start content on new page

        // Add table of contents
        doc.font(headingFont)
            .fontSize(16)
            .text('Table of Contents', { underline: true })
            .moveDown(0.5);

        sections.forEach((section, index) => {
            doc.font(bodyFont)
                .fontSize(fontSize)
                .text(section.title, {
                    continued: true,
                    indent: 20
                })
                .text(`.............${index + 1}`, {
                    align: 'right'
                });
        });

        doc.addPage(); // Start content on new page

        // Add all sections
        sections.forEach(section => {
            // Section heading
            doc.font(headingFont)
                .fontSize(16)
                .text(section.title, { paragraphGap: 10 })
                .moveDown(0.5);

            // Section content
            doc.font(bodyFont)
                .fontSize(fontSize)
                .text(section.content, {
                    align: 'justify',
                    lineGap: 5,
                    paragraphGap: 10,
                    indent: 20,
                    lineBreak: true,
                    columns: 1
                })
                .moveDown(1);

            // Add page break if not last section
            if (section !== sections[sections.length - 1]) {
                doc.addPage();
            }
        });

        // Ensure References section exists
        if (!sections.some(s => s.title === 'References')) {
            doc.addPage()
                .font(headingFont)
                .fontSize(16)
                .text('References', { paragraphGap: 10 })
                .moveDown(0.5)
                .font(bodyFont)
                .fontSize(fontSize)
                .text('References will be automatically generated here', {
                    align: 'left',
                    lineGap: 5
                });
        }

        // Finalize the PDF
        doc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/export/latex', async (req, res) => {
    try {
        const { title, sections, style, author } = req.body;

        // Basic LaTeX document structure
        let latexContent = `\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}
\\usepackage{setspace}
\\onehalfspacing
\\usepackage{graphicx}
\\usepackage[style=${style}, backend=biber]{biblatex}
\\addbibresource{references.bib}

\\title{${escapeLaTeX(title)}}
\\date{\\today}

\\begin{document}

\\maketitle

`;

        // Add abstract if exists
        const abstractSection = sections.find(s => s.title.toLowerCase() === 'abstract');
        if (abstractSection) {
            latexContent += `\\begin{abstract}
${escapeLaTeX(abstractSection.content)}
\\end{abstract}

`;
        }

        // Add table of contents
        latexContent += `\\tableofcontents
\\newpage

`;

        // Add all sections
        sections.forEach(section => {
            if (section.title.toLowerCase() !== 'abstract') {
                latexContent += `\\section{${escapeLaTeX(section.title)}}
${escapeLaTeX(section.content)}

`;
            }
        });

        // Add references section
        latexContent += `\\newpage
\\printbibliography

\\end{document}
`;

        // Helper function to escape LaTeX special characters
        function escapeLaTeX(text) {
            return text
                .replace(/\n\n/g, '\n\n')
                .replace(/\n/g, '\\\\\n');
        }

        res.setHeader('Content-Disposition', `attachment; filename=${title}.tex`);
        res.setHeader('Content-Type', 'application/x-tex');
        res.send(latexContent);
    } catch (error) {
        console.error('Error generating LaTeX:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/generate-title', async (req, res) => {
    try {
        const { text } = req.body;
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `Generate a concise, academic research paper title based on this text: "${text}". 
        The title should be 8-12 words long, clearly indicate the research focus, and follow academic conventions. 
        Return only the title, no additional commentary.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        res.json({ title: response.text().trim() });
    } catch (error) {
        console.error('Error generating title:', error);
        res.status(500).json({ error: error.message });
    }
});

// Helper functions for generating each section
async function generateAbstract(params) {
    try {
        const { title = 'Research Paper', researchTopic, userContent, paperSummaries = [], keywordsList = [], targetWordCount = 200, tone = 'academic' } = params;

        // Validate minimum required parameters
        if (!researchTopic) {
            throw new Error('Research topic is required for abstract generation');
        }

        const prompt = `Compose a concise academic abstract of approximately ${targetWordCount} words for a research paper titled "${title}" and it should be based on and enhance the user-provided draft: "${userContent}" about "${researchTopic}". 

        Key elements to include:
        - Clear statement of the research problem
        - Brief description of methodology
        - Summary of key findings or expected outcomes
        - Significance of the research

        ${keywordsList.length > 0 ? `Incorporate these keywords naturally: ${keywordsList.join(', ')}` : ''}
        ${paperSummaries.length > 0 ? `Build upon these existing research insights: ${JSON.stringify(paperSummaries)}` : ''}

        Write in a ${tone} scholarly style. Provide only the abstract text itself, without any section headers or meta-commentary.`;

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up the response
        return text.replace(/^\s*Abstract:\s*/i, '') // Remove any accidental "Abstract:" prefix
            .trim();

    } catch (error) {
        console.error('Error in generateAbstract:', error);
        return `Abstract could not be generated. ${error.message}`;
    }
}

async function generateIntroduction(params) {
    const { researchTopic, refinedResearchQuestion, gapSummary, citationList, targetWordCount, citationStyle, tone } = params;

    const prompt = `Write a ${targetWordCount}-word introduction for a research paper about "${researchTopic}". 

    Specifically address: "${refinedResearchQuestion}"

    Research gaps to highlight: ${gapSummary.join('; ')}

    Include citations in ${citationStyle} style from these works: ${JSON.stringify(citationList.slice(0, 3))}

    Structure:
    1. Broad context of the field
    2. Specific problem being addressed
    3. Research gaps this work fills
    4. Paper's contribution

    Write in a ${tone} academic style. Provide only the introduction text, no analysis or commentary.`;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating introduction:', error);
        return 'Introduction could not be generated.';
    }
}

async function generateLiteratureReview(params) {
    const { researchTopic, paperSummaries, citationStyle, targetWordCount, tone } = params;

    const prompt = `Write a ${targetWordCount}-word literature review about "${researchTopic}".

    Base it on these paper summaries: ${JSON.stringify(paperSummaries)}

    Organize by themes:
    1. Current state of research
    2. Key methodologies used
    3. Major findings
    4. Unresolved questions

    Use ${citationStyle} citations. Write in ${tone} academic style. Provide only the review content, no commentary about writing it.`;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating literature review:', error);
        return 'Literature review could not be generated.';
    }
}

async function generateMethodology(params) {
    const { researchTopic, discipline, targetWordCount, tone } = params;

    const prompt = `Write a ${targetWordCount}-word methodology section for a ${discipline} study about "${researchTopic}".

    Include:
    1. Research design
    2. Data sources
    3. Sampling approach
    4. Data collection methods
    5. Analysis techniques
    6. Limitations

    Write in ${tone} academic style. Provide only the methodology text, no commentary.`;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating methodology:', error);
        return 'Methodology could not be generated.';
    }
}

async function generateFindings(params) {
    const { researchTopic, keyFindingsList, targetWordCount, tone } = params;

    const prompt = `Write a ${targetWordCount}-word findings section about "${researchTopic}".

    Summarize these key findings: ${keyFindingsList.join('\n\n')}

    Organize by:
    1. Most significant results
    2. Supporting evidence
    3. Unexpected findings
    4. Comparison to prior work

    Write in ${tone} academic style. Present only the findings, no commentary.`;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating findings:', error);
        return 'Findings could not be generated.';
    }
}

async function generateConclusion(params) {
    const { draftTitle, researchTopic, gapSummary, targetWordCount, tone } = params;

    const prompt = `Write a ${targetWordCount}-word conclusion for "${draftTitle}" about "${researchTopic}".

    Include:
    1. Summary of key contributions
    2. How this addresses gaps: ${gapSummary.join('; ')}
    3. Implications for the field
    4. Future research directions

    Write in ${tone} academic style. Provide only the conclusion text, no analysis.`;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating conclusion:', error);
        return 'Conclusion could not be generated.';
    }
}

module.exports = router;