// Publiczne GraphQL API Birdweather — wymaga tylko numerycznego ID stacji, bez tokenu
const STATION_ID = '8334';
const LOCALE = 'pl';
const GRAPHQL_URL = 'https://app.birdweather.com/graphql';
const REFRESH_MS = 30000;
const TOP_LIMIT = 10;
const DETECTIONS_PER_QUERY = 3;
const PLACEHOLDER = 'placeholder.jpg';

const RANGES = {
  '24h': { count: 24, unit: 'hour' },
  'week': { count: 7, unit: 'day' },
  'month': { count: 30, unit: 'day' }
};

const SPECIES_FIELDS = `
  id
  commonName
  scientificName
  thumbnailUrl
  translations(locale: "${LOCALE}") { commonName }
`;

const LATEST_QUERY = `
  query($id: ID!) {
    station(id: $id) {
      detections(first: 1) {
        nodes { id timestamp species { ${SPECIES_FIELDS} } }
      }
    }
  }
`;

const TOP_QUERY = `
  query($id: ID!, $period: InputDuration, $limit: Int) {
    station(id: $id) {
      topSpecies(limit: $limit, period: $period) {
        count
        species { ${SPECIES_FIELDS} }
      }
    }
  }
`;

let currentTab = '24h';
let lastDetectionId = null;
let lastTableKey = null;
let topController = null;
let refreshTimer = null;

async function gql(query, variables, signal) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    signal
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors.map(e => e.message).join('; '));
  }
  return json.data;
}

function speciesName(species) {
  if (!species) return 'Nieznany ptak';
  const tr = species.translations && species.translations[0];
  return (tr && tr.commonName) || species.commonName;
}

function wikipediaUrl(species) {
  // Nazwa łacińska trafia w artykuł pewniej niż zwyczajowa (przekierowania na pl.wiki)
  const title = species.scientificName || speciesName(species);
  return `https://pl.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
}

function formatTime(timestamp) {
  return timestamp ? new Date(timestamp).toLocaleString('pl-PL') : 'Data nieznana';
}

async function fetchLastDetection() {
  const data = await gql(LATEST_QUERY, { id: STATION_ID });
  const det = data.station.detections.nodes[0];
  if (!det) return false;
  if (det.id === lastDetectionId) return false;

  lastDetectionId = det.id;
  const name = speciesName(det.species);

  document.querySelector('#bird-name span').textContent = name;
  document.querySelector('#bird-detection-time span').textContent = formatTime(det.timestamp);

  const img = document.getElementById('bird-image');
  img.src = (det.species && det.species.thumbnailUrl) || PLACEHOLDER;
  img.alt = name;
  document.getElementById('bird-link').href = det.species ? wikipediaUrl(det.species) : '#';
  return true;
}

function renderSpeciesTable(rows) {
  const tbody = document.getElementById('species-table-body');
  tbody.innerHTML = '';

  if (!rows || rows.length === 0) {
    const row = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.className = 'empty-message';
    td.textContent = 'Brak danych dla wybranego okresu';
    row.appendChild(td);
    tbody.appendChild(row);
    return;
  }

  rows.forEach(({ species, count, latest }) => {
    const tr = document.createElement('tr');
    const name = speciesName(species);

    // thumbnail cell
    const tdImg = document.createElement('td');
    const link = document.createElement('a');
    link.href = wikipediaUrl(species);
    link.target = '_blank';
    link.rel = 'noopener';
    const img = document.createElement('img');
    img.src = species.thumbnailUrl || PLACEHOLDER;
    img.alt = name;
    img.loading = 'lazy';
    link.appendChild(img);
    tdImg.appendChild(link);
    tr.appendChild(tdImg);

    // name cell
    const tdName = document.createElement('td');
    tdName.textContent = name;
    tr.appendChild(tdName);

    // count cell
    const tdCount = document.createElement('td');
    tdCount.textContent = count;
    tr.appendChild(tdCount);

    // last detection cell
    const tdLast = document.createElement('td');
    tdLast.textContent = formatTime(latest);
    tr.appendChild(tdLast);

    tbody.appendChild(tr);
  });
}

function renderTableError() {
  const tbody = document.getElementById('species-table-body');
  // Przy błędzie odświeżenia zostawiamy poprzednie dane, jeśli jakieś są
  if (lastTableKey !== null) return;
  tbody.innerHTML = '<tr><td colspan="4" class="empty-message">Nie udało się pobrać danych</td></tr>';
}

async function fetchTopSpecies() {
  // Anulujemy poprzednie zapytanie, żeby wolna odpowiedź dla starej zakładki nie nadpisała nowej
  if (topController) topController.abort();
  const controller = new AbortController();
  topController = controller;
  const tab = currentTab;

  try {
    const data = await gql(
      TOP_QUERY,
      { id: STATION_ID, period: RANGES[tab], limit: TOP_LIMIT },
      controller.signal
    );
    const top = data.station.topSpecies;

    // Ostatnie wykrycie dla każdego gatunku — zapytania z aliasami, API przyjmuje
    // max DETECTIONS_PER_QUERY pól detections w jednym zapytaniu
    const chunks = [];
    for (let i = 0; i < top.length; i += DETECTIONS_PER_QUERY) {
      const fields = top.slice(i, i + DETECTIONS_PER_QUERY).map((t, j) =>
        `s${i + j}: detections(first: 1, speciesId: "${t.species.id}") { nodes { timestamp } }`
      ).join('\n');
      chunks.push(gql(
        `query($id: ID!) { station(id: $id) { ${fields} } }`,
        { id: STATION_ID },
        controller.signal
      ));
    }
    const latest = Object.assign({}, ...(await Promise.all(chunks)).map(d => d.station));

    if (controller !== topController) return;

    const rows = top.map((t, i) => ({
      species: t.species,
      count: t.count,
      latest: latest[`s${i}`] && latest[`s${i}`].nodes[0] ? latest[`s${i}`].nodes[0].timestamp : null
    }));

    // Przebudowujemy tabelę tylko gdy dane faktycznie się zmieniły (bez mrugania miniatur)
    const key = tab + JSON.stringify(rows.map(r => [r.species.id, r.count, r.latest]));
    if (key === lastTableKey) return;
    lastTableKey = key;
    renderSpeciesTable(rows);
  } catch (err) {
    if (err.name === 'AbortError') return;
    console.error('Błąd zapytania o gatunki:', err);
    renderTableError();
  } finally {
    if (controller === topController) topController = null;
  }
}

function setActiveTab(range) {
  if (range === currentTab) return;
  currentTab = range;
  lastTableKey = null;

  document.querySelectorAll('.tab-button').forEach(btn => {
    const active = btn.dataset.range === range;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active);
  });

  fetchTopSpecies();
}

async function refreshData() {
  try {
    const changed = await fetchLastDetection();
    // Ranking zmienia się tylko po nowym wykryciu
    if (changed) fetchTopSpecies();
  } catch (err) {
    console.error('Błąd zapytania o ostatnie wykrycie:', err);
  }
}

function startPolling() {
  stopPolling();
  refreshData();
  refreshTimer = setInterval(refreshData, REFRESH_MS);
}

function stopPolling() {
  clearInterval(refreshTimer);
  refreshTimer = null;
}

// Init
document.querySelectorAll('.tab-button').forEach(btn => {
  btn.addEventListener('click', () => setActiveTab(btn.dataset.range));
});

// Nie odpytujemy API, gdy karta/iframe jest niewidoczna
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    startPolling();
  } else {
    stopPolling();
  }
});

startPolling();
