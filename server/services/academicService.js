const { openAlex, crossref } = require('../config/apiKeys');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const geminiService = require('./geminiService');

class AcademicService {
    constructor() {
        this.openAlexClient = axios.create({
            baseURL: 'https://api.openalex.org',
            params: {
                'mailto': 'research-assistant@example.com'
            }
        });

        this.crossrefClient = axios.create({
            baseURL: 'https://api.crossref.org'
        });
    }

    async searchPapers(query) {
        try {
            // Search all sources in parallel
            const [openAlexResults, crossrefResults, arxivResults] = await Promise.all([
                this.searchOpenAlex(query),
                this.searchCrossRef(query),
                this.searchArxiv(query)
            ]);

            // Combine and deduplicate results
            const allPapers = [...openAlexResults, ...crossrefResults, ...arxivResults];
            const uniquePapers = this.deduplicatePapers(allPapers);

            // Sort by citation count (descending)
            return uniquePapers
                .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
                .slice(0, 15); // Return top 15 results
        } catch (error) {
            console.error('Academic search error:', error);
            throw error;
        }
    }

    async searchOpenAlex(query) {
        try {
            const response = await this.openAlexClient.get('/works', {
                params: {
                    search: query,
                    per_page: 10,
                    filter: 'has_abstract:true' // Only papers with abstracts
                }
            });

            if (!response.data.results) return [];

            return response.data.results.map(work => ({
                id: work.id.replace('https://openalex.org/', ''),
                title: work.title,
                authors: work.authorships?.map(a => a.author.display_name) || [],
                abstract: this.parseOpenAlexAbstract(work.abstract_inverted_index),
                publication: work.primary_location?.source?.display_name || 'Unknown',
                year: work.publication_year || 'Unknown',
                citationCount: work.cited_by_count || 0,
                url: work.primary_location?.landing_page_url || work.doi ? `https://doi.org/${work.doi}` : null,
                doi: work.doi,
                pdfUrl: work.primary_location?.pdf_url,
                source: 'OpenAlex'
            }));
        } catch (error) {
            console.error('OpenAlex search error:', error.message);
            return [];
        }
    }

    parseOpenAlexAbstract(invertedIndex) {
        if (!invertedIndex) return 'No abstract available';

        const words = [];
        for (const word in invertedIndex) {
            if (invertedIndex.hasOwnProperty(word)) {
                const positions = invertedIndex[word];
                positions.forEach(pos => {
                    words[pos] = word;
                });
            }
        }
        return words.filter(w => w).join(' ');
    }

