const TOKEN = 'hLd2SmS16HxaZFzKjeghR75u';
const LOCALE = 'pl';
const BASE_URL = 'https://app.birdweather.com/api/v1/stations/';
const DETECTIONS_URL = `${BASE_URL}${TOKEN}/detections?locale=${LOCALE}&limit=1`;
const SPECIES_URL = `${BASE_URL}${TOKEN}/species?locale=${LOCALE}&limit=10`;

function openWikipediaPage(name) {
  const url = `https://pl.wikipedia.org/wiki/${encodeURIComponent(name)}`;
  window.open(url, '_blank');
}

async function fetchLastDetection() {
  try {
    const res = await fetch(DETECTIONS_URL, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    const data = await res.json();

    if (data.success && data.detections && data.detections.length > 0) {
      const det = data.detections[0];
      const name = det.species ? det.species.commonName : 'Nieznany ptak';
      const time = det.timestamp
        ? new Date(det.timestamp).toLocaleString('pl-PL')
        : 'Data nieznana';
      const imgUrl = det.species && det.species.imageUrl
        ? det.species.imageUrl
        : 'placeholder.jpg';

      document.querySelector('#bird-name span').textContent = name;
      document.querySelector('#bird-detection-time span').textContent = time;

      const img = document.getElementById('bird-image');
      img.src = imgUrl;
      img.alt = name;
      img.onclick = () => openWikipediaPage(name);
    } else {
      console.error('Nie udało się pobrać danych o ostatnim wykryciu:', data);
    }
  } catch (err) {
    console.error('Błąd zapytania o ostatnie wykrycie:', err);
  }
}

function renderSpeciesTable(species) {
  const tbody = document.getElementById('species-table-body');
  tbody.innerHTML = '';

  if (!species || species.length === 0) {
    const row = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.className = 'empty-message';
    td.textContent = 'Brak danych dla wybranego okresu';
    row.appendChild(td);
    tbody.appendChild(row);
    return;
  }

  species.forEach(s => {
    const tr = document.createElement('tr');

    // thumbnail cell
    const tdImg = document.createElement('td');
    const img = document.createElement('img');
    img.src = s.thumbnailUrl || 'placeholder.jpg';
    img.alt = s.commonName;
    img.style.cursor = 'pointer';
    img.onclick = () => openWikipediaPage(s.commonName);
    tdImg.appendChild(img);
    tr.appendChild(tdImg);

    // name cell
    const tdName = document.createElement('td');
    tdName.textContent = s.commonName;
    tr.appendChild(tdName);

    // count cell
    const tdCount = document.createElement('td');
    tdCount.textContent = s.detections.total;
    tr.appendChild(tdCount);

    // last detection cell
    const tdLast = document.createElement('td');
    tdLast.textContent = new Date(s.latestDetectionAt).toLocaleString('pl-PL');
    tr.appendChild(tdLast);

    tbody.appendChild(tr);
  });
}

async function fetchTopSpecies(since) {
  try {
    let url = SPECIES_URL;
    if (since) {
      url += `&since=${since}`;
    }
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    const data = await res.json();

    if (data.success && data.species) {
      renderSpeciesTable(data.species);
    } else {
      console.error('Błąd pobierania gatunków:', data);
      renderSpeciesTable([]);
    }
  } catch (err) {
    console.error('Błąd zapytania o gatunki:', err);
    renderSpeciesTable([]);
  }
}

const RANGES = {
  '24h': () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  'week': () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  'month': () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
};

let currentTab = '24h';

function setActiveTab(range) {
  currentTab = range;

  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.range === range);
  });

  const since = RANGES[range]();
  fetchTopSpecies(since);
}

function refreshData() {
  fetchLastDetection();
  const since = RANGES[currentTab]();
  fetchTopSpecies(since);
}

// Init
document.querySelectorAll('.tab-button').forEach(btn => {
  btn.addEventListener('click', () => setActiveTab(btn.dataset.range));
});

setInterval(refreshData, 10000);
refreshData();