window.onload = async function fetchdashboardData() {

      fetch("/dashboardData",{
          method: "GET",  // Metodo GET per ottenere gli item
          headers: {
              "Content-Type": "application/json",
          },
          credentials: "include"
      })
      .then(response => {
          if (!response.ok) {
              throw new Error("Errore nella rete");
          }
          return response.json();
      })
      .then(data => {
          const status = data.status;
          game_id = Number(data.game_id);

          if (status === "in_game") {
            checkGameStatus(game_id);
            initializeSocket(game_id);
          } else {
              console.log(`Lo stato attuale è '${status}'. Nessuna azione intrapresa.`);
          }

      })
      .catch(error => {
          console.error("Errore durante il recupero degli elementi:", error);
          console.log("Response status:", error.response ? error.response.status : "nessuna risposta");
      });

}


async function checkGameStatus(game_id) {
    if (!game_id) {
        console.error("Errore: gameId non trovato");
        return;
    }

    try {
        const response = await fetch(`/game-status/${game_id}`);
        const data = await response.json();

        if (data.status === 'to-start') {
            document.getElementById('popup-start-countdown').classList.remove('hidden');
        }
    } catch (error) {
        console.error("Errore durante la fetch dello stato del gioco", error);
    }
}

function initializeSocket(game_id){
    try {

        if (!game_id) {
            console.error("Errore: gameId non trovato nell'URL");
            return;
        }

        const socket = io();

        socket.on('gameUpdate', (data) => {        
            try {
                updateCountdownDisplay(data.formatted);
            } catch (error) {
                console.error("Errore durante updateCountdownDisplay:", error);
            }
            
            try {
                updateCurrentPlayerDisplay(data.currentPlayer);
            } catch (error) {
                console.error("Errore durante updateCurrentPlayerDisplay:", error);
            }
            
            try {
                updateTurnOrderDisplay(data.turnOrder);
            } catch (error) {
                console.error("Errore durante updateTurnOrderDisplay:", error);
            }

        });
        

        socket.on('playerJoined', (data) => {
            console.log(`Messaggio ricevuto dal server: ${data.message}`);
        });

        socket.on('connect', () => {
            socket.emit('joinNewGame', { gameId: game_id }); // Assicurati che sia 'game_id', non 'gameId'
        });
        
    } catch (error) {
        console.error("Errore durante l'inizializzazione della connessione:", error);
    }
};


function buttonStartGame() {
  
    document.getElementById('popup-start-countdown').classList.add('hidden');
    fetch(`/game/${game_id}/player-ready`, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ game_id }) // Invia il gameId del gioco
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'game-started') {
        // Se il gioco è stato avviato, esegui altre azioni
        alert("La partita è iniziata!");
      }
    })
    .catch(error => console.error("Errore nel segnare il giocatore come pronto:", error));
  }


function updateCountdownDisplay(formattedTime) {
    const countdownDisplay = document.getElementById('countdown-display');
    if (countdownDisplay) {
        countdownDisplay.textContent = formattedTime; // Aggiorna il testo con il tempo rimanente
    }
}

function updateCurrentPlayerDisplay(currentPlayer) {
    const currentTurnDisplay = document.getElementById('current-turn');
    if (currentTurnDisplay && currentPlayer) {
        const avatarSrc = getAvatarSrc(currentPlayer.avatar);

        currentTurnDisplay.innerHTML = `
            <div class="flex items-center">
                <img src="${avatarSrc}" alt="Avatar" class="w-8 h-8 rounded-full mr-2" />
                <span class="text-lg font-bold">Turno corrente: ${currentPlayer.username}</span>
            </div>
        `;
    } else if (currentTurnDisplay) {
        currentTurnDisplay.textContent = `Turno corrente non trovato!`; // Messaggio di errore
    }
}

function updateTurnOrderDisplay(turnOrder) {
    const turnOrderDisplay = document.getElementById('turn-order');
    if (turnOrderDisplay) {
        const turnOrderHTML = turnOrder.map((player, index) => {
            const avatarSrc = getAvatarSrc(player.avatar);

            return `
                <div class="turn-order-item flex items-center mb-2">
                    <img src="${avatarSrc}" alt="Avatar" class="w-8 h-8 rounded-full mr-2" />
                    <span class="text-sm font-medium">${player.username} (Turno ${index + 1})</span>
                </div>
            `;
        }).join('');

        turnOrderDisplay.innerHTML = turnOrderHTML;
    }
}

function getAvatarSrc(avatar) {
    // Controlla se l'avatar è definito, altrimenti usa un avatar di default
    return avatar 
        ? `/images/avatars/${avatar}.png` 
        : '/images/avatars/default-avatar.png';
}





