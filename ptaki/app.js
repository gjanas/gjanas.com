// Przykładowe dane do testowania
const birdData = [
    {
        name: "Sikorka",
        imageUrl: "sikorka.jpg",
        count: 5,
        lastSeen: "2024-11-05 14:30"
    },
    {
        name: "Wróbel",
        imageUrl: "wrobel.jpg",
        count: 3,
        lastSeen: "2024-11-05 15:00"
    }
];

// Funkcja dodająca dane do tabeli
function populateTable(data) {
    const tableBody = document.getElementById('species-table-body');
    tableBody.innerHTML = ''; // Czyszczenie istniejących danych

    data.forEach(bird => {
        const row = document.createElement('tr');

        const imgCell = document.createElement('td');
        const img = document.createElement('img');
        img.src = bird.imageUrl;
        img.alt = bird.name;
        img.onclick = () => redirectToWiki(bird.name); // Kliknięcie obrazu przenosi do Wikipedii
        imgCell.appendChild(img);
        row.appendChild(imgCell);

        const nameCell = document.createElement('td');
        nameCell.textContent = bird.name;
        row.appendChild(nameCell);

        const countCell = document.createElement('td');
        countCell.textContent = bird.count;
        row.appendChild(countCell);

        const lastSeenCell = document.createElement('td');
        lastSeenCell.textContent = bird.lastSeen;
        row.appendChild(lastSeenCell);

        tableBody.appendChild(row);
    });
}

// Funkcja przekierowująca do Wikipedii
function redirectToWiki(birdName) {
    const wikiUrl = `https://pl.wikipedia.org/wiki/${encodeURIComponent(birdName)}`;
    window.open(wikiUrl, '_blank');
}

// Wywołanie funkcji w celu wypełnienia tabeli
populateTable(birdData);
