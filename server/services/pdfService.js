// PDF Service with text extraction capabilities
const fs = require('fs');
const mammoth = require('mammoth');
const path = require('path');
const axios = require('axios');

class PdfService {
    async extractTextFromPDF(filePath) {
        try {
            console.log(`Starting PDF extraction from: ${filePath}`);

            // Check if file exists
            if (!fs.existsSync(filePath)) {
                throw new Error(`File does not exist at path: ${filePath}`);
            }

            // Get file stats
            const stats = fs.statSync(filePath);
            console.log(`File size: ${stats.size} bytes`);

            if (stats.size === 0) {
                throw new Error('File is empty (0 bytes)');
            }

            // Use dynamic import for pdfjs-dist
            const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');

            const data = new Uint8Array(fs.readFileSync(filePath));
            console.log(`Loaded file into buffer, size: ${data.length} bytes`);

            const pdf = await getDocument({ data }).promise;
            console.log(`PDF loaded successfully. Number of pages: ${pdf.numPages}`);

            let text = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                console.log(`Processing page ${i}/${pdf.numPages}`);
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const strings = content.items.map(item => item.str).join(' ');
                text += strings + '\n';
            }

            console.log(`Extracted ${text.length} characters of text`);
            return text;
        } catch (error) {
            console.error('Error in extractTextFromPDF:', error);
            throw new Error(`PDF extraction failed: ${error.message}`);
        }
    }

    async extractTextFromDOCX(filePath) {
        try {
            console.log('Extracting text from DOCX:', filePath);
            const result = await mammoth.extractRawText({ path: filePath });
            console.log('DOCX extraction result:', result);
            return result.value;
        } catch (error) {
            console.error('Error in extractTextFromDOCX:', error);
            throw new Error(`DOCX extraction failed: ${error.message}`);
        }
    }

    async downloadFile(url, outputPath) {
        try {
            console.log(`Downloading file from URL: ${url}`);
            const response = await axios.get(url, {
                responseType: 'arraybuffer'
            });
            console.log(`Downloaded ${response.data.byteLength} bytes`);

            // Ensure directory exists
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });

            // Write file
            fs.writeFileSync(outputPath, Buffer.from(response.data));
            console.log(`File saved to: ${outputPath}`);

            return outputPath;
        } catch (error) {
            console.error('Error downloading file:', error);
            throw new Error(`File download failed: ${error.message}`);
        }
    }

    cleanText(text) {
        if (!text) return '';

        // Remove excessive whitespace and line breaks
        text = text.replace(/\s+/g, ' ').trim();

        // Remove common PDF artifacts
        text = text.replace(/-\n/g, ''); // Hyphenated words
        text = text.replace(/ﬁ/g, 'fi'); // Ligatures
        text = text.replace(/ﬂ/g, 'fl');

        return text;
    }
}

module.exports = new PdfService();