// Update server/services/serpService.js
const { serpAPI } = require('../config/apiKeys');
const axios = require('axios');
const { ratio } = require('fuzzball'); // Using fuzzball instead of fast-fuzzy

class SerpService {
    constructor() {
        this.client = axios.create({
            baseURL: 'https://serpapi.com',
            params: {
                api_key: serpAPI,
                engine: 'google'
            }
        });
    }

    async checkPlagiarism(text) {
        try {
            const sentences = text.split('.').map(s => s.trim()).filter(s => s.length >= 10);
            const plagiarismResults = [];
            let plagiarizedCount = 0;

            // Check each sentence for plagiarism
            for (const sentence of sentences) {
                const params = {
                    q: sentence,
                    num: 3
                };

                const response = await this.client.get('/search.json', { params });
                const data = response.data;

                let isPlagiarized = false;
                let sourceUrl = null;

                if (data.organic_results) {
                    for (const result of data.organic_results) {
                        const snippet = result.snippet || '';
                        // Using ratio from fuzzball instead of partialRatio
                        const similarity = ratio(sentence.toLowerCase(), snippet.toLowerCase());

                        if (similarity > 70) {
                            isPlagiarized = true;
                            sourceUrl = result.link;
                            break;
                        }
                    }
                }

                if (isPlagiarized) {
                    plagiarizedCount++;
                }

                plagiarismResults.push({
                    text: sentence,
                    isPlagiarized,
                    source: sourceUrl
                });
            }

            // Calculate originality score
            const originalityScore = parseFloat((100 * (1 - (plagiarizedCount / Math.max(1, plagiarismResults.length)))).toFixed(2));

            // Generate highlighted text
            const highlightedText = this.generateHighlightedText(text, plagiarismResults);

            return {
                plagiarismResults,
                originalityScore,
                highlightedText
            };
        } catch (error) {
            console.error('Plagiarism check error:', error.response?.data || error.message);
            throw error;
        }
    }

    generateHighlightedText(originalText, plagiarismResults) {
        let highlightedText = originalText;

        // Highlight plagiarized sentences
        plagiarismResults.forEach(result => {
            if (result.isPlagiarized) {
                highlightedText = highlightedText.replace(
                    result.text,
                    `<span class="highlighted-text" data-source="${result.source || ''}">${result.text}</span>`
                );
            }
        });

        return highlightedText;
    }
}

module.exports = new SerpService();