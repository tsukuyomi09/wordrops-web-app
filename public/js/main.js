const formInput = document.getElementById("p-input");
const usernameDashboard = document.getElementById("username");

let socket;
let socketId = null;

function initSocket() {
    return new Promise(resolve => {
        socket = io(); // Inizializza la connessione WebSocket

        // Quando il WebSocket è connesso, salva il socketId
        socket.on('connect', () => {
            socketId = socket.id;
            console.log("Socket connesso con ID:", socketId);
            resolve();  // Una volta connesso, risolvi la promessa
        });

        // Listener per quando il gioco è pronto
        socket.on('game-ready', (message) => {
            alert(message); // Mostra l'alert
        });
    });
}


function fetchdashboardData() {
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
        displayItems(data.username); // Mostra gli elementi ricevuti
    })
    .catch(error => {
        console.error("Errore durante il recupero degli elementi:", error);
        console.log("Response status:", error.response ? error.response.status : "nessuna risposta");
    });

}

function displayItems(username) {
    const usernameDashboard = document.getElementById("username");
    usernameDashboard.textContent = username;

}

fetchdashboardData();

let isInQueue = false;  

function toggleQueue() {
    if (isInQueue) {
        // L'utente è già in coda, quindi lo rimuoviamo
        abandonQueue();  // Funzione per rimuovere l'utente dalla coda
    } else {
        // L'utente non è in coda, quindi lo aggiungiamo
        joinQueue();  // Funzione per aggiungere l'utente alla coda
    }
}


async function joinQueue() {
    console.log("Tentativo di connessione al WebSocket...");

    // Inizializza la connessione WebSocket e aspetta che si connetta
    await initSocket();

    // Quando la connessione è avvenuta, possiamo fare il fetch con socketId
    if (socketId) {
        try {
            const response = await fetch("/gamequeueNew", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ socketId })
            });

            if (!response.ok) {
                throw new Error(`Errore HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === "in-queue") {
                alert("In attesa di altri giocatori");
            } else if (data.status === "pre-game") {
                alert('Sei pronto a partire?');
            } else {
                console.error('Stato sconosciuto ricevuto:', data);
            }
        } catch (error) {
            console.error('Errore nella richiesta per unirsi alla coda:', error);
        }
    } else {
        console.log("Impossibile ottenere il socketId.");
    }
}


function abandonQueue() {

    console.log("Esecuzione di abandonQueue");
    if (socket) { 
        console.log("Socket esiste, procedo con la disconnessione...");
        socket.disconnect();
        socket = null;
        console.log("Connessione Socket.IO chiusa");
    } else {
        console.log("Nessun socket da chiudere.");
    }

    
    fetch("/gamequeueNew", {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Errore HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(() => {
        alert("Hai abbandonato la coda.");
    })
    .catch(error => {
        console.error('Errore nella richiesta per abbandonare la coda:', error);
    });
}

function updateButton() {
    const button = document.getElementById('queue-button');
    if (isInQueue) {
        button.innerHTML = 'ABBANDONA <br> PARTITA';  // Cambia il testo del bottone
    } else {
        button.innerHTML = 'NUOVA <br> PARTITA';  // Cambia il testo del bottone
    }
}


function logout(){
    fetch("/logout", {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    })
    .then(response => {
        if (response.ok) {
            window.location.href = "/"; 
        } else {
            return response.json(); 
        }
    })
    .then(errorData => {
        if (errorData && errorData.error) {
            console.error('Errore durante il logout: ', errorData.error);
        }
    })
    .catch(error => {
        console.error('Errore: Problema con il logout: ', error);
    });

}









