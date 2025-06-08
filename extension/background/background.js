// Constants
const API_BASE_URL = 'https://your-backend-api.com';
const API_RATE_LIMIT = 5; // requests per minute
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Initialize rate limiting
let requestCount = 0;
let lastRequestTime = Date.now();

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeContent') {
    analyzeDocument(request.content, sender.tab.url)
      .then(analysis => {
        sendResponse({ success: true, analysis });
        updateBadge('done');
      })
      .catch(error => {
        console.error('Analysis error:', error);
        sendResponse({ success: false, error: error.message });
        updateBadge('error');
      });
    return true; // Indicates that the response is sent asynchronously
  }
});

// Analyze document
async function analyzeDocument(text, url) {
  // Check cache first
  const cachedAnalysis = await getCachedAnalysis(url);
  if (cachedAnalysis) {
    return cachedAnalysis;
  }

  // Rate limiting check
  if (!checkRateLimit()) {
    throw new Error('API rate limit exceeded. Please try again later.');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, url }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const analysis = await response.json();
    await cacheAnalysis(url, analysis);
    return analysis;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

// Cache analysis results
async function cacheAnalysis(url, analysis) {
  const cache = await chrome.storage.local.get('analysisCache') || {};
  cache.analysisCache = cache.analysisCache || {};
  cache.analysisCache[url] = {
    timestamp: Date.now(),
    data: analysis,
  };
  await chrome.storage.local.set(cache);
}

// Get cached analysis
async function getCachedAnalysis(url) {
  const cache = await chrome.storage.local.get('analysisCache');
  const cachedItem = cache.analysisCache && cache.analysisCache[url];
  if (cachedItem && (Date.now() - cachedItem.timestamp < CACHE_EXPIRATION)) {
    return cachedItem.data;
  }
  return null;
}

// Update badge
function updateBadge(status) {
  let text = '';
  let color = [0, 0, 0, 0];

  switch (status) {
    case 'analyzing':
      text = '...';
      color = [255, 165, 0, 255]; // Orange
      break;
    case 'done':
      text = '✓';
      color = [0, 255, 0, 255]; // Green
      break;
    case 'error':
      text = '!';
      color = [255, 0, 0, 255]; // Red
      break;
  }

  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
}

// Check API rate limit
function checkRateLimit() {
  const now = Date.now();
  if (now - lastRequestTime > 60000) { // 1 minute
    requestCount = 0;
    lastRequestTime = now;
  }

  if (requestCount >= API_RATE_LIMIT) {
    return false;
  }

  requestCount++;
  return true;
}

// Handle user preferences
async function getUserPreferences() {
  const prefs = await chrome.storage.sync.get('userPreferences');
  return prefs.userPreferences || {};
}

async function setUserPreferences(preferences) {
  await chrome.storage.sync.set({ userPreferences: preferences });
}

// Handle analysis history
async function addToAnalysisHistory(url, summary) {
  const history = await chrome.storage.local.get('analysisHistory');
  history.analysisHistory = history.analysisHistory || [];
  history.analysisHistory.unshift({ url, summary, timestamp: Date.now() });
  
  // Keep only the last 50 entries
  if (history.analysisHistory.length > 50) {
    history.analysisHistory = history.analysisHistory.slice(0, 50);
  }
  
  await chrome.storage.local.set(history);
}

async function getAnalysisHistory() {
  const history = await chrome.storage.local.get('analysisHistory');
  return history.analysisHistory || [];
}

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  // Set default user preferences
  const defaultPreferences = {
    notificationsEnabled: true,
    emailRepresentative: '',
  };
  await setUserPreferences(defaultPreferences);

  // Clear old cache and history
  await chrome.storage.local.clear();
});

// Listen for tab updates to reset badge
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    updateBadge('');
  }
});