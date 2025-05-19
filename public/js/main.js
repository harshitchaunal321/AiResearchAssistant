// Error Messages
const ERROR_MESSAGES = {
    NETWORK: "Network error occurred. Please check your internet connection and try again.",
    SERVER: "Our servers are experiencing issues. Please try again later.",
    TIMEOUT: "Request timed out. Please try again.",
    DEFAULT: "An unexpected error occurred. Please try again.",
    INVALID_INPUT: "Please check your input and try again.",
    PDF: "Couldn't process the PDF. Please ensure it's a valid research paper.",
    SUMMARIZATION: "Couldn't summarize this content. Please try with different content.",
    CITATION: "Couldn't generate citation. Please check the paper details.",
    SEARCH: "Couldn't search for papers. Please try different keywords.",
    REFINEMENT: "Couldn't refine your topic. Please try a different description.",
    PLAGIARISM: "Couldn't check for plagiarism. Please try again.",
    DRAFT: "Couldn't generate draft. Please check your inputs.",
    EXPORT: "Couldn't generate export file. Please try again.",
    FILE_UPLOAD: "File upload failed. Please try a different file.",
    API_LIMIT: "Too many requests. Please wait a moment and try again."
};
document.addEventListener('DOMContentLoaded', function () {
    // Tab switching functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');

            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Literature Search
    document.getElementById('search-btn').addEventListener('click', searchLiterature);

    // Paper Summarizer
    document.getElementById('summarize-btn').addEventListener('click', summarizePaper);

    // Citation Generator
    document.getElementById('generate-citation-btn').addEventListener('click', generateCitation);

    // Topic Refinement
    document.getElementById('refine-topic-btn').addEventListener('click', refineTopic);

    // Plagiarism Check
    document.getElementById('check-plagiarism-btn').addEventListener('click', checkPlagiarism);

    document.getElementById('start-draft-btn').addEventListener('click', startDraftGeneration);
    document.getElementById('generate-draft-btn').addEventListener('click', generateDraft);
    document.getElementById('word-count').addEventListener('change', toggleCustomWordCount);
    document.getElementById('export-docx').addEventListener('click', exportAsDocx);
    document.getElementById('export-pdf').addEventListener('click', exportAsPdf);
    document.getElementById('export-latex').addEventListener('click', exportAsLatex);
    document.getElementById('save-draft').addEventListener('click', saveDraft);
    document.addEventListener('DOMContentLoaded', function () {
        const uploadBox = document.getElementById('upload-box');
        const dropText = document.getElementById('drop-text');
        const fileInput = document.getElementById('paper-upload');
        const fileInfo = document.getElementById('file-info');
        const fileName = document.getElementById('file-name');
        const removeFileBtn = document.getElementById('remove-file');
        const summarizeBtn = document.getElementById('summarize-btn');

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadBox.addEventListener(eventName, preventDefaults, false);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadBox.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadBox.addEventListener(eventName, unhighlight, false);
        });

        // Handle dropped files
        uploadBox.addEventListener('drop', handleDrop, false);

        // Handle file selection via browse
        fileInput.addEventListener('change', handleFileSelect);

        // Remove file button
        removeFileBtn.addEventListener('click', clearFileSelection);

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        function highlight() {
            uploadBox.classList.add('drag-over');
            dropText.textContent = 'Drop your PDF here';
        }

        function unhighlight() {
            uploadBox.classList.remove('drag-over');
            dropText.textContent = 'Drag & drop PDF file here';
        }

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;

            if (files.length > 0) {
                handleFiles(files[0]);
            }
        }

        function handleFileSelect(e) {
            if (e.target.files.length > 0) {
                handleFiles(e.target.files[0]);
            }
        }

        function handleFiles(file) {
            if (file.type === 'application/pdf') {
                fileName.textContent = file.name;
                fileInfo.classList.add('show');
                uploadBox.classList.add('has-file');

                // Store the file reference
                uploadBox.dataset.fileName = file.name;
            } else {
                alert('Please upload a PDF file only.');
                clearFileSelection();
            }
        }

        function clearFileSelection() {
            fileInput.value = '';
            fileInfo.classList.remove('show');
            uploadBox.classList.remove('has-file');
            delete uploadBox.dataset.fileName;
        }

        // Prevent form submission when hitting enter in URL field
        document.getElementById('paper-url').addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                summarizePaper();
            }
        });

    });


});
document.getElementById('clear-data-btn').addEventListener('click', clearAllData);

// Mobile sidebar toggle
document.addEventListener('DOMContentLoaded', function () {
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (hamburger && sidebar) {
        hamburger.addEventListener('click', function () {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('open');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', function () {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
        });
    }

    // Close sidebar when clicking a tab on mobile
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('open');
                overlay.classList.remove('open');
            }
        });
    });
});

let refinementData = {
    researchGaps: [],
    selectedGaps: [],
    hypotheses: [],
    selectedHypotheses: [],
    narrowedTopics: [],
    selectedTopics: []
};

let selectedPapers = [];

const motivationalQuotes = [
    "Research is creating new knowledge. - Neil Armstrong",
    "The important thing is not to stop questioning. - Albert Einstein",
    "If we knew what we were doing, it wouldn't be called research. - Albert Einstein",
    "Research is formalized curiosity. - Zora Neale Hurston",
    "The best way to predict the future is to create it. - Alan Kay",
    "Innovation distinguishes between a leader and a follower. - Steve Jobs",
    "Science is the acceptance of what works and the rejection of what does not. - Jacob Bronowski",
    "The art and science of asking questions is the source of all knowledge. - Thomas Berger",
    "Research is seeing what everybody else has seen and thinking what nobody else has thought. - Albert Szent-Györgyi",
    "The scientist is not a person who gives the right answers, but one who asks the right questions. - Claude Lévi-Strauss"
];

function showLoader() {
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    document.getElementById('motivational-quote').textContent = randomQuote;
    document.getElementById('fullpage-loader').classList.remove('hidden');
}

