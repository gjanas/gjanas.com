const token = 'hLd2SmS16HxaZFzKjeghR75u';
const locale = 'pl';
const speciesApiUrl = `https://app.birdweather.com/api/v1/stations/${token}/species?locale=${locale}&limit=10`;
const detectionsApiUrl = `https://app.birdweather.com/api/v1/stations/${token}/detections?locale=${locale}&limit=1`;

function openWikipediaPage(birdName) {
    const wikiUrl = `https://pl.wikipedia.org/wiki/${encodeURIComponent(birdName)}`;
    window.open(wikiUrl, '_blank'); // Otwiera link w nowej karcie
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
            
            document.getElementById("bird-name").querySelector("span").textContent = birdName;
            document.getElementById("bird-detection-time").querySelector("span").textContent = detectionTime;
            const birdImage = document.getElementById("bird-image");
            birdImage.src = birdImageUrl;
            birdImage.alt = birdName;

            birdImage.onclick = () => openWikipediaPage(birdName);
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

        console.log("Pełna odpowiedź API dla ostatniego wykrycia:", data);

        if (data.success && data.detections && data.detections.length > 0) {
            const speciesTableBody = document.getElementById("species-table-body");
            speciesTableBody.innerHTML = ''; // wyczyszczenie tabeli przed dodaniem nowych danych

            data.detections.forEach(bird => {
                const row = document.createElement("tr");

                const birdNameCell = document.createElement("td");
                birdNameCell.textContent = bird.species.commonName || "Nieznany ptak";
                row.appendChild(birdNameCell);

                const detectionsCell = document.createElement("td");
                detectionsCell.textContent = bird.totalDetections;
                row.appendChild(detectionsCell);

                const lastDetectionCell = document.createElement("td");
                lastDetectionCell.textContent = new Date(bird.latestDetectionAt).toLocaleString('pl-PL');
                row.appendChild(lastDetectionCell);

                // Dodajemy onclick do row, aby otworzyć stronę Wikipedii dla klikniętego wiersza
                row.onclick = () => openWikipediaPage(bird.species.commonName);
                speciesTableBody.appendChild(row);
            });
        } else {
            console.error("Nie udało się pobrać danych o gatunkach lub dane są niekompletne:", data);
        }
    } catch (error) {
        console.error("Błąd podczas pobierania danych gatunków:", error);
    }
}

fetchLastDetection();
fetchTopSpecies();
