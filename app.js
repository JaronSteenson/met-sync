const STORAGE_KEYS = {
  apiKey: 'metlinkApiKey',
  stopNamePrefix: 'metlinkStopName',
  stopIdPrefix: 'metlinkStopId'
};

const MAX_STOPS = 5;
const MAX_ARRIVALS = 2;
const API_BASE_URL = 'https://api.opendata.metlink.org.nz/v1/stop-predictions';
const NZ_TIMEZONE = 'Pacific/Auckland';

const refreshButton = document.getElementById('refreshButton');
const statusMessage = document.getElementById('statusMessage');
const lastUpdated = document.getElementById('lastUpdated');
const stopsContainer = document.getElementById('stopsContainer');
const setupMessage = document.getElementById('setupMessage');

const timeFormatter = new Intl.DateTimeFormat('en-NZ', {
  timeZone: NZ_TIMEZONE,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
});

const timestampFormatter = new Intl.DateTimeFormat('en-NZ', {
  timeZone: NZ_TIMEZONE,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  day: 'numeric',
  month: 'short'
});

function getStoredValue(key) {
  try {
    const value = localStorage.getItem(key);
    return typeof value === 'string' ? value.trim() : '';
  } catch (_error) {
    return '';
  }
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
  const apiKey = getStoredValue(STORAGE_KEYS.apiKey);
  const stops = [];
  let hasConfiguredStop = false;

  for (let index = 1; index <= MAX_STOPS; index += 1) {
    const name = getStoredValue(`${STORAGE_KEYS.stopNamePrefix}${index}`);
    const stopId = getStoredValue(`${STORAGE_KEYS.stopIdPrefix}${index}`);

    if (name || stopId) {
      hasConfiguredStop = true;
    }

    if (name && stopId) {
      stops.push({ name, stopId });
    }
  }

  return { apiKey, stops, hasConfiguredStop };
}

function getExpectedTime(arrival) {
  if (!arrival) {
    return null;
  }

  return (
    (arrival.arrival && arrival.arrival.expected) ||
    (arrival.departure && arrival.departure.expected) ||
    arrival.expected ||
    arrival.expected_arrival_time ||
    arrival.expected_departure_time ||
    null
  );
}

function getPlannedTime(arrival) {
  if (!arrival) {
    return null;
  }

  return (
    (arrival.arrival && arrival.arrival.aimed) ||
    (arrival.departure && arrival.departure.aimed) ||
    arrival.planned ||
    arrival.aimed ||
    arrival.planned_arrival_time ||
    arrival.planned_departure_time ||
    arrival.scheduled_time ||
    null
  );
}

function getSortTime(arrival) {
  const value = getExpectedTime(arrival) || getPlannedTime(arrival);
  const timestamp = value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
}

function getArrivalsFromPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  const candidates = [
    payload && payload.departures,
    payload && payload.services,
    payload && payload.items,
    payload && payload.results,
    payload && payload.data
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function formatTime(value, fallbackText) {
  if (!value) {
    return fallbackText;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallbackText;
  }

  return timeFormatter.format(date).replace(/\s?(am|pm)/i, (_, meridiem) => meridiem.toLowerCase());
}

function getServiceLabel(arrival) {
  if (!arrival) {
    return 'Service';
  }

  const route = (
    (arrival.route && arrival.route.short_name) ||
    arrival.route_short_name ||
    arrival.route_id ||
    arrival.service_id ||
    ''
  ).toString().trim();

  const destination = (
    (arrival.destination && arrival.destination.name) ||
    arrival.trip_headsign ||
    arrival.headsign ||
    arrival.destination_name ||
    arrival.direction_name ||
    ''
  ).toString().trim();

  if (route && destination) {
    return `${route} ${destination}`;
  }

  return route || destination || 'Service';
}

function renderEmptyStop(stop) {
  return `
    <article class="stop-card">
      <header class="stop-card-header">
        <div>
          <h2 class="stop-card-title">${escapeHtml(stop.name)}</h2>
          <p class="stop-card-subtitle">Stop ID ${escapeHtml(stop.stopId)}</p>
        </div>
      </header>
      <p class="stop-state">No upcoming arrivals returned.</p>
    </article>
  `;
}

function renderErrorStop(stop, message) {
  return `
    <article class="stop-card">
      <header class="stop-card-header">
        <div>
          <h2 class="stop-card-title">${escapeHtml(stop.name)}</h2>
          <p class="stop-card-subtitle">Stop ID ${escapeHtml(stop.stopId)}</p>
        </div>
      </header>
      <p class="stop-state">${escapeHtml(message)}</p>
    </article>
  `;
}

function renderStop(stop, arrivals) {
  const rows = arrivals.map((arrival) => {
    const planned = getPlannedTime(arrival);
    const expected = getExpectedTime(arrival) || planned;

    return `
      <li class="arrival-row">
        <span class="arrival-service">${escapeHtml(getServiceLabel(arrival))}</span>
        <span class="arrival-times">
          <span class="arrival-label">Expected</span> ${escapeHtml(formatTime(expected, 'n/a'))}
          <span class="arrival-separator">·</span>
          <span class="arrival-label">Planned</span> ${escapeHtml(formatTime(planned, expected ? formatTime(expected, 'n/a') : 'n/a'))}
        </span>
      </li>
    `;
  }).join('');

  return `
    <article class="stop-card">
      <header class="stop-card-header">
        <div>
          <h2 class="stop-card-title">${escapeHtml(stop.name)}</h2>
          <p class="stop-card-subtitle">Stop ID ${escapeHtml(stop.stopId)}</p>
        </div>
      </header>
      <ul class="arrivals">${rows}</ul>
    </article>
  `;
}

function setStatus(message, className) {
  statusMessage.textContent = message || '';
  statusMessage.className = 'status';
  statusMessage.hidden = !message;

  if (className) {
    statusMessage.classList.add(className);
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function fetchStopArrivals(apiKey, stop) {
  const url = `${API_BASE_URL}?stop_id=${encodeURIComponent(stop.stopId)}&limit=2`;

  const response = await fetch(url, {
    mode: 'cors',
    headers: {
      accept: 'application/json',
      'x-api-key': apiKey
    }
  });

  if (!response.ok) {
    let details = '';

    try {
      const errorPayload = await response.json();
      details = (errorPayload && (errorPayload.message || errorPayload.error)) || '';
    } catch (_error) {
      details = '';
    }

    const suffix = details ? `: ${details}` : '';
    throw new Error(`Request failed (${response.status})${suffix}`);
  }

  const payload = await response.json();
  const arrivals = getArrivalsFromPayload(payload)
    .slice()
    .sort((left, right) => getSortTime(left) - getSortTime(right))
    .slice(0, MAX_ARRIVALS);

  return arrivals;
}

async function refreshStops() {
  const { apiKey, stops, hasConfiguredStop } = loadSettings();

  setupMessage.hidden = Boolean(apiKey && hasConfiguredStop);

  if (!apiKey || stops.length === 0) {
    stopsContainer.innerHTML = '';
    refreshButton.disabled = true;
    setStatus('Add your API key and at least one stop in Settings.', 'status-error');
    lastUpdated.textContent = 'Updated not yet';
    return;
  }

  refreshButton.disabled = true;
  setStatus('Refreshing…');

  const requests = stops.map(async (stop) => {
    try {
      const arrivals = await fetchStopArrivals(apiKey, stop);
      return { stop, arrivals, error: null };
    } catch (error) {
      return { stop, arrivals: [], error: error instanceof Error ? error.message : 'Request failed' };
    }
  });

  const results = await Promise.all(requests);

  stopsContainer.innerHTML = results.map((result) => {
    if (result.error) {
      return renderErrorStop(result.stop, result.error);
    }

    if (result.arrivals.length === 0) {
      return renderEmptyStop(result.stop);
    }

    return renderStop(result.stop, result.arrivals);
  }).join('');

  const successCount = results.filter((result) => !result.error).length;

  if (successCount > 0) {
    lastUpdated.textContent = `Updated ${timestampFormatter.format(new Date())}`;
    if (successCount === results.length) {
      setStatus('');
    } else {
      setStatus('Loaded with some stop errors.', 'status-error');
    }
  } else {
    setStatus('Could not load any stops. Check your API key and stop IDs.', 'status-error');
  }

  refreshButton.disabled = false;
}

refreshButton.addEventListener('click', () => {
  refreshStops();
});

registerServiceWorker();
refreshStops().catch(() => {
  setStatus('The page could not start. Open Settings and save again, then retry.', 'status-error');
  lastUpdated.textContent = 'Updated not yet';
  refreshButton.disabled = false;
});