function hideLoader() {
    document.getElementById('fullpage-loader').classList.add('hidden');
}


function clearAllData() {
    if (confirm('Are you sure you want to clear all saved data? This cannot be undone.')) {
        localStorage.removeItem('savedSummaries');
        localStorage.removeItem('savedCitations');
        localStorage.removeItem('refinementData');
        localStorage.removeItem('savedDrafts');

        setTimeout(() => {
            window.location.reload();
        }, 500);

        // Refresh the current tab to show empty state
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            const emptyState = activeTab.querySelector('.empty-state');
            if (emptyState) {
                activeTab.querySelector('.results-container').innerHTML = emptyState.outerHTML;
            }
        }

        alert('All saved data has been cleared.');
    }
}

// Helper function to display errors
function showError(message, elementId = null, isToast = false) {
    hideLoader();

    const errorHtml = `
    <div class="error-message ${isToast ? 'toast' : ''}">
      <i class="fas fa-exclamation-triangle"></i>
      <div>
        <h4>${isToast ? 'Error' : 'Something went wrong'}</h4>
        <p>${message}</p>
      </div>
      <button class="btn-icon" onclick="this.closest('.error-message').remove()">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;

    if (elementId) {
        const container = document.getElementById(elementId);
        if (container) {
            container.innerHTML = errorHtml;
            return;
        }
    }
    // Show as toast if no container specified
    document.body.insertAdjacentHTML('afterbegin', errorHtml);

    // Auto-dismiss toast after 5 seconds
    if (isToast) {
        setTimeout(() => {
            const toast = document.querySelector('.error-message.toast');
            if (toast) toast.remove();
        }, 5000);
    }
}

// Helper function to handle API errors
async function handleApiError(error, context) {
    console.error(`Error in ${context}:`, error);

    let userMessage = ERROR_MESSAGES.DEFAULT;

    if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
        userMessage = ERROR_MESSAGES.NETWORK;
    } else if (error.response) {
        // Handle HTTP error responses
        const serverMessage = error.response.data?.message || error.message;

        if (error.response.status === 400) {
            userMessage = serverMessage || ERROR_MESSAGES.INVALID_INPUT;
        } else if (error.response.status === 429) {
            userMessage = ERROR_MESSAGES.API_LIMIT;
        } else if (error.response.status >= 500) {
            userMessage = ERROR_MESSAGES.SERVER;
        }
    } else if (error.message.includes('timeout')) {
        userMessage = ERROR_MESSAGES.TIMEOUT;
    }

    // Context-specific messages
    const contextMap = {
        'search': ERROR_MESSAGES.SEARCH,
        'summar': ERROR_MESSAGES.SUMMARIZATION,
        'citation': ERROR_MESSAGES.CITATION,
        'refine': ERROR_MESSAGES.REFINEMENT,
        'plagiarism': ERROR_MESSAGES.PLAGIARISM,
        'draft': ERROR_MESSAGES.DRAFT,
        'export': ERROR_MESSAGES.EXPORT,
        'upload': ERROR_MESSAGES.FILE_UPLOAD
    };

    for (const [key, msg] of Object.entries(contextMap)) {
        if (context.includes(key)) {
            userMessage = msg;
            break;
        }
    }

    showError(userMessage, `${context}-results`);
    return { error: true, message: userMessage };
}
// Enhanced fetch with timeout
async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 30000 } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });

    clearTimeout(id);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
            response,
            message: errorData.message || `HTTP error! status: ${response.status}`,
            status: response.status
        };
    }

    return response;
}


function startDraftGeneration() {
    document.querySelector('.draft-intro').classList.add('hidden');
    document.querySelector('.draft-config').classList.remove('hidden');

    // Load saved summaries
    loadSavedSummaries();
}

function toggleCustomWordCount() {
    const wordCountSelect = document.getElementById('word-count');
    const customWordCount = document.getElementById('custom-word-count');

    if (wordCountSelect.value === 'custom') {
        customWordCount.classList.remove('hidden');
        customWordCount.style.display = 'block';
        customWordCount.focus();
    } else {
        customWordCount.classList.add('hidden');
        customWordCount.style.display = 'none';
    }
}

function loadSavedSummaries() {
    const summarySelection = document.getElementById('summary-selection');
    summarySelection.innerHTML = '';

    const savedSummaries = getSavedSummaries();
    const uniqueSummaries = removeDuplicateSummaries(savedSummaries);

    // Always show the option to proceed without summaries
    const noSummaryOption = document.createElement('div');
    noSummaryOption.className = 'summary-checkbox';
    noSummaryOption.innerHTML = `
        <label>
            <input type="checkbox" name="selected-summaries" value="no-summary" checked>
            <span class="summary-title">Generate without saved summaries</span>
        </label>
    `;
    summarySelection.appendChild(noSummaryOption);

    if (uniqueSummaries.length > 0) {
        uniqueSummaries.forEach(summary => {
            const checkbox = document.createElement('div');
            checkbox.className = 'option-card';
            checkbox.innerHTML = `
                <input type="checkbox" name="selected-summaries" value="${summary.id}" checked id="summary-${summary.id}">
                <div class="option-card-content">
                    <div class="option-card-title">${summary.title}</div>
                    <div class="option-card-source">${summary.source}</div>
                </div>
            `;
            summarySelection.appendChild(checkbox);
        });
    }
}

function removeDuplicateSummaries(summaries) {
    const unique = [];
    const titles = new Set();

    for (const summary of summaries) {
        if (!titles.has(summary.title)) {
            titles.add(summary.title);
            unique.push(summary);
        }
    }

    return unique;
}

function getSavedSummaries() {
    try {
        const saved = localStorage.getItem('savedSummaries');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error('Error parsing saved summaries:', e);
        return [];
    }
}

function getSavedCitations() {
    try {
        const saved = localStorage.getItem('savedCitations');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error('Error parsing saved citations:', e);
        return [];
    }
}

function getRefinementData() {
    try {
        const saved = localStorage.getItem('refinementData');
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        console.error('Error parsing refinement data:', e);
        return {};
    }
}

async function generateDraft() {
    showLoader(); // Show full-page loader
    const btn = document.getElementById('generate-draft-btn');
    const originalText = btn.textContent;
    btn.innerHTML = `${originalText} <span class="loading"></span>`;
    btn.disabled = true;

    try {
        const title = document.getElementById('draft-title').value;
        const objective = document.getElementById('research-objective').value;

        // Get selected summaries
        const selectedSummaryIds = Array.from(
            document.querySelectorAll('input[name="selected-summaries"]:checked')
        ).map(el => el.value);

        // Filter out the "no summary" option if other summaries are selected
        const hasRealSummaries = selectedSummaryIds.some(id => id !== 'no-summary');
        const filteredSummaryIds = hasRealSummaries
            ? selectedSummaryIds.filter(id => id !== 'no-summary')
            : [];

        const allSummaries = getSavedSummaries();
        const selectedSummaries = allSummaries.filter(summary =>
            filteredSummaryIds.includes(summary.id)
        );

        // Generate title if not provided
        let finalTitle = title;
        if (!title && objective) {
            try {
                const response = await fetch(window.location.origin + '/api/generate-title', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: objective })
                });
                if (response.ok) {
                    const data = await response.json();
                    finalTitle = data.title;
                    document.getElementById('draft-title').value = finalTitle;
                }
            } catch (e) {
                console.error('Error generating title:', e);
            }
        }

        const config = {
            title: finalTitle,
            userContent: objective,
            summaries: selectedSummaries,
            citations: getSavedCitations(),
            refinementData: getRefinementData(),
            sections: Array.from(
                document.querySelectorAll('input[name="sections"]:checked')
            ).map(el => el.value),
            citationStyle: document.getElementById('citation-style').value,
            wordCount: document.getElementById('word-count').value === 'custom'
                ? document.getElementById('custom-word-count').value
                : document.getElementById('word-count').value,
            tone: document.getElementById('tone').value,
        };

        const response = await fetch(window.location.origin + '/api/drafts/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to generate draft');
        }

        const draft = await response.json();
        displayDraft(draft, finalTitle);

        document.querySelector('.draft-config').classList.add('hidden');
        document.querySelector('.draft-preview').classList.remove('hidden');

    } catch (error) {
        console.error('Error generating draft:', error);
        alert('Error generating draft: ' + error.message);
    } finally {
        hideLoader(); // Hide loader when done
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function saveDataToLocalStorage() {
    // Initialize storage if empty
    if (!localStorage.getItem('savedSummaries')) {
        localStorage.setItem('savedSummaries', JSON.stringify([]));
    }
    if (!localStorage.getItem('savedCitations')) {
        localStorage.setItem('savedCitations', JSON.stringify([]));
    }
    if (!localStorage.getItem('refinementData')) {
        localStorage.setItem('refinementData', JSON.stringify({}));
    }

    return {
        saveSummary: (summaryData) => {
            const summaries = getSavedSummaries();
            summaries.push(summaryData);
            localStorage.setItem('savedSummaries', JSON.stringify(summaries));
        },
        saveCitation: (citationData) => {
            const citations = getSavedCitations();
            citations.push(citationData);
            localStorage.setItem('savedCitations', JSON.stringify(citations));
        },
        saveRefinementData: (refinementData) => {
            localStorage.setItem('refinementData', JSON.stringify(refinementData));
        }
    };
}

// Initialize the data saver
const dataSaver = saveDataToLocalStorage();


function displayDraft(draft, title) {
    const draftContent = document.getElementById('draft-content');
    draftContent.innerHTML = '';

    // Add title if available
    if (title) {
        const titleEl = document.createElement('h1');
        titleEl.textContent = title;
        draftContent.appendChild(titleEl);
    }

    // Define the order of sections
    const sectionOrder = [
        'abstract',
        'introduction',
        'literature-review',
        'methodology',
        'findings',
        'conclusion',
        'references'  // Add references last
    ];

    // Create section elements in order
    sectionOrder.forEach(section => {
        if (draft[section]) {
            const sectionEl = document.createElement('div');
            sectionEl.className = 'draft-section';
            sectionEl.dataset.section = section;

            const heading = section === 'literature-review' ? 'Literature Review'
                : section === 'references' ? 'References'
                    : section.charAt(0).toUpperCase() + section.slice(1).replace('-', ' ');

            sectionEl.innerHTML = `
                <h2>${heading}</h2>
                <div class="section-content">${draft[section]}</div>
            `;
            draftContent.appendChild(sectionEl);
        }
    });
}

async function exportAsDocx() {
    try {
        const draftContent = document.getElementById('draft-content');
        const title = document.getElementById('draft-title').value || 'ResearchDraft';

        // Extract all sections and their content
        const sections = Array.from(draftContent.querySelectorAll('.draft-section')).map(section => {
            return {
                title: section.querySelector('h2').textContent,
                content: section.querySelector('.section-content').innerHTML
            };
        });

        // Generate properly formatted DOCX
        const response = await fetch(window.location.origin + '/api/export/docx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                sections,
                style: document.getElementById('citation-style').value
            })
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            throw new Error('Failed to generate DOCX');
        }
    } catch (error) {
        console.error('Error exporting DOCX:', error);
        alert('Error exporting DOCX: ' + error.message);
    }
}

async function exportAsPdf() {
    try {
        const draftContent = document.getElementById('draft-content');
        const title = document.getElementById('draft-title').value || 'ResearchDraft';

        // Extract all sections and their content
        const sections = Array.from(draftContent.querySelectorAll('.draft-section')).map(section => {
            return {
                title: section.querySelector('h2').textContent,
                content: section.querySelector('.section-content').innerText // Use innerText for plain text
            };
        });

        // Generate properly formatted PDF
        const response = await fetch(window.location.origin + '/api/export/pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                sections,
                style: document.getElementById('citation-style').value
            })
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            throw new Error('Failed to generate PDF');
        }
    } catch (error) {
        console.error('Error exporting PDF:', error);
        alert('Error exporting PDF: ' + error.message);
    }
}

async function exportAsLatex() {
    try {
        const draftContent = document.getElementById('draft-content');
        const title = document.getElementById('draft-title').value || 'ResearchDraft';

        // Extract all sections and their content
        const sections = Array.from(draftContent.querySelectorAll('.draft-section')).map(section => {
            return {
                title: section.querySelector('h2').textContent,
                content: section.querySelector('.section-content').innerText
                    .replace(/&/g, '\\&')
                    .replace(/%/g, '\\%')
                    .replace(/\$/g, '\\$')
                    .replace(/#/g, '\\#')
                    .replace(/_/g, '\\_')
                    .replace(/\{/g, '\\{')
                    .replace(/\}/g, '\\}')
                    .replace(/~/g, '\\textasciitilde{}')
                    .replace(/\^/g, '\\textasciicircum{}')
                    .replace(/\\/g, '\\textbackslash{}')
            };
        });

        // Generate properly formatted LaTeX
        const response = await fetch(window.location.origin + '/api/export/latex', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                sections,
                style: document.getElementById('citation-style').value,
                author: "Author Name" // You can make this dynamic
            })
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title}.tex`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            throw new Error('Failed to generate LaTeX');
        }
    } catch (error) {
        console.error('Error exporting LaTeX:', error);
        alert('Error exporting LaTeX: ' + error.message);
    }
}

