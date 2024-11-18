
const playersGrid = document.getElementById("players-grid");
const playerTemplate = document.querySelector(".player-container");


// mostra in tempo reale i giocatori in queue sulla pagina
window.onload = function() {
    const pathParts = window.location.pathname.split('/');
    const gameId = pathParts[pathParts.length - 1];

    loadPlayers(gameId);  
    setInterval(() => loadPlayers(gameId), 2000);
};

function updatePlayersDOM(players) {
    playersGrid.innerHTML = ''; 

    players.forEach(player => {
        const newPlayer = playerTemplate.cloneNode(true);
        newPlayer.querySelector("#username").textContent = player.username;
        newPlayer.classList.remove("player-container");
        playersGrid.appendChild(newPlayer); 
    });
}

function loadPlayers(gameId) {
    fetch(`/gamequeue/${gameId}/players`)
        .then(response => response.json())
        .then(players => {
            updatePlayersDOM(players);  
        })
        .catch(error => {
            console.error("Errore nel recupero dei giocatori:", error);
        });
}

// uscire dalla queue
function abandonQueue() {
    fetch("http://127.0.0.1:3000https://focused-wonder-production.up.railway.app/gameQueue", {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    })
    .then(response => response.json())
    .then(data => {
        alert("Hai abbandonato la coda.");
        window.location.href = '/dashboard';
    })
    .catch(error => {
        console.error('Errore nella richiesta per abbandonare la coda:', error);
    });
}