    async searchCrossRef(query) {
        try {
            const response = await this.crossrefClient.get('/works', {
                params: {
                    query: query,
                    rows: 10,
                    select: 'DOI,title,author,abstract,published,container-title,is-referenced-by-count,URL'
                }
            });

            if (!response.data.message.items) return [];

            return response.data.message.items.map(item => ({
                id: item.DOI || `crossref-${Math.random().toString(36).substring(2, 9)}`,
                title: item.title?.[0] || 'Untitled',
                authors: item.author?.map(a => `${a.given} ${a.family}`) || [],
                abstract: this.cleanAbstract(item.abstract),
                publication: item['container-title']?.[0] || 'Unknown',
                year: item.created?.['date-parts']?.[0]?.[0] || 'Unknown',
                citationCount: item['is-referenced-by-count'] || 0,
                url: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : null),
                doi: item.DOI,
                source: 'CrossRef'
            }));
        } catch (error) {
            console.error('CrossRef search error:', error.message);
            return [];
        }
    }

    cleanAbstract(abstract) {
        if (!abstract) return 'No abstract available';
        // Remove HTML tags and excessive whitespace
        return abstract.replace(/<\/?[^>]+(>|$)/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    async searchArxiv(query) {
        try {
            const response = await axios.get(
                `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=10`
            );

            const parsed = await parseStringPromise(response.data);
            if (!parsed.feed.entry) return [];

            return parsed.feed.entry.map(entry => ({
                id: entry.id[0].split('/').pop() || `arxiv-${Math.random().toString(36).substring(2, 9)}`,
                title: entry.title[0] || 'No title available',
                authors: entry.author?.map(a => a.name[0]).join(', ') || 'No authors available',
                abstract: entry.summary?.[0] || 'No abstract available',
                publication: 'arXiv Preprint',
                year: entry.published?.[0]?.substring(0, 4) || 'Unknown',
                citationCount: 0, // arXiv doesn't provide citation counts
                url: entry.id?.[0] || null,
                pdfUrl: entry.id?.[0] ? `${entry.id[0].replace('abs', 'pdf')}.pdf` : null,
                source: 'arXiv'
            }));
        } catch (error) {
            console.error('arXiv search error:', error.message);
            return [];
        }
    }

    deduplicatePapers(papers) {
        const uniquePapers = [];
        const seenIds = new Set();
        const seenTitles = new Set();

        for (const paper of papers) {
            // Use DOI if available, otherwise generate a key from title and first author
            const idKey = paper.doi || `${paper.title.substring(0, 50)}-${paper.authors[0]?.substring(0, 20) || ''}`.toLowerCase();

            if (!seenIds.has(idKey) && !seenTitles.has(paper.title.toLowerCase())) {
                seenIds.add(idKey);
                seenTitles.add(paper.title.toLowerCase());
                uniquePapers.push(paper);
            }
        }

        return uniquePapers;
    }

    async refineQuery(userQuery) {
        console.log('Refining query:', userQuery);
        try {
            const prompt = `You are an academic assistant. A user entered: "${userQuery}".
Refine it into 5-8 academic keywords or short phrases, separated by commas.
Avoid Boolean logic. Return only keywords.`;

            const result = await geminiService.interpretQuery(prompt);
            return result.keywords.join(', ');
        } catch (error) {
            console.error('Query refinement error:', error);
            return userQuery; // Fallback to original query
        }
    }

    async getPaperMetadata(paperId) {
        try {
            // Try OpenAlex first
            if (paperId.startsWith('W')) {
                const response = await this.openAlexClient.get(`/works/${paperId}`);
                const work = response.data;

                return {
                    title: work.title,
                    authors: work.authorships?.map(a => a.author.display_name) || [],
                    publication: work.primary_location?.source?.display_name || 'Unknown',
                    year: work.publication_year || 'Unknown',
                    doi: work.doi,
                    url: work.primary_location?.landing_page_url || work.doi ? `https://doi.org/${work.doi}` : null
                };
            }

            // Try Crossref for DOIs
            if (paperId.startsWith('10.')) {
                const response = await this.crossrefClient.get(`/works/${paperId}`);
                const item = response.data.message;

                return {
                    title: item.title?.[0] || 'Untitled',
                    authors: item.author?.map(a => `${a.given} ${a.family}`) || [],
                    publication: item['container-title']?.[0] || 'Unknown',
                    year: item.created?.['date-parts']?.[0]?.[0] || 'Unknown',
                    doi: item.DOI,
                    url: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : null)
                };
            }

            // Try arXiv if it's an arXiv ID
            if (paperId.startsWith('arxiv-') || /\d{4}\.\d{4,5}/.test(paperId)) {
                const arxivId = paperId.replace('arxiv-', '');
                const response = await axios.get(`http://export.arxiv.org/api/query?id_list=${arxivId}`);
                const parsed = await parseStringPromise(response.data);

                if (parsed.feed.entry) {
                    const entry = parsed.feed.entry[0];
                    return {
                        title: entry.title[0] || 'No title available',
                        authors: entry.author?.map(a => a.name[0]) || [],
                        publication: 'arXiv Preprint',
                        year: entry.published?.[0]?.substring(0, 4) || 'Unknown',
                        doi: null,
                        url: entry.id?.[0] || null
                    };
                }
            }

            // If we get here, we couldn't identify the paper ID format
            return {
                title: paperId,
                authors: ['Unknown Author'],
                publication: 'Unknown Journal',
                year: new Date().getFullYear(),
                doi: null,
                url: null
            };
        } catch (error) {
            console.error('Paper metadata error:', error.response?.data || error.message);
            throw error;
        }
    }

    async generateCitation(topicOrId, style = 'apa') {
        try {
            // First check if this looks like a paper ID or a topic
            const isPaperId = topicOrId.startsWith('W') || // OpenAlex ID
                topicOrId.startsWith('10.') || // DOI
                topicOrId.startsWith('arxiv-') || // arXiv ID
                /\d{4}\.\d{4,5}/.test(topicOrId); // arXiv ID format

            let metadata;
            if (isPaperId) {
                metadata = await this.getPaperMetadata(topicOrId);
            } else {
                // It's a topic - perform a search and take the top result
                const papers = await this.searchPapers(topicOrId);
                if (papers.length === 0) {
                    throw new Error(`No papers found for "${topicOrId}"`);
                }
                metadata = await this.getPaperMetadata(papers[0].id);
            }

            let citation;
            switch (style.toLowerCase()) {
                case 'apa':
                    citation = this.generateAPACitation(metadata);
                    break;
                case 'mla':
                    citation = this.generateMLACitation(metadata);
                    break;
                case 'ieee':
                    citation = this.generateIEEECitation(metadata);
                    break;
                case 'harvard':
                    citation = this.generateHarvardCitation(metadata);
                    break;
                default:
                    citation = this.generateAPACitation(metadata);
            }

            const bibtex = this.generateBibtex(metadata);

            return {
                citation,
                bibtex,
                paperTitle: metadata.title, // Return additional info for display
                paperAuthors: metadata.authors,
                paperYear: metadata.year
            };
        } catch (error) {
            console.error('Citation generation error:', error);
            throw error;
        }
    }
    async fetchPaperContent(url) {
        try {
            // Check if it's a PDF URL
            if (url.toLowerCase().endsWith('.pdf')) {
                const response = await axios.get(url, {
                    responseType: 'arraybuffer',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });

                // Save to temporary file
                const tempPath = path.join(__dirname, '../temp', `${Date.now()}.pdf`);
                fs.writeFileSync(tempPath, response.data);

                // Extract text
                const text = await extractTextFromPDF(tempPath);
                fs.unlinkSync(tempPath);
                return text;
            }

            // Try to fetch HTML content
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            // Extract text from HTML
            const cheerio = require('cheerio');
            const $ = cheerio.load(response.data);

            // Remove unwanted elements
            $('script, style, nav, footer').remove();

            // Get text from main content areas
            let text = '';
            $('body').find('p, article, section, div').each((i, elem) => {
                text += $(elem).text() + '\n';
            });

            return text.trim() || null;
        } catch (error) {
            console.error('Error fetching paper content:', error.message);
            return null;
        }
    }

    generateAPACitation(metadata) {
        const authors = metadata.authors.length > 1 ?
            `${metadata.authors[0]} et al.` :
            metadata.authors[0] || 'Anonymous';

        return `${authors} (${metadata.year}). ${metadata.title}. ${metadata.publication}${metadata.doi ? `, ${metadata.doi}` : ''}.`;
    }

    generateMLACitation(metadata) {
        const authors = metadata.authors.length > 1 ?
            `${metadata.authors[0]}, et al.` :
            metadata.authors[0] || 'Anonymous';

        return `${authors}. "${metadata.title}." ${metadata.publication}, ${metadata.year}${metadata.doi ? `, doi:${metadata.doi}` : ''}.`;
    }

    generateIEEECitation(metadata) {
        const authors = metadata.authors.join(', ');
        return `[1] ${authors}, "${metadata.title}," ${metadata.publication}, ${metadata.year}.`;
    }

    generateHarvardCitation(metadata) {
        const authors = metadata.authors.length > 1 ?
            `${metadata.authors[0]} et al.` :
            metadata.authors[0] || 'Anonymous';

        return `${authors} (${metadata.year}) '${metadata.title}', ${metadata.publication}${metadata.doi ? `, doi:${metadata.doi}` : ''}.`;
    }

    generateBibtex(metadata) {
        const id = metadata.doi ? metadata.doi.replace(/[^a-zA-Z0-9]/g, '_') : `paper_${Math.random().toString(36).substring(2, 8)}`;

        return `@article{${id},
  author = {${metadata.authors.join(' and ')}},
  title = {${metadata.title}},
  journal = {${metadata.publication}},
  year = {${metadata.year}},
  ${metadata.doi ? `doi = {${metadata.doi}},` : ''}
  url = {${metadata.url || ''}}
}`;
    }
}

module.exports = new AcademicService();