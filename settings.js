const STORAGE_KEYS = {
  apiKey: 'metlinkApiKey',
  stopNamePrefix: 'metlinkStopName',
  stopIdPrefix: 'metlinkStopId'
};

const MAX_STOPS = 5;

const settingsForm = document.getElementById('settingsForm');
const saveMessage = document.getElementById('saveMessage');
const resetButton = document.getElementById('resetButton');

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        return undefined;
      });
    });
  }
}

function loadSettings() {
  document.getElementById('apiKey').value = localStorage.getItem(STORAGE_KEYS.apiKey) || '';

  for (let index = 1; index <= MAX_STOPS; index += 1) {
    document.getElementById(`stopName${index}`).value = localStorage.getItem(`${STORAGE_KEYS.stopNamePrefix}${index}`) || '';
    document.getElementById(`stopId${index}`).value = localStorage.getItem(`${STORAGE_KEYS.stopIdPrefix}${index}`) || '';
  }
}

function saveSettings(event) {
  event.preventDefault();

  localStorage.setItem(STORAGE_KEYS.apiKey, document.getElementById('apiKey').value.trim());

  for (let index = 1; index <= MAX_STOPS; index += 1) {
    localStorage.setItem(`${STORAGE_KEYS.stopNamePrefix}${index}`, document.getElementById(`stopName${index}`).value.trim());
    localStorage.setItem(`${STORAGE_KEYS.stopIdPrefix}${index}`, document.getElementById(`stopId${index}`).value.trim());
  }

  saveMessage.textContent = 'Saved. Return to the main page to refresh arrivals.';
  saveMessage.className = 'status status-subtle status-ok';
}

function clearSettings() {
  localStorage.removeItem(STORAGE_KEYS.apiKey);

  for (let index = 1; index <= MAX_STOPS; index += 1) {
    localStorage.removeItem(`${STORAGE_KEYS.stopNamePrefix}${index}`);
    localStorage.removeItem(`${STORAGE_KEYS.stopIdPrefix}${index}`);
  }

  settingsForm.reset();
  saveMessage.textContent = 'Cleared all saved settings.';
  saveMessage.className = 'status status-subtle';
}

settingsForm.addEventListener('submit', saveSettings);
resetButton.addEventListener('click', clearSettings);

registerServiceWorker();
loadSettings();
