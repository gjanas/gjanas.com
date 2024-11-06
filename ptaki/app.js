const token = 'hLd2SmS16HxaZFzKjeghR75u';
const locale = 'pl';
const baseUrl = 'https://app.birdweather.com/api/v1';
const speciesApiUrl = `${baseUrl}/stations/${token}/species`;
const detectionsApiUrl = `${baseUrl}/stations/${token}/detections`;

// Konfiguracja fetch dla Safari
const fetchConfig = {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    mode: 'cors',
    credentials: 'same-origin'
};

function openWikipediaPage(birdName) {
    const wikiUrl = `https://pl.wikipedia.org/wiki/${encodeURIComponent(birdName)}`;
    window.open(wikiUrl, '_blank');
}

function addRippleEffect(element) {
    const ripple = mdc.ripple.MDCRipple.attachTo(element);
    ripple.unbounded = true;
}

async function fetchApi(url, params = {}) {
    try {
        // Dodaj parametry do URL
        const queryString = new URLSearchParams({
            locale,
            ...params
        }).toString();
        const fullUrl = `${url}?${queryString}`;
        
        // Wykonaj zapytanie z pełną konfiguracją
        const response = await fetch(fullUrl, fetchConfig);
        
        // Sprawdź status odpowiedzi
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Spróbuj sparsować JSON
        const data = await response.json();
        console.log('Odpowiedź API:', { url: fullUrl, data });
        return data;
        
    } catch (error) {
        console.error('Błąd podczas pobierania danych:', error);
        throw error;
    }
}

async function fetchLastDetection() {
    try {
        const data = await fetchApi(detectionsApiUrl, { limit: 1 });
        
        if (data && Array.isArray(data.detections) && data.detections.length > 0) {
            const detection = data.detections[0];
            updateLastDetectionUI(detection);
        } else {
            throw new Error('Brak danych o wykryciach');
        }
    } catch (error) {
        console.error('Błąd podczas pobierania ostatniego wykrycia:', error);
        handleError('Nie udało się pobrać danych o ostatnim wykryciu');
        showPlaceholderDetection();
    }
}

function updateLastDetectionUI(detection) {
    const birdName = detection.speciesName || "Nieznany ptak";
    const detectionTime = detection.detectedAt 
        ? new Date(detection.detectedAt).toLocaleString('pl-PL') 
        : "Data nieznana";
    const birdImageUrl = detection.imageUrl || "placeholder.jpg";

    document.getElementById("bird-name").querySelector(".info-value").textContent = birdName;
    document.getElementById("bird-detection-time").querySelector(".info-value").textContent = detectionTime;
    
    const birdImage = document.getElementById("bird-image");
    birdImage.src = birdImageUrl;
    birdImage.alt = birdName;
    
    const imageContainer = document.getElementById("last-detection-image");
    imageContainer.onclick = () => openWikipediaPage(birdName);
}

function showPlaceholderDetection() {
    document.getElementById("bird-name").querySelector(".info-value").textContent = "Brak danych";
    document.getElementById("bird-detection-time").querySelector(".info-value").textContent = "Brak danych";
    document.getElementById("bird-image").src = "placeholder.jpg";
}

async function fetchTopSpecies() {
    try {
        const data = await fetchApi(speciesApiUrl, { 
            limit: 10,
            hours: 24
        });
        
        if (data && Array.isArray(data.species)) {
            updateSpeciesTableUI(data.species);
        } else {
            throw new Error('Brak danych o gatunkach');
        }
    } catch (error) {
        console.error('Błąd podczas pobierania gatunków:', error);
        handleError('Nie udało się pobrać danych o gatunkach');
        showPlaceholderSpecies();
    }
}

function updateSpeciesTableUI(species) {
    const tableBody = document.getElementById("species-table-body");
    tableBody.innerHTML = '';

    species.forEach(bird => {
        const row = document.createElement("tr");
        
        // Komórka ze zdjęciem
        const imgCell = document.createElement("td");
        const img = document.createElement("img");
        img.src = bird.imageUrl || "placeholder.jpg";
        img.alt = bird.name || "Nazwa ptaka niedostępna";
        img.onclick = () => openWikipediaPage(bird.name);
        imgCell.appendChild(img);
        
        // Pozostałe komórki
        const nameCell = document.createElement("td");
        nameCell.textContent = bird.name || "Nazwa niedostępna";
        
        const detectionsCell = document.createElement("td");
        detectionsCell.textContent = bird.detectionsCount || 0;
        
        const lastDetectionCell = document.createElement("td");
        lastDetectionCell.textContent = bird.lastDetectedAt 
            ? new Date(bird.lastDetectedAt).toLocaleString('pl-PL')
            : "Data nieznana";

        row.append(imgCell, nameCell, detectionsCell, lastDetectionCell);
        tableBody.appendChild(row);
    });
}

function showPlaceholderSpecies() {
    const tableBody = document.getElementById("species-table-body");
    tableBody.innerHTML = `
        <tr>
            <td colspan="4" style="text-align: center; padding: 20px;">
                Brak danych o gatunkach
            </td>
        </tr>
    `;
}

function handleError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        background-color: #ffebee;
        color: #c62828;
        padding: 12px;
        margin: 8px 0;
        border-radius: 4px;
        text-align: center;
    `;
    
    const oldErrors = document.getElementsByClassName('error-message');
    Array.from(oldErrors).forEach(error => error.remove());
    
    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, container.firstChild);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

async function refreshData() {
    const refreshButton = document.querySelector('.refresh-button');
    refreshButton.style.transform = 'rotate(360deg)';
    refreshButton.style.transition = 'transform 0.5s';
    
    try {
        await Promise.all([
            fetchLastDetection(),
            fetchTopSpecies()
        ]);
    } catch (error) {
        console.error("Błąd podczas odświeżania danych:", error);
        handleError("Wystąpił błąd podczas odświeżania danych");
    }
    
    setTimeout(() => {
        refreshButton.style.transform = 'rotate(0deg)';
        refreshButton.style.transition = 'none';
    }, 500);
}

document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(addRippleEffect);
    refreshData();
});

setInterval(refreshData, 10000);
