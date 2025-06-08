document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('optionsForm');
    const viewHistoryBtn = document.getElementById('viewHistory');
    const exportDataBtn = document.getElementById('exportData');
    const clearCacheBtn = document.getElementById('clearCache');

    // Load saved preferences
    loadPreferences();

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        savePreferences();
    });

    // View History
    viewHistoryBtn.addEventListener('click', viewHistory);

    // Export Data
    exportDataBtn.addEventListener('click', exportData);

    // Clear Cache
    clearCacheBtn.addEventListener('click', clearCache);

    // Australian postcode validation
    const postcodeInput = document.getElementById('postcode');
    postcodeInput.addEventListener('input', validatePostcode);
});

function loadPreferences() {
    chrome.storage.sync.get([
        'postcode',
        'contactMethod',
        'sensitivity',
        'concerns',
        'notifications',
        'dataRetention',
        'optOut'
    ], (result) => {
        document.getElementById('postcode').value = result.postcode || '';
        document.getElementById('contactMethod').value = result.contactMethod || 'email';
        document.getElementById('sensitivity').value = result.sensitivity || 'moderate';
        document.getElementById('notifications').value = result.notifications || 'all';
        document.getElementById('dataRetention').value = result.dataRetention || '90';
        document.getElementById('optOut').checked = result.optOut || false;

        const concerns = result.concerns || ['privacyAct'];
        concerns.forEach(concern => {
            document.getElementById(concern).checked = true;
        });
    });
}

function savePreferences() {
    const postcode = document.getElementById('postcode').value;
    const contactMethod = document.getElementById('contactMethod').value;
    const sensitivity = document.getElementById('sensitivity').value;
    const notifications = document.getElementById('notifications').value;
    const dataRetention = document.getElementById('dataRetention').value;
    const optOut = document.getElementById('optOut').checked;

    const concerns = Array.from(document.querySelectorAll('input[name="concerns"]:checked'))
        .map(el => el.value);

    chrome.storage.sync.set({
        postcode,
        contactMethod,
        sensitivity,
        concerns,
        notifications,
        dataRetention,
        optOut
    }, () => {
        alert('Preferences saved successfully!');
    });
}

function validatePostcode() {
    const postcodeInput = document.getElementById('postcode');
    const postcode = postcodeInput.value;
    const isValid = /^[0-9]{4}$/.test(postcode);

    if (isValid) {
        postcodeInput.setCustomValidity('');
    } else {
        postcodeInput.setCustomValidity('Please enter a valid 4-digit Australian postcode');
    }
}

function viewHistory() {
    chrome.storage.local.get('analysisHistory', (result) => {
        const history = result.analysisHistory || [];
        if (history.length === 0) {
            alert('No analysis history available.');
        } else {
            // For simplicity, we're just alerting the history.
            // In a real-world scenario, you'd want to display this in a more user-friendly way.
            alert(JSON.stringify(history, null, 2));
        }
    });
}

function exportData() {
    chrome.storage.sync.get(null, (preferences) => {
        chrome.storage.local.get('analysisHistory', (history) => {
            const data = {
                preferences,
                analysisHistory: history.analysisHistory || []
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            chrome.downloads.download({
                url: url,
                filename: 'tc_analyzer_data.json'
            });
        });
    });
}

function clearCache() {
    if (confirm('Are you sure you want to clear all cached analyses? This action cannot be undone.')) {
        chrome.storage.local.remove('analysisHistory', () => {
            alert('Cached analyses have been cleared.');
        });
    }
}