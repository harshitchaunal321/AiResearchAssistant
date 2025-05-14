const { togetherAI } = require('../config/apiKeys');
const axios = require('axios');

class TogetherService {
    constructor() {
        this.client = axios.create({
            baseURL: 'https://api.together.xyz/v1',
            headers: {
                'Authorization': `Bearer ${togetherAI}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async analyzeTopic(topic) {
        try {
            // const prompt = `Analyze this research topic for:
            // 1. 3 narrowed topic suggestions
            // 2. 3 potential research gaps
            // 3. 5 relevant keywords
            // 4. 2 possible hypotheses

            // Topic: ${topic}

            // Respond in JSON format like:
            // {
            //     "narrowedTopics": [],
            //     "researchGaps": [],
            //     "keywords": [],
            //     "hypotheses": []
            // }`;
            const prompt = `You are an expert research advisor. Analyze this research topic in depth:
            1. 5 narrowed topic suggestions
            2. 5 potential research gaps
            3. 5 relevant keywords
            4. 10-15 possible hypotheses
            
            Topic: ${topic}
            
            Respond in JSON format like:
            {
                "narrowedTopics": [],
                "researchGaps": [],
                "keywords": [],
                "hypotheses": []
            }`;


            const response = await this.client.post('/chat/completions', {
                model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1000
            });

            try {
                // Try to parse the JSON response
                const content = response.data.choices[0].message.content;
                return JSON.parse(content);
            } catch (e) {
                // Fallback if JSON parsing fails
                return this.parseTextResponse(response.data.choices[0].message.content);
            }
        } catch (error) {
            console.error('TogetherAI API error:', error.response?.data || error.message);
            throw error;
        }
    }

    parseTextResponse(text) {
        // Fallback parsing if JSON response fails
        const result = {
            narrowedTopics: [],
            researchGaps: [],
            keywords: [],
            hypotheses: []
        };

        const sections = text.split('\n\n');
        sections.forEach(section => {
            if (section.includes('narrowed topic')) {
                result.narrowedTopics = section.split('\n')
                    .filter(line => line.match(/^\d+\./))
                    .map(line => line.replace(/^\d+\.\s*/, ''));
            } else if (section.includes('research gap')) {
                result.researchGaps = section.split('\n')
                    .filter(line => line.match(/^\d+\./))
                    .map(line => line.replace(/^\d+\.\s*/, ''));
            } else if (section.includes('keyword')) {
                result.keywords = section.split('\n')
                    .filter(line => line.match(/^\d+\./))
                    .map(line => line.replace(/^\d+\.\s*/, ''));
            } else if (section.includes('hypothes')) {
                result.hypotheses = section.split('\n')
                    .filter(line => line.match(/^\d+\./))
                    .map(line => line.replace(/^\d+\.\s*/, ''));
            }
        });

        return result;
    }

    async paraphraseText(text) {
        try {
            const response = await this.client.post('/chat/completions', {
                model: 'meta-llama/Llama-3-8b-chat-hf',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert paraphraser. Paraphrase the text without changing its meaning, maintaining academic tone and preserving all key information.'
                    },
                    {
                        role: 'user',
                        content: `Paraphrase the following text without changing its meaning:\n\n${text}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            });

            const result = response.data;

            try {
                return result.choices[0].message.content.trim();
            } catch (error) {
                console.error('Error parsing paraphrase response:', error);
                return 'Paraphrasing not available.';
            }
        } catch (error) {
            console.error('TogetherAI API error:', error.response?.data || error.message);
            return 'Paraphrasing not available.';
        }
    }

    async paraphraseSentences(sentences) {
        try {
            const paraphrasedResults = [];

            for (const sentence of sentences) {
                if (sentence.length < 10) {
                    paraphrasedResults.push({
                        original: sentence,
                        paraphrased: sentence, // Skip very short sentences
                        isParaphrased: false
                    });
                    continue;
                }

                const paraphrased = await this.paraphraseText(sentence);

                paraphrasedResults.push({
                    original: sentence,
                    paraphrased,
                    isParaphrased: paraphrased !== sentence
                });
            }

            return paraphrasedResults;
        } catch (error) {
            console.error('Error paraphrasing sentences:', error);
            return sentences.map(sentence => ({
                original: sentence,
                paraphrased: sentence,
                isParaphrased: false
            }));
        }
    }
}

module.exports = new TogetherService();