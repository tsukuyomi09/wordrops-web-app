const formInput = document.getElementById("p-input");
const usernameDashboard = document.getElementById("username");
const waitingOverlay = document.getElementById('waiting-overlay');


let socket;
let socketId = null;
let countdownStarted = false;

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
        socket.on('in-queue', (message) => {
            waitingOverlay.classList.remove('hidden');
        });

        socket.on('game-ready', (message) => {
            alert(message); // Mostra l'alert
        });

        socket.on('countdown', (seconds) => {
            if (!countdownStarted) {
                waitingOverlay.classList.add('hidden');
                document.getElementById('countdown-overlay').style.display = 'flex';
                countdownStarted = true; // Imposta il flag per evitare di farlo più volte
            }            
            document.getElementById('countdown-seconds').innerText = seconds;

        });

        socket.on("not-ready", (message) => {
            console.log(message); // Mostra il messaggio nella console
        
            // Modifica la UI
            document.getElementById('countdown-seconds').style.display = 'none'; // Nascondi il countdown
            document.getElementById('countdown').innerText = "Sei stato rimosso dal game"; // Cambia il testo
            document.getElementById('ready-btn').style.display = 'none'; // Nascondi il pulsante "Sono pronto"
        
            // Dopo 2 secondi, nascondi l'overlay e ripristina la UI
            setTimeout(() => {
                document.getElementById('countdown-overlay').style.removeProperty('display');
                document.getElementById('countdown-seconds').style.display = 'block'; // Rendi visibile di nuovo il countdown
                document.getElementById('ready-btn').style.display = 'block'; // Mostra il pulsante "Sono pronto"
                document.getElementById('countdown').innerText = "Partita trovata, Inizio in:"; // Ripristina il testo iniziale

                countdownStarted = false;
                socket.disconnect();
                socket = null;
            }, 2000); // Aspetta 2 secondi prima di ripristinare la UI
        });

        socket.on("queueAbandoned", (data) => {
            waitingOverlay.classList.add('hidden');
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
    await initSocket();

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

            console.log("Richiesta per unirsi alla coda completata con successo.");
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
        setTimeout(() => {
            waitingOverlay.classList.add('hidden');
        }, 1500);
        return response.json();
    })

    .catch(error => {
        console.error('Errore nella richiesta per abbandonare la coda:', error);
    });
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