async function saveDraft() {
    const draftContent = document.getElementById('draft-content').innerHTML;

    try {
        const response = await fetch(window.location.origin + '/api/drafts/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: draftContent })
        });

        if (response.ok) {
            alert('Draft saved successfully!');
        } else {
            throw new Error('Failed to save draft');
        }
    } catch (error) {
        console.error('Error saving draft:', error);
        alert('Error saving draft: ' + error.message);
    }
}

async function searchLiterature() {
    const topicInput = document.getElementById('research-topic');
    const topic = topicInput.value.trim();

    if (!topic) {
        alert('Please enter a research topic');
        return;
    }

    showLoader(); // Show full-page loader

    const btn = document.getElementById('search-btn');
    const originalText = btn.textContent;
    btn.innerHTML = `${originalText} <span class="loading"></span>`;
    btn.disabled = true;

    try {
        console.log(`Searching for topic: "${topic}"`); // Debug log

        const response = await fetch(window.location.origin + '/api/literature/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ topic })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        console.log('Search results:', data); // Debug log

        displayLiteratureResults(data);
    } catch (error) {
        console.error('Error searching literature:', error);

        // Show error in results container
        const resultsContainer = document.getElementById('literature-results');
        resultsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Error searching literature</h4>
                <p>${error.message}</p>
                <p>Please try again with different search terms.</p>
            </div>
        `;
    } finally {
        hideLoader(); // Hide loader when done
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function displayLiteratureResults(data) {
    const resultsContainer = document.getElementById('literature-results');
    resultsContainer.innerHTML = '';

    if (!data.papers || data.papers.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-book-open"></i>
                <h3>No papers found</h3>
                <p>No papers found for "${data.originalQuery}".</p>
                ${data.refinedQuery !== data.originalQuery ?
                `<p>Search was attempted with refined query: "${data.refinedQuery}"</p>` : ''}
                <button class="btn btn-outline" onclick="searchLiterature()">
                    <i class="fas fa-sync-alt"></i> Try Again
                </button>
            </div>
        `;
        return;
    }

    const papersWithAbstracts = data.papers.filter(paper =>
        paper.abstract && paper.abstract !== 'No abstract available'
    );

    if (papersWithAbstracts.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-book-open"></i>
                <h3>No papers with abstracts found</h3>
                <p>Found ${data.papers.length} papers but none had readable abstracts.</p>
                <button class="btn btn-outline" onclick="searchLiterature()">
                    <i class="fas fa-sync-alt"></i> Try Again
                </button>
            </div>
        `;
        return;
    }

    // Clear previous selections
    selectedPapers = [];
    updateSelectedPapersList();

    papersWithAbstracts.forEach(paper => {
        const paperEl = document.createElement('div');
        paperEl.className = 'paper-result selectable-paper';
        paperEl.dataset.paperId = paper.id;

        let authors = paper.authors?.join(', ') || 'Unknown authors';
        if (authors.length > 100) {
            authors = authors.substring(0, 100) + '...';
        }

        const abstractWords = paper.abstract.split(' ');
        const shortenedAbstract = abstractWords.length > 300
            ? abstractWords.slice(0, 300).join(' ') + '...'
            : paper.abstract;

        const sourceBadge = `<span class="source-badge">${paper.source}</span>`;

        paperEl.innerHTML = `
            <div class="paper-header">
                <h3>${paper.title || 'Untitled'} ${sourceBadge}</h3>
                <button class="select-paper-btn">
                    <i class="far fa-square"></i> Select
                </button>
            </div>
            <div class="meta">
                <span>By ${authors}</span> | 
                <span>${paper.publication || 'Unknown publication'}</span> | 
                <span>${paper.year || 'Unknown year'}</span> | 
                <span>Citations: ${paper.citationCount || 0}</span>
            </div>
            <div class="abstract-section">
                <h4>Abstract</h4>
                <div class="abstract">${shortenedAbstract}</div>
            </div>
            <div class="actions">
                <button onclick="summarizePaperById('${paper.id}', '${escapeHtml(paper.title || 'Untitled')}', '${escapeHtml(paper.url || '')}', '${escapeHtml(paper.pdfUrl || '')}')">
                    <i class="fas fa-file-contract"></i> Summarize
                </button>
                <button onclick="generateCitationForPaper('${paper.id}', '${escapeHtml(paper.title || 'Untitled')}')">
                    <i class="fas fa-quote-right"></i> Citation
                </button>
                ${paper.url ? `<a href="${paper.url}" target="_blank"><button><i class="fas fa-external-link-alt"></i> View</button></a>` : ''}
                ${paper.pdfUrl ? `<a href="${paper.pdfUrl}" target="_blank"><button><i class="fas fa-file-pdf"></i> PDF</button></a>` : ''}
            </div>
        `;

        // Add select event listener
        const selectBtn = paperEl.querySelector('.select-paper-btn');
        selectBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            togglePaperSelection(paper, selectBtn);
        });

        resultsContainer.appendChild(paperEl);
    });

    // Show the selected papers container
    document.getElementById('selected-papers-container').classList.remove('hidden');
}

// Helper function to escape HTML for use in attributes
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function togglePaperSelection(paper, button) {
    const index = selectedPapers.findIndex(p => p.id === paper.id);

    if (index === -1) {
        if (selectedPapers.length >= 5) {
            alert('You can select a maximum of 5 papers');
            return;
        }
        selectedPapers.push(paper);
        button.innerHTML = '<i class="far fa-check-square"></i> Selected';
        button.classList.add('selected');
    } else {
        selectedPapers.splice(index, 1);
        button.innerHTML = '<i class="far fa-square"></i> Select';
        button.classList.remove('selected');
    }

    updateSelectedPapersList();
}

function updateSelectedPapersList() {
    const list = document.getElementById('selected-papers-list');
    list.innerHTML = '';

    selectedPapers.forEach((paper, index) => {
        const paperEl = document.createElement('div');
        paperEl.className = 'selected-paper';
        paperEl.innerHTML = `
            <span class="paper-title">${paper.title}</span>
            <button class="btn-icon remove-paper" data-paper-id="${paper.id}">
                <i class="fas fa-times"></i>
            </button>
        `;
        list.appendChild(paperEl);
    });

    // Add event listeners to all remove buttons
    document.querySelectorAll('.remove-paper').forEach(button => {
        button.addEventListener('click', function () {
            const paperId = this.getAttribute('data-paper-id');
            removeSelectedPaper(paperId);
        });
    });

    // Enable/disable proceed button based on selection
    document.getElementById('proceed-to-draft-btn').disabled = selectedPapers.length === 0;
}
function removeSelectedPaper(paperId) {
    // Remove from selected papers array
    const index = selectedPapers.findIndex(p => p.id === paperId);
    if (index !== -1) {
        selectedPapers.splice(index, 1);
    }

    // Update the UI
    updateSelectedPapersList();

    // Also update the select buttons in the papers list
    const paperElement = document.querySelector(`.paper-result[data-paper-id="${paperId}"]`);
    if (paperElement) {
        const selectBtn = paperElement.querySelector('.select-paper-btn');
        if (selectBtn) {
            selectBtn.innerHTML = '<i class="far fa-square"></i> Select';
            selectBtn.classList.remove('selected');
            paperElement.classList.remove('selected-paper');
        }
    }
}

// Add event listener for proceeding to draft generator
document.getElementById('proceed-to-draft-btn').addEventListener('click', function () {
    // Switch to draft generator tab
    document.querySelector('[data-tab="draft-generator"]').click();

    // Load the selected papers into the draft generator
    loadSelectedPapersForDraft();
});

function loadSelectedPapersForDraft() {
    const summarySelection = document.getElementById('summary-selection');
    summarySelection.innerHTML = '';

    selectedPapers.forEach(paper => {
        const checkbox = document.createElement('div');
        checkbox.className = 'paper-checkbox';
        checkbox.innerHTML = `
            <label>
                <input type="checkbox" name="selected-summaries" value="${paper.id}" checked>
                <span class="paper-title">${paper.title}</span>
                <span class="paper-source">(${paper.source})</span>
                <a href="${paper.url}" target="_blank" class="paper-link"><i class="fas fa-external-link-alt"></i></a>
            </label>
        `;
        summarySelection.appendChild(checkbox);
    });

    // Show the draft config section
    document.querySelector('.draft-intro').classList.add('hidden');
    document.querySelector('.draft-config').classList.remove('hidden');
}



document.addEventListener('DOMContentLoaded', function () {
    // Tab switching functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');

            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Literature Search
    document.getElementById('search-btn').addEventListener('click', searchLiterature);

    // Paper Summarizer
    document.getElementById('summarize-btn').addEventListener('click', summarizePaper);

    // Citation Generator
    document.getElementById('generate-citation-btn').addEventListener('click', generateCitation);

    // Topic Refinement
    document.getElementById('refine-topic-btn').addEventListener('click', refineTopic);

    // Plagiarism Check
    document.getElementById('check-plagiarism-btn').addEventListener('click', checkPlagiarism);
});

async function summarizePaperById(paperId, paperTitle, paperUrl = null, pdfUrl = null) {
    // Switch to the paper summarizer tab
    document.querySelector('[data-tab="paper-summarizer"]').click();
    document.getElementById('paper-summarizer').querySelector('h2').textContent = `Summarizing: ${paperTitle}`;

    const resultsContainer = document.getElementById('summary-results');
    resultsContainer.innerHTML = '<p>Processing paper... <span class="loading"></span></p>';

    try {
        // Prefer PDF URL if available
        const urlToUse = pdfUrl || paperUrl;

        if (!urlToUse) {
            throw new Error('No accessible URL available for this paper');
        }

        // Set the URL in the input field
        document.getElementById('paper-url').value = urlToUse;

        // Call the existing summarize function
        await summarizePaper();
    } catch (error) {
        console.error('Error summarizing paper:', error);
        resultsContainer.innerHTML = `
            <div class="error-message">
                <p>Failed to summarize paper: ${error.message}</p>
                ${paperUrl ?
                `<p>You can try <a href="${paperUrl}" target="_blank">viewing the paper directly</a>.</p>` :
                ''}
            </div>
        `;
    }
}

async function summarizePaper(event) {
    if (event) {
        event.preventDefault();
    }

    const fileInput = document.getElementById('paper-upload');
    const paperUrlInput = document.getElementById('paper-url');
    const paperUrl = paperUrlInput.value.trim();

    if (!fileInput.files[0] && !paperUrl) {
        alert('Please upload a PDF or enter a paper URL');
        return;
    }

    showLoader(); // Show full-page loader
    const btn = document.getElementById('summarize-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;

    const resultsContainer = document.getElementById('summary-results');
    resultsContainer.innerHTML = '<div class="processing-message"><i class="fas fa-spinner fa-spin"></i> Analyzing document, please wait...</div>';

    try {
        let summary;
        if (fileInput.files[0]) {
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);


            const response = await fetch(window.location.origin + '/api/summarize-pdf', {
                method: 'POST',
                body: formData,
            });

            // if (!response.ok) {
            //     throw new Error(await response.text() || 'Failed to summarize PDF');
            // }
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'PDF summarization failed');
            }
            summary = data;
        } else {
            const response = await fetch(window.location.origin + '/api/summarize-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: paperUrl }),
            });
            const data = await response.json();

            console.log('URL summarization response:', data); // Debug log

            if (data.statusCode == 500) {
                throw new Error(data.message || 'URL summarization failed');
            }

            summary = data;

            // if (!response.ok) {
            //     throw new Error(await response.text() || 'Failed to summarize URL');
            // }
            // summary = await response.json();
        }

        // Save the summary
        const summaryData = {
            id: `summary-${Date.now()}`,
            title: document.querySelector('#paper-summarizer h2').textContent.replace('Summarizing: ', ''),
            content: typeof summary === 'string' ? summary : JSON.stringify(summary),
            source: paperUrl ? 'URL' : 'Uploaded PDF',
            keyFindings: extractKeyFindings(summary)
        };

        const summaries = getSavedSummaries();
        summaries.push(summaryData);
        localStorage.setItem('savedSummaries', JSON.stringify(summaries));

        displaySummaryResults(summary);
    } catch (error) {
        console.error('Error summarizing:', error);
        resultsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Error summarizing document</h4>
                <p>${error.message}</p>
                <p>Please try again with a different document.</p>
            </div>
        `;
    } finally {
        hideLoader(); // Hide loader when done
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Helper function to extract key findings
function extractKeyFindings(summary) {
    if (typeof summary === 'string') {
        const findings = [];
        const sections = summary.split('\n\n');
        sections.forEach(section => {
            if (section.toLowerCase().includes('finding') || section.toLowerCase().includes('result')) {
                findings.push(section);
            }
        });
        return findings.join('\n\n');
    }
    return summary.findings || '';
}

function displaySummaryResults(summary) {
    const resultsContainer = document.getElementById('summary-results');
    resultsContainer.innerHTML = '';

    if (!summary) {
        resultsContainer.innerHTML = '<p>No summary could be generated for this paper.</p>';
        return;
    }

    // For HTML-formatted response from Gemini
    if (typeof summary === 'string') {
        resultsContainer.innerHTML = `
            <div class="full-summary">
                ${summary}
            </div>
        `;
    }
    // For structured response (if you want to keep compatibility with both)
    else if (typeof summary === 'object') {
        const sections = ['abstract', 'introduction', 'methodology', 'findings', 'conclusion', 'contribution', 'gaps', 'relevance'];

        sections.forEach(section => {
            if (summary[section]) {
                const sectionEl = document.createElement('div');
                sectionEl.className = 'summary-section';

                const heading = section.charAt(0).toUpperCase() + section.slice(1);
                sectionEl.innerHTML = `
                    <h4>${heading}</h4>
                    <p>${summary[section]}</p>
                `;

                resultsContainer.appendChild(sectionEl);
            }
        });
    }
}

function formatSource(source) {
    const sources = {
        'full-text': 'Full paper text',
        'abstract': 'Paper abstract',
        'direct-url': 'Direct URL content',
        'uploaded-pdf': 'Uploaded PDF'
    };
    return sources[source] || source;
}

function retrySummarize(paperId, paperTitle) {
    summarizePaperById(paperId, paperTitle);
}

async function generateCitationForPaper(paperId, paperTitle) {
    // Set the tab and title
    document.getElementById('citation-generator').querySelector('h2').textContent = `Generating Citation for: ${paperTitle}`;
    document.querySelector('[data-tab="citation-generator"]').click();

    // Update the input field with the paper title
    const citationInput = document.getElementById('citation-input');
    citationInput.value = paperTitle;

    // Store the paper ID in a data attribute for later use
    citationInput.dataset.paperId = paperId;

    try {
        const style = document.getElementById('citation-style').value;
        const response = await fetch(window.location.origin + '/api/citations/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ paperId, style })
        });

        const data = await response.json();

        if (response.ok) {
            displayCitationResults(data.citation, data.bibtex, paperTitle);
        } else {
            throw new Error(data.error || 'Failed to generate citation');
        }
    } catch (error) {
        console.error('Error generating citation:', error);
        alert('Error generating citation: ' + error.message);
    }
}

document.getElementById('citation-style').addEventListener('change', function () {
    const input = document.getElementById('citation-input');
    if (input.value || input.dataset.paperId) {
        generateCitation();
    }
});

async function generateCitation() {
    const input = document.getElementById('citation-input');
    const paperId = input.dataset.paperId || input.value.trim();
    const style = document.getElementById('citation-style').value;

    if (!paperId) {
        alert('Please enter a paper title, DOI or URL');
        return;
    }
    showLoader(); // Show full-page loader

    const btn = document.getElementById('generate-citation-btn');
    const originalText = btn.textContent;
    btn.innerHTML = `${originalText} <span class="loading"></span>`;
    btn.disabled = true;

    try {
        const response = await fetch(window.location.origin + '/api/citations/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paperId, style })
        });

        if (!response.ok) throw new Error('Failed to generate citation');

        const data = await response.json();

        // Save the citation for draft generation
        const citationData = {
            id: `citation-${Date.now()}`,
            paperId: paperId,
            title: data.paperTitle || input.value,
            citation: data.citation,
            bibtex: data.bibtex,
            style: style
        };

        const citations = getSavedCitations();
        citations.push(citationData);
        localStorage.setItem('savedCitations', JSON.stringify(citations));

        displayCitationResults(data.citation, data.bibtex, input.value);
    } catch (error) {
        console.error('Error generating citation:', error);
        alert('Error generating citation: ' + error.message);
    } finally {
        hideLoader(); // Hide loader when done
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function displayCitationResults(citation, bibtex, paperTitle) {
    const resultsContainer = document.getElementById('citation-results');
    const noteEl = document.getElementById('current-paper-note');
    resultsContainer.innerHTML = '';

    if (!citation) {
        resultsContainer.innerHTML = '<p>No citation could be generated for this paper.</p>';
        noteEl.textContent = '';
        return;
    }

    // Update the note about current paper
    if (paperTitle) {
        noteEl.textContent = `Currently citing: ${paperTitle}`;
    } else {
        noteEl.textContent = '';
    }

    const citationEl = document.createElement('div');
    citationEl.className = 'citation-result';
    citationEl.innerHTML = `
        <h4>Citation:</h4>
        <p>${citation}</p>
    `;
    resultsContainer.appendChild(citationEl);

    if (bibtex) {
        const bibtexEl = document.createElement('div');
        bibtexEl.className = 'citation-result';
        bibtexEl.innerHTML = `
            <h4>BibTeX:</h4>
            <pre>${bibtex}</pre>
            <button onclick="copyToClipboard('${bibtex.replace(/'/g, "\\'")}')">Copy BibTeX</button>
        `;
        resultsContainer.appendChild(bibtexEl);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => alert('Copied to clipboard!'))
        .catch(err => console.error('Failed to copy:', err));
}

async function refineTopic() {
    const researchProblem = document.getElementById('research-problem').value.trim();

    if (!researchProblem) {
        alert('Please describe your research problem or topic');
        return;
    }

    showLoader(); // Show full-page loader

    const btn = document.getElementById('refine-topic-btn');
    const originalText = btn.textContent;
    btn.innerHTML = `${originalText} <span class="loading"></span>`;
    btn.disabled = true;

    try {
        const response = await fetch(window.location.origin + '/api/topics/refine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ researchProblem })
        });

        if (!response.ok) throw new Error('Failed to refine topic');

        const data = await response.json();

        // Store the refinement data
        refinementData.researchGaps = data.researchGaps.slice(0, 10); // Get top 10 gaps
        refinementData.hypotheses = data.hypotheses;
        refinementData.narrowedTopics = data.narrowedTopics;

        // Display research gaps for selection
        displayResearchGaps();

    } catch (error) {
        console.error('Error refining topic:', error);
        alert('Error refining topic: ' + error.message);
    } finally {
        hideLoader(); // Hide loader when done
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function displayResearchGaps() {
    const container = document.getElementById('research-gaps-container');
    const list = document.getElementById('research-gaps-list');
    const emptyState = document.querySelector('#refinement-results .empty-state');

    // Hide the empty state now that we have results
    if (emptyState) {
        emptyState.classList.add('hidden');
    }

    list.innerHTML = '';
    refinementData.researchGaps.forEach((gap, index) => {
        const checkbox = document.createElement('div');
        checkbox.className = 'option-card';
        checkbox.innerHTML = `
            <input type="checkbox" name="selected-gaps" value="${index}" id="gap-${index}">
            <div class="option-card-content">
                <div class="option-card-title">${gap}</div>
            </div>
        `;
        list.appendChild(checkbox);
    });

    container.classList.remove('hidden');
    document.getElementById('hypotheses-container').classList.add('hidden');
    document.getElementById('narrowed-topics-container').classList.add('hidden');
}

// Add event listener for selecting gaps
document.getElementById('select-gaps-btn').addEventListener('click', function () {
    refinementData.selectedGaps = Array.from(
        document.querySelectorAll('input[name="selected-gaps"]:checked')
    ).map(el => refinementData.researchGaps[el.value]);

    if (refinementData.selectedGaps.length === 0) {
        alert('Please select at least one research gap');
        return;
    }

    displayHypotheses();
});

function displayHypotheses() {
    const container = document.getElementById('hypotheses-container');
    const list = document.getElementById('hypotheses-list');

    list.innerHTML = '';
    refinementData.hypotheses.forEach((hypothesis, index) => {
        const checkbox = document.createElement('div');
        checkbox.className = 'option-card';
        checkbox.innerHTML = `
            <input type="checkbox" name="selected-hypotheses" value="${index}" id="hypothesis-${index}">
            <div class="option-card-content">
                <div class="option-card-title">${hypothesis}</div>
            </div>
        `;
        list.appendChild(checkbox);
    });

    container.classList.remove('hidden');
}

// Add event listener for selecting hypotheses
document.getElementById('select-hypotheses-btn').addEventListener('click', function () {
    refinementData.selectedHypotheses = Array.from(
        document.querySelectorAll('input[name="selected-hypotheses"]:checked')
    ).map(el => refinementData.hypotheses[el.value]);

    if (refinementData.selectedHypotheses.length === 0) {
        alert('Please select at least one hypothesis');
        return;
    }

    displayNarrowedTopics();
});

function displayNarrowedTopics() {
    const container = document.getElementById('narrowed-topics-container');
    const list = document.getElementById('narrowed-topics-list');

    list.innerHTML = '';
    refinementData.narrowedTopics.forEach((topic, index) => {
        const checkbox = document.createElement('div');
        checkbox.className = 'option-card';
        checkbox.innerHTML = `
            <input type="checkbox" name="selected-topics" value="${index}" id="topic-${index}">
            <div class="option-card-content">
                <div class="option-card-title">${topic}</div>
            </div>
        `;
        list.appendChild(checkbox);
    });

    container.classList.remove('hidden');

    // Add event listener to enforce max 2 selections
    list.querySelectorAll('input[name="selected-topics"]').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const checkedBoxes = list.querySelectorAll('input[name="selected-topics"]:checked');
            if (checkedBoxes.length > 2) {
                this.checked = false;
                alert('You can select a maximum of 2 narrowed topics');
            }
        });
    });
}

