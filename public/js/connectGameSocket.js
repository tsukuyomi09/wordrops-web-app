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
            console.log("Lo stato è 'in_game'. Avvio delle funzioni.");
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
            console.log(`game status: ${data.status}`);
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
        console.log(`Apertura connessione WebSocket per gameId: ${game_id}`);

        const socket = io();

        socket.on('gameUpdate', (data) => {
            console.log('Dati ricevuti:', data);  // Log di debug per vedere i dati ricevuti
        
            const countdownDisplay = document.getElementById('countdown-display');
            if (countdownDisplay) {
                countdownDisplay.textContent = data.formatted; // Aggiorna il testo con il tempo rimanente
            }
        
            // Estrai i dati per il turno corrente e l'ordine dei turni
            const { currentPlayer, turnOrder } = data;
        
            // Aggiungi log per verificare che currentPlayer e turnOrder siano quelli che ti aspetti
            console.log('currentPlayer:', currentPlayer);
            console.log('turnOrder:', turnOrder);
        
            // Trova il giocatore corrente
            const currentTurnPlayer = currentPlayer;  // Ora currentPlayer è un oggetto con id e username
            console.log('currentTurnPlayer:', currentTurnPlayer);  // Log per vedere il giocatore corrente
        
            // Se currentTurnPlayer è trovato, mostra l'username
            const currentTurnDisplay = document.getElementById('current-turn');
            if (currentTurnDisplay && currentTurnPlayer) {
                currentTurnDisplay.textContent = `Turno corrente: ${currentTurnPlayer.username}`; // Mostra l'username del giocatore corrente
            } else if (currentTurnDisplay) {
                currentTurnDisplay.textContent = `Turno corrente non trovato!`; // Se non trovi il giocatore, mostra un messaggio di errore
            }
        
            // Mostra l'ordine dei turni con gli username
            const turnOrderText = turnOrder.map((player, index) => `Turno ${index + 1}: ${player.username}`).join(', ');
            const turnOrderDisplay = document.getElementById('turn-order');
            if (turnOrderDisplay) {
                turnOrderDisplay.textContent = `Ordine dei turni: ${turnOrderText}`;
            }
        });
        
        
        
        

        socket.on('playerJoined', (data) => {
            console.log(`Messaggio ricevuto dal server: ${data.message}`);
        });

        socket.on('connect', () => {
            console.log(`Connesso al server con ID socket: ${socket.id}`);
            socket.emit('joinNewGame', { gameId: game_id }); // Assicurati che sia 'game_id', non 'gameId'
            console.log(`Emesso joinNewGame con game_id: ${game_id}`);
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





