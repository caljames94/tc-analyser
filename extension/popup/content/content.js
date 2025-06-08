// Constants
const TC_PATTERNS = ['/terms', '/conditions', '/tos', '/eula'];
const PRIVACY_PATTERNS = ['/privacy', '/policy'];
const LINK_TEXT_PATTERNS = ['terms', 'conditions', 'privacy policy', 'terms of service', 'terms of use'];
const TITLE_PATTERNS = ['terms', 'conditions', 'privacy policy', 'terms of service', 'terms of use'];

// Main function to initialize the content script
const init = () => {
    if (isTermsPage()) {
        const content = extractContent();
        if (content) {
            sendToBackground(content);
            showNotificationOverlay();
        }
    } else {
        const tcLinks = findTCLinks();
        if (tcLinks.length > 0) {
            addVisualIndicators(tcLinks);
        }
    }
};

// Check if the current page is a Terms & Conditions or Privacy Policy page
const isTermsPage = () => {
    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();
    
    return TC_PATTERNS.some(pattern => url.includes(pattern)) ||
           PRIVACY_PATTERNS.some(pattern => url.includes(pattern)) ||
           TITLE_PATTERNS.some(pattern => title.includes(pattern));
};

// Extract content from the page
const extractContent = () => {
    try {
        // Attempt to find the main content area
        const mainContent = document.querySelector('main') || 
                            document.querySelector('article') || 
                            document.body;

        // Extract text content
        let content = mainContent.innerText;

        // Clean and format the content
        content = cleanContent(content);

        return content;
    } catch (error) {
        console.error('Error extracting content:', error);
        return null;
    }
};

// Clean and format the extracted text
const cleanContent = (text) => {
    return text
        .replace(/\s+/g, ' ')  // Replace multiple spaces with a single space
        .replace(/\n+/g, '\n') // Replace multiple newlines with a single newline
        .trim();
};

// Send the extracted content to the background script
const sendToBackground = (content) => {
    chrome.runtime.sendMessage({
        action: 'analyzeContent',
        content: content
    }, response => {
        if (chrome.runtime.lastError) {
            console.error('Error sending message:', chrome.runtime.lastError);
        } else {
            console.log('Message sent successfully:', response);
        }
    });
};

// Show a subtle notification overlay
const showNotificationOverlay = () => {
    const overlay = document.createElement('div');
    overlay.id = 'tc-analyzer-overlay';
    overlay.innerHTML = 'T&C Analysis Available';
    overlay.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 10px;
        border-radius: 5px;
        z-index: 9999;
        font-family: Arial, sans-serif;
        font-size: 14px;
    `;
    document.body.appendChild(overlay);

    // Remove the overlay after 5 seconds
    setTimeout(() => overlay.remove(), 5000);
};

// Find Terms & Conditions and Privacy Policy links on the page
const findTCLinks = () => {
    const links = Array.from(document.getElementsByTagName('a'));
    return links.filter(link => {
        const href = link.href.toLowerCase();
        const text = link.textContent.toLowerCase();
        return TC_PATTERNS.some(pattern => href.includes(pattern)) ||
               PRIVACY_PATTERNS.some(pattern => href.includes(pattern)) ||
               LINK_TEXT_PATTERNS.some(pattern => text.includes(pattern));
    });
};

// Add visual indicators for T&C links
const addVisualIndicators = (links) => {
    links.forEach(link => {
        const indicator = document.createElement('span');
        indicator.innerHTML = '📜';
        indicator.title = 'Terms & Conditions or Privacy Policy detected';
        indicator.style.cssText = `
            display: inline-block;
            margin-left: 5px;
            cursor: pointer;
        `;
        link.parentNode.insertBefore(indicator, link.nextSibling);

        indicator.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // TODO: Implement analysis action when clicked
            console.log('Analyze link:', link.href);
        });
    });
};

// Debounce function to limit API calls
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
};

// Initialize the content script with debounce to avoid overwhelming the API
const debouncedInit = debounce(init, 1000);

// Run the initialization
debouncedInit();

// Listen for dynamic content changes
const observer = new MutationObserver(debouncedInit);
observer.observe(document.body, { childList: true, subtree: true });