// Add event listener for proceeding to literature search
document.getElementById('proceed-to-search-btn').addEventListener('click', function () {
    refinementData.selectedTopics = Array.from(
        document.querySelectorAll('input[name="selected-topics"]:checked')
    ).map(el => refinementData.narrowedTopics[el.value]);

    if (refinementData.selectedTopics.length === 0) {
        alert('Please select at least one topic');
        return;
    }

    // Switch to literature search tab and populate the search field
    // document.querySelector('[data-tab="literature-search"]').click();
    // document.getElementById('research-topic').value = refinementData.selectedTopics.join(', ');

    // Switch to literature search tab and populate the search field
    document.querySelector('[data-tab="literature-search"]').click();

    const formattedTopics = refinementData.selectedTopics.map(topic => {
        // Extract the existing number (like "2." or "3.")
        const match = topic.match(/^(\d+\.)/);
        if (match) {
            return `Topic ${match[1]} ${topic.replace(match[0], '').trim()}`;
        }
        return topic; // fallback if no number found
    }).join(', ');

    document.getElementById('research-topic').value = formattedTopics;
    // Trigger search automatically
    searchLiterature();
});

function displayRefinementResults(data) {
    const resultsContainer = document.getElementById('refinement-results');
    resultsContainer.innerHTML = '';

    if (!data) {
        resultsContainer.innerHTML = '<p>No refinement suggestions could be generated.</p>';
        return;
    }

    if (data.narrowedTopics) {
        const topicsEl = document.createElement('div');
        topicsEl.className = 'gap-suggestion';
        topicsEl.innerHTML = `
            <h4>Suggested Narrowed Topics:</h4>
            <ul>
                ${data.narrowedTopics.map(topic => `<li>${topic}</li>`).join('')}
            </ul>
        `;
        resultsContainer.appendChild(topicsEl);
    }

    if (data.researchGaps) {
        const gapsEl = document.createElement('div');
        gapsEl.className = 'gap-suggestion';
        gapsEl.innerHTML = `
            <h4>Potential Research Gaps:</h4>
            <ul>
                ${data.researchGaps.map(gap => `<li>${gap}</li>`).join('')}
            </ul>
        `;
        resultsContainer.appendChild(gapsEl);
    }

    if (data.keywords) {
        const keywordsEl = document.createElement('div');
        keywordsEl.className = 'gap-suggestion';
        keywordsEl.innerHTML = `
            <h4>Suggested Keywords:</h4>
            <p>${data.keywords.join(', ')}</p>
        `;
        resultsContainer.appendChild(keywordsEl);
    }

    if (data.hypotheses) {
        const hypothesesEl = document.createElement('div');
        hypothesesEl.className = 'gap-suggestion';
        hypothesesEl.innerHTML = `
            <h4>Possible Hypotheses:</h4>
            <ul>
                ${data.hypotheses.map(h => `<li>${h}</li>`).join('')}
            </ul>
        `;
        resultsContainer.appendChild(hypothesesEl);
    }
}

