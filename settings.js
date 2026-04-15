const STORAGE_KEYS = {
  apiKey: 'metlinkApiKey',
  stopFilterPrefix: 'metlinkStopFilter',
  stopNamePrefix: 'metlinkStopName',
  stopIdPrefix: 'metlinkStopId'
};

const settingsForm = document.getElementById('settingsForm');
const saveMessage = document.getElementById('saveMessage');
const resetButton = document.getElementById('resetButton');
const stopsFields = document.getElementById('stopsFields');
const addStopButton = document.getElementById('addStopButton');

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getStoredValue(key) {
  try {
    const value = localStorage.getItem(key);
    return typeof value === 'string' ? value.trim() : '';
  } catch (_error) {
    return '';
  }
}

function getStoredStopIndexes() {
  const indexes = new Set();
  const prefixPattern = new RegExp(`^(?:${STORAGE_KEYS.stopNamePrefix}|${STORAGE_KEYS.stopIdPrefix})(\\d+)$`);

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    const match = key && key.match(prefixPattern);

    if (match) {
      indexes.add(Number.parseInt(match[1], 10));
    }
  }

  return Array.from(indexes).filter(Number.isInteger).sort((left, right) => left - right);
}

function getStopRows() {
  return Array.from(stopsFields.querySelectorAll('.stop-form-row'));
}

function updateStopRowControls() {
  const rows = getStopRows();

  rows.forEach((row, index) => {
    const position = index + 1;
    const nameInput = row.querySelector('.stop-name-input');
    const stopIdInput = row.querySelector('.stop-id-input');
    const nameLabel = row.querySelector('.stop-name-label');
    const stopIdLabel = row.querySelector('.stop-id-label');

    row.querySelector('.stop-form-title').textContent = `Stop ${position}`;
    nameInput.id = `stopName${position}`;
    nameInput.name = `stopName${position}`;
    stopIdInput.id = `stopId${position}`;
    stopIdInput.name = `stopId${position}`;
    nameLabel.htmlFor = nameInput.id;
    stopIdLabel.htmlFor = stopIdInput.id;
    row.querySelector('.move-up-button').disabled = index === 0;
    row.querySelector('.move-down-button').disabled = index === rows.length - 1;
    row.querySelector('.remove-stop-button').disabled = rows.length === 1;
  });
}

function createStopRow(stop = {}) {
  const row = document.createElement('div');
  row.className = 'stop-form-row';
  row.innerHTML = `
    <div class="stop-form-header">
      <h2 class="stop-form-title">Stop</h2>
      <div class="stop-form-actions" aria-label="Stop actions">
        <button class="button button-secondary stop-action-button move-up-button" type="button">Move up</button>
        <button class="button button-secondary stop-action-button move-down-button" type="button">Move down</button>
        <button class="button button-secondary stop-action-button remove-stop-button" type="button">Remove</button>
      </div>
    </div>
    <label class="field-label stop-name-label">Stop name</label>
    <input class="text-input stop-name-input" type="text" autocomplete="off" value="${escapeAttribute(stop.name || '')}">
    <label class="field-label stop-id-label">Stop ID</label>
    <input class="text-input stop-id-input" type="text" autocomplete="off" spellcheck="false" value="${escapeAttribute(stop.stopId || '')}">
    <label class="field-label stop-filter-label">Optional filter</label>
    <input class="text-input stop-filter-input" type="text" autocomplete="off" spellcheck="false" placeholder="27, Well, Mell" value="${escapeAttribute(stop.filter || '')}">
    <p class="helper-text">Optional comma-separated words or numbers. This stop only shows when the API stop name contains one of them.</p>
  `;

  return row;
}

function addStopRow(stop = {}, shouldFocus = false) {
  const row = createStopRow(stop);
  stopsFields.appendChild(row);
  updateStopRowControls();

  if (shouldFocus) {
    row.querySelector('.stop-name-input').focus();
  }
}

