// Estrai il gameId dall'URL
const urlPath = window.location.pathname; // Ottiene il path tipo "/game/178"
const gameId = urlPath.split('/')[2]; 

window.onload = async function() {

    if (!gameId) {
      console.error("Errore: gameId non trovato nell'URL");
      return;
    }
    try {
      const response = await fetch(`/game-status/${gameId}`);
      const data = await response.json();

      if (data.status == 'to-start') {
        console.log(`game status: ${data.status}`)
        document.getElementById('popup-start-countdown').classList.remove('hidden');
      }
    } catch (error) {
      console.error("Errore durante la fetch dello stato del gioco", error);
    }
  };


function initializeSocket(){
    try {

        if (!gameId) {
            console.error("Errore: gameId non trovato nell'URL");
            return;
        }
        console.log(`Apertura connessione WebSocket per gameId: ${gameId}`);

        const socket = io();

        socket.on('countdownUpdate', (data) => {
            console.log(`Tempo rimanente: ${data.formatted}`);
            // Aggiorna l'interfaccia utente con il tempo rimanente
        });
        
        socket.on('playerJoined', (data) => {
            console.log(`Messaggio ricevuto dal server: ${data.message}`);
        });


        socket.on('connect', () => {
            console.log(`Connesso al server con ID socket: ${socket.id}`);
            socket.emit('joinNewGame', { gameId }); // Comunica al server a quale gioco si sta associando
        });

        
    } catch (error) {
        console.error("Errore durante l'inizializzazione della connessione:", error);
    }
};

function buttonStartGame() {
  
    document.getElementById('popup-start-countdown').classList.add('hidden');

    fetch(`/game/${gameId}/player-ready`, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ gameId }) // Invia il gameId del gioco
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

initializeSocket()




