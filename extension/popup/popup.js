// DOM Elements
const statusMessage = document.getElementById('statusMessage');
const summaryContent = document.getElementById('summaryContent');
const resultsContent = document.getElementById('resultsContent');
const analyzeBtn = document.getElementById('analyzeBtn');
const emailBtn = document.getElementById('emailBtn');
const settingsBtn = document.getElementById('settingsBtn');

// State
let currentAnalysis = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  updateUI('loading');
  try {
    const tab = await getCurrentTab();
    const analysis = await getAnalysisForTab(tab.url);
    if (analysis) {
      currentAnalysis = analysis;
      updateUI('analyzed', analysis);
    } else {
      updateUI('not_found');
    }
  } catch (error) {
    console.error('Initialization error:', error);
    updateUI('error', error.message);
  }
});

// Event Listeners
analyzeBtn.addEventListener('click', handleAnalyze);
emailBtn.addEventListener('click', handleEmailRepresentative);
settingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());

// Handle analyze button click
async function handleAnalyze() {
  updateUI('loading');
  try {
    const tab = await getCurrentTab();
    const analysis = await triggerAnalysis(tab.url);
    currentAnalysis = analysis;
    updateUI('analyzed', analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    updateUI('error', error.message);
  }
}

// Handle email representative button click
async function handleEmailRepresentative() {
  const prefs = await chrome.storage.sync.get('userPreferences');
  const emailAddress = prefs.userPreferences?.emailRepresentative || '';
  
  if (!emailAddress) {
    alert('Please set your representative\'s email in the settings first.');
    return;
  }

  const subject = encodeURIComponent('Concerns about Terms and Conditions');
  const body = encodeURIComponent(`Dear Representative,

I have concerns about the following Terms and Conditions:

${currentAnalysis.url}

Key issues:
${currentAnalysis.keyConcerns.join('\n')}

Please investigate this matter.

Thank you.`);

  window.open(`mailto:${emailAddress}?subject=${subject}&body=${body}`);
}

// Get current active tab
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Get analysis for the current tab
async function getAnalysisForTab(url) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getAnalysis', url }, (response) => {
      resolve(response.analysis);
    });
  });
}

// Trigger analysis for the current tab
async function triggerAnalysis(url) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'analyzeContent', url }, (response) => {
      if (response.success) {
        resolve(response.analysis);
      } else {
        reject(new Error(response.error));
      }
    });
  });
}

// Update UI based on state
function updateUI(state, data) {
  statusMessage.textContent = getStatusMessage(state);
  summaryContent.innerHTML = '';
  resultsContent.innerHTML = '';

  switch (state) {
    case 'loading':
      analyzeBtn.disabled = true;
      emailBtn.disabled = true;
      summaryContent.innerHTML = '<p>Analyzing...</p>';
      break;
    case 'analyzed':
      analyzeBtn.disabled = false;
      emailBtn.disabled = false;
      displayAnalysisResults(data);
      break;
    case 'not_found':
      analyzeBtn.disabled = false;
      emailBtn.disabled = true;
      summaryContent.innerHTML = '<p>No Terms & Conditions found on this page.</p>';
      break;
    case 'error':
      analyzeBtn.disabled = false;
      emailBtn.disabled = true;
      summaryContent.innerHTML = `<p class="error">Error: ${data}</p>`;
      break;
  }
}

// Get status message based on state
function getStatusMessage(state) {
  switch (state) {
    case 'loading': return 'Analyzing...';
    case 'analyzed': return 'Analysis Complete';
    case 'not_found': return 'No T&C Found';
    case 'error': return 'Error';
    default: return 'Ready to Analyze';
  }
}

// Display analysis results
function displayAnalysisResults(analysis) {
  const riskClass = getRiskClass(analysis.riskScore);
  
  summaryContent.innerHTML = `
    <p class="risk-score ${riskClass}">Risk Score: ${analysis.riskScore}</p>
    <h3>Key Concerns:</h3>
    <ul>
      ${analysis.keyConcerns.map(concern => `<li>${concern}</li>`).join('')}
    </ul>
  `;

  resultsContent.innerHTML = `
    <h3>Simplified Explanation:</h3>
    <p>${analysis.simplifiedExplanation}</p>
    <h3>Data Usage and Sharing:</h3>
    <p>${analysis.dataUsage}</p>
    <button id="fullReportBtn" class="secondary-btn">View Full Report</button>
  `;

  document.getElementById('fullReportBtn').addEventListener('click', () => {
    // TODO: Implement full report view
    alert('Full report view not implemented yet.');
  });
}

// Get CSS class based on risk score
function getRiskClass(score) {
  if (score < 3) return 'low-risk';
  if (score < 7) return 'medium-risk';
  return 'high-risk';
}

// Add smooth transitions
function addTransitions() {
  document.body.style.transition = 'opacity 0.3s ease-in-out';
  document.body.style.opacity = '0';
  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 50);
}

// Call this function before any major UI update
function transitionUI(updateFunction) {
  document.body.style.opacity = '0';
  setTimeout(() => {
    updateFunction();
    document.body.style.opacity = '1';
  }, 300);
}