function renderStoredStops() {
  const stopIndexes = getStoredStopIndexes();
  const stops = stopIndexes.map((index) => ({
    name: getStoredValue(`${STORAGE_KEYS.stopNamePrefix}${index}`),
    stopId: getStoredValue(`${STORAGE_KEYS.stopIdPrefix}${index}`),
    filter: getStoredValue(`${STORAGE_KEYS.stopFilterPrefix}${index}`)
  }));

  stopsFields.innerHTML = '';

  if (stops.length === 0) {
    addStopRow();
    return;
  }

  stops.forEach((stop) => addStopRow(stop));
}

function getStopValues() {
  return getStopRows().map((row) => ({
    name: row.querySelector('.stop-name-input').value.trim(),
    stopId: row.querySelector('.stop-id-input').value.trim(),
    filter: row.querySelector('.stop-filter-input').value.trim()
  }));
}

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
  document.getElementById('apiKey').value = getStoredValue(STORAGE_KEYS.apiKey);
  renderStoredStops();
}

function saveSettings(event) {
  event.preventDefault();

  const stops = getStopValues();
  const existingIndexes = getStoredStopIndexes();

  localStorage.setItem(STORAGE_KEYS.apiKey, document.getElementById('apiKey').value.trim());
  localStorage.removeItem('metlinkStopFilter');

  stops.forEach((stop, index) => {
    const keyIndex = index + 1;
    localStorage.setItem(`${STORAGE_KEYS.stopNamePrefix}${keyIndex}`, stop.name);
    localStorage.setItem(`${STORAGE_KEYS.stopIdPrefix}${keyIndex}`, stop.stopId);
    localStorage.setItem(`${STORAGE_KEYS.stopFilterPrefix}${keyIndex}`, stop.filter);
  });

  existingIndexes.forEach((index) => {
    if (index > stops.length) {
      localStorage.removeItem(`${STORAGE_KEYS.stopNamePrefix}${index}`);
      localStorage.removeItem(`${STORAGE_KEYS.stopIdPrefix}${index}`);
      localStorage.removeItem(`${STORAGE_KEYS.stopFilterPrefix}${index}`);
    }
  });

  saveMessage.textContent = 'Saved. Return to the main page to refresh arrivals.';
  saveMessage.className = 'status status-subtle status-ok';
}

function clearSettings() {
  localStorage.removeItem(STORAGE_KEYS.apiKey);
  localStorage.removeItem('metlinkStopFilter');

  getStoredStopIndexes().forEach((index) => {
    localStorage.removeItem(`${STORAGE_KEYS.stopNamePrefix}${index}`);
    localStorage.removeItem(`${STORAGE_KEYS.stopIdPrefix}${index}`);
    localStorage.removeItem(`${STORAGE_KEYS.stopFilterPrefix}${index}`);
  });

  settingsForm.reset();
  renderStoredStops();
  saveMessage.textContent = 'Cleared all saved settings.';
  saveMessage.className = 'status status-subtle';
}

stopsFields.addEventListener('click', (event) => {
  const button = event.target.closest('button');

  if (!button) {
    return;
  }

  const row = button.closest('.stop-form-row');
  if (!row) {
    return;
  }

  if (button.classList.contains('move-up-button')) {
    const previousRow = row.previousElementSibling;
    if (previousRow) {
      stopsFields.insertBefore(row, previousRow);
      updateStopRowControls();
    }
  }

  if (button.classList.contains('move-down-button')) {
    const nextRow = row.nextElementSibling;
    if (nextRow) {
      stopsFields.insertBefore(nextRow, row);
      updateStopRowControls();
    }
  }

  if (button.classList.contains('remove-stop-button') && getStopRows().length > 1) {
    row.remove();
    updateStopRowControls();
  }
});

addStopButton.addEventListener('click', () => {
  addStopRow({}, true);
});

settingsForm.addEventListener('submit', saveSettings);
resetButton.addEventListener('click', clearSettings);

registerServiceWorker();
loadSettings();
