const token = 'hLd2SmS16HxaZFzKjeghR75u';
const locale = 'pl';
const speciesApiUrl = `https://app.birdweather.com/api/v1/stations/${token}/species?locale=${locale}&limit=10`;
const detectionsApiUrl = `https://app.birdweather.com/api/v1/stations/${token}/detections?locale=${locale}&limit=1`;

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

async function fetchLastDetection() {
    try {
        const response = await fetch(detectionsApiUrl, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();

        console.log("Pełna odpowiedź API dla ostatniego wykrycia:", data);

        if (data.success && data.detections && data.detections.length > 0) {
            const lastDetection = data.detections[0];
            
            const birdName = lastDetection.species ? lastDetection.species.commonName : "Nieznany ptak";
            const detectionTime = lastDetection.timestamp ? new Date(lastDetection.timestamp).toLocaleString('pl-PL') : "Data nieznana";
            const birdImageUrl = lastDetection.species && lastDetection.species.imageUrl ? lastDetection.species.imageUrl : "placeholder.jpg";

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
            console.error("Nie udało się pobrać danych o ostatnim wykryciu lub dane są niekompletne:", data);
        }
    } catch (error) {
        console.error("Błąd podczas wykonywania zapytania:", error);
    }
}

async function fetchTopSpecies() {
    try {
        const response = await fetch(speciesApiUrl, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();

        console.log("Odpowiedź API dla top gatunków:", data);

        if (data.success) {
            const speciesTableBody = document.getElementById("species-table-body");
            speciesTableBody.innerHTML = '';

            data.species.forEach(bird => {
                const row = document.createElement("tr");

                const imgCell = document.createElement("td");
                const img = document.createElement("img");
                img.src = bird.thumbnailUrl || "placeholder.jpg";
                img.alt = bird.commonName;
                img.onclick = () => openWikipediaPage(bird.commonName);
                imgCell.appendChild(img);
                row.appendChild(imgCell);

                const nameCell = document.createElement("td");
                nameCell.textContent = bird.commonName;
                row.appendChild(nameCell);

                const detectionsCell = document.createElement("td");
                detectionsCell.textContent = bird.detections.total;
                row.appendChild(detectionsCell);

                const lastDetectionCell = document.createElement("td");
                lastDetectionCell.textContent = new Date(bird.latestDetectionAt).toLocaleString('pl-PL');
                row.appendChild(lastDetectionCell);

                speciesTableBody.appendChild(row);
            });
        } else {
            console.error("Brak danych o top gatunkach lub nieudane pobranie:", data);
        }
    } catch (error) {
        console.error("Błąd zapytania:", error);
    }
}

async function refreshData() {
    const refreshButton = document.querySelector('.refresh-button');
    refreshButton.style.transform = 'rotate(360deg)';
    refreshButton.style.transition = 'transform 0.5s';
    
    await fetchLastDetection();
    await fetchTopSpecies();
    
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
});

// Sprawdzaj nowe wykrycia co 10 sekund
setInterval(refreshData, 10000);
refreshData();
