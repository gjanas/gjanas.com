const token = 'hLd2SmS16HxaZFzKjeghR75u';
const locale = 'pl';
const baseUrl = 'https://app.birdweather.com/api/v1';
const speciesApiUrl = `${baseUrl}/stations/${token}/species`;
const detectionsApiUrl = `${baseUrl}/stations/${token}/detections`;

// Funkcja do otwierania strony Wikipedii na podstawie nazwy ptaka
function openWikipediaPage(birdName) {
    const wikiUrl = `https://pl.wikipedia.org/wiki/${encodeURIComponent(birdName)}`;
    window.open(wikiUrl, '_blank');
}

// Funkcja do dodania efektu ripple do elementów
function addRippleEffect(element) {
    const ripple = mdc.ripple.MDCRipple.attachTo(element);
    ripple.unbounded = true;
}

// Funkcja pomocnicza do wykonywania zapytań API
async function fetchApi(url, params = {}) {
    const queryParams = new URLSearchParams({
        locale,
        ...params
    }).toString();
    
    const fullUrl = `${url}?${queryParams}`;
    
    try {
        const response = await fetch(fullUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Błąd podczas pobierania danych z ${url}:`, error);
        throw error;
    }
}

async function fetchLastDetection() {
    try {
        const data = await fetchApi(detectionsApiUrl, { limit: 1 });
        console.log("Dane z API (ostatnie wykrycie):", data);

        if (data && data.detections && data.detections.length > 0) {
            const lastDetection = data.detections[0];
            
            const birdName = lastDetection.speciesName || "Nieznany ptak";
            const detectionTime = lastDetection.detectedAt 
                ? new Date(lastDetection.detectedAt).toLocaleString('pl-PL') 
                : "Data nieznana";
            const birdImageUrl = lastDetection.imageUrl || "placeholder.jpg";

            // Aktualizacja danych na stronie
            document.getElementById("bird-name").querySelector(".info-value").textContent = birdName;
            document.getElementById("bird-detection-time").querySelector(".info-value").textContent = detectionTime;
            const birdImage = document.getElementById("bird-image");
            birdImage.src = birdImageUrl;
            birdImage.alt = birdName;

            // Dodanie obsługi kliknięcia na kontener zdjęcia
            const imageContainer = document.getElementById("last-detection-image");
            imageContainer.onclick = () => openWikipediaPage(birdName);
        } else {
            console.error("Brak danych o ostatnim wykryciu:", data);
            document.getElementById("bird-name").querySelector(".info-value").textContent = "Brak danych";
            document.getElementById("bird-detection-time").querySelector(".info-value").textContent = "Brak danych";
        }
    } catch (error) {
        console.error("Błąd podczas pobierania ostatniego wykrycia:", error);
        handleError("Nie udało się pobrać danych o ostatnim wykryciu");
    }
}

async function fetchTopSpecies() {
    try {
        const data = await fetchApi(speciesApiUrl, { 
            limit: 10,
            hours: 24
        });
        console.log("Dane z API (top gatunki):", data);

        if (data && data.species && data.species.length > 0) {
            const speciesTableBody = document.getElementById("species-table-body");
            speciesTableBody.innerHTML = '';

            data.species.forEach(bird => {
                const row = document.createElement("tr");

                const imgCell = document.createElement("td");
                const img = document.createElement("img");
                img.src = bird.imageUrl || "placeholder.jpg";
                img.alt = bird.name || "Nazwa ptaka niedostępna";
                img.onclick = () => openWikipediaPage(bird.name);
                imgCell.appendChild(img);
                row.appendChild(imgCell);

                const nameCell = document.createElement("td");
                nameCell.textContent = bird.name || "Nazwa niedostępna";
                row.appendChild(nameCell);

                const detectionsCell = document.createElement("td");
                detectionsCell.textContent = bird.detectionsCount || 0;
                row.appendChild(detectionsCell);

                const lastDetectionCell = document.createElement("td");
                const lastDetectionDate = bird.lastDetectedAt 
                    ? new Date(bird.lastDetectedAt).toLocaleString('pl-PL')
                    : "Data nieznana";
                lastDetectionCell.textContent = lastDetectionDate;
                row.appendChild(lastDetectionCell);

                speciesTableBody.appendChild(row);
            });
        } else {
            console.error("Brak danych o gatunkach:", data);
            const speciesTableBody = document.getElementById("species-table-body");
            speciesTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Brak danych o gatunkach</td></tr>';
        }
    } catch (error) {
        console.error("Błąd podczas pobierania top gatunków:", error);
        handleError("Nie udało się pobrać danych o gatunkach");
    }
}

function handleError(message) {
    // Dodaj komunikat o błędzie na stronie
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
    
    // Usuń poprzednie komunikaty o błędach
    const oldErrors = document.getElementsByClassName('error-message');
    Array.from(oldErrors).forEach(error => error.remove());
    
    // Dodaj nowy komunikat na górze strony
    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, container.firstChild);
    
    // Automatycznie usuń komunikat po 5 sekundach
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

// Inicjalizacja Material Design Components
document.addEventListener('DOMContentLoaded', () => {
    // Dodaj efekt ripple do przycisków i interaktywnych elementów
    const buttons = document.querySelectorAll('button');
    buttons.forEach(addRippleEffect);
    
    // Rozpocznij pobieranie danych
    refreshData();
});

// Sprawdzaj nowe wykrycia co 10 sekund
setInterval(refreshData, 10000);
