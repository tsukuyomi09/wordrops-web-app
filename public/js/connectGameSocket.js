function initializeSocket(){
    try {
        // Estrai il gameId dall'URL
        const urlPath = window.location.pathname; // Ottiene il path tipo "/game/178"
        const gameId = urlPath.split('/')[2]; // Estrai l'ID del gioco (in questo caso "178")

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

initializeSocket()