async function checkPlagiarism() {
    const text = document.getElementById('plagiarism-text').value.trim();

    if (!text) {
        alert('Please paste your text to check for plagiarism');
        return;
    }
    showLoader(); // Show full-page loader

    const btn = document.getElementById('check-plagiarism-btn');
    const originalText = btn.textContent;
    btn.innerHTML = `${originalText} <span class="loading"></span>`;
    btn.disabled = true;

    try {
        const response = await fetch(window.location.origin + '/api/plagiarism/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });

        const data = await response.json();

        if (response.ok) {
            displayPlagiarismResults(data);
        } else {
            throw new Error(data.error || 'Failed to check plagiarism');
        }
    } catch (error) {
        console.error('Error checking plagiarism:', error);
        alert('Error checking plagiarism: ' + error.message);
    } finally {
        hideLoader(); // Hide loader when done
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function displayPlagiarismResults(data) {
    const resultsContainer = document.getElementById('plagiarism-results');
    resultsContainer.innerHTML = '';

    if (!data) {
        resultsContainer.innerHTML = '<p>No plagiarism results could be generated.</p>';
        return;
    }

    // Display originality score
    const scoreEl = document.createElement('div');
    scoreEl.className = 'plagiarism-score';

    let scoreClass = 'score-medium';
    if (data.originalityScore >= 80) scoreClass = 'score-high';
    else if (data.originalityScore <= 50) scoreClass = 'score-low';

    scoreEl.innerHTML = `
        <span>Originality Score: <span class="${scoreClass}">${data.originalityScore}%</span></span>
    `;
    resultsContainer.appendChild(scoreEl);

    // Display highlighted text
    const textEl = document.createElement('div');
    textEl.className = 'plagiarism-result';
    textEl.innerHTML = `
        <h4>Text Analysis:</h4>
        <div class="text-analysis">${data.highlightedText}</div>
    `;
    resultsContainer.appendChild(textEl);

    // Display detailed plagiarism results
    if (data.plagiarismResults && data.plagiarismResults.some(r => r.isPlagiarized)) {
        const detailsEl = document.createElement('div');
        detailsEl.className = 'plagiarism-details';
        detailsEl.innerHTML = '<h4>Plagiarism Details:</h4>';

        data.plagiarismResults.filter(r => r.isPlagiarized).forEach((result, index) => {
            const paraphrased = data.paraphrasedResults?.[index]?.paraphrased || 'Paraphrasing not available';

            const resultEl = document.createElement('div');
            resultEl.className = 'plagiarism-item';
            resultEl.innerHTML = `
                <div class="original-sentence">
                    <strong>Original:</strong> ${result.text}
                </div>
                <div class="source">
                    <strong>Potential Source:</strong> ${result.source ? `<a href="${result.source}" target="_blank">${result.source}</a>` : 'Unknown'}
                </div>
                <div class="paraphrased-suggestion">
                    <strong>Suggested Rewrite:</strong> ${paraphrased}
                </div>
            `;

            detailsEl.appendChild(resultEl);
        });

        resultsContainer.appendChild(detailsEl);
    }

}