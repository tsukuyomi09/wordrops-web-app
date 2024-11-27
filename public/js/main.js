window.onpopstate = function(event) {
    console.log("L'utente ha cliccato 'Indietro'");
    // Qui puoi eseguire qualsiasi funzione, ad esempio:
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
};

// Aggiungi uno stato iniziale
history.pushState(null, null, location.href);

window.addEventListener('load', () => {
    // Aspetta 0.2 secondi dopo il caricamento della pagina
    setTimeout(() => {
        const avatarContainer = document.querySelector('.avatar-container');
        avatarContainer.classList.add('show');  // Aggiungi la classe per avviare la transizione
    }, 50);  // 0.2 secondi
});

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

function fetchAvatarData() {
    // Controlla se l'avatar è già salvato nel localStorage
    const avatar = localStorage.getItem("avatar");

    if (avatar) {
        // Se l'avatar è già presente nel localStorage, usa direttamente l'immagine
        updateAvatarImage(avatar);
    } else {
        // Altrimenti, fai la fetch per ottenere l'avatar dal server
        fetch("/avatar", {
            method: "GET",  // Metodo GET per ottenere l'avatar
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include"  // Include il cookie per l'autenticazione
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Errore nella rete");
            }
            return response.json();  // Ottieni i dati in formato JSON
        })
        .then(data => {
            const avatar = data.avatar;
            // Memorizza l'avatar nel localStorage per evitare future richieste
            localStorage.setItem("avatar", avatar);
            updateAvatarImage(avatar);
        })
        .catch(error => {
            console.error("Errore durante il recupero dell'avatar:", error);
        });
    }
}

// Funzione per aggiornare l'immagine dell'avatar
function updateAvatarImage(avatar) {
    const avatarContainer = document.getElementById("main-avatar");
    avatarContainer.src = `./images/avatars/${avatar}.png`;  // Imposta il nuovo avatar
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

fetchAvatarData();
fetchdashboardData();




let isInQueue = false;  

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


// Seleziona tutti gli avatar
const avatars = document.querySelectorAll('.avatar');
const mainAvatar = document.getElementById('main-avatar');
const avatarContainer = document.getElementById('avatarContainer');
const selectButton = document.getElementById('select-avatar-button');
const closeButton = document.getElementById('close-avatar-menu');
let selectedAvatar = null;

// Aggiungi l'evento click a ciascun avatar
avatars.forEach(avatar => {
    avatar.addEventListener('click', () => {
        // Deseleziona tutti gli avatar
        avatars.forEach(item => {
            item.classList.remove('bg-blue-600');
            item.classList.add('bg-blue-200');
        });

        avatar.classList.remove('bg-blue-200');
        avatar.classList.add('bg-blue-600');
        selectedAvatar = avatar.getAttribute('data-avatar');
        const selectedAvatarImg = avatar.querySelector('img').src;
        mainAvatar.src = selectedAvatarImg;
        selectButton.disabled = false;
    });
});

selectButton.addEventListener('click', () => {
    if (selectedAvatar) {
        fetch('/avatar', {
            method: 'POST',
            body: JSON.stringify({ avatar: selectedAvatar }), // Passiamo l'avatar selezionato
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log('Avatar selezionato e salvato:', data);
            localStorage.setItem('avatar', selectedAvatar);
            closeMenu(); 
        })
        .catch(error => {
            console.error('Errore nella selezione dell\'avatar:', error);
        });
    }
});

closeButton.addEventListener('click', () => {
    if (selectedAvatar) {
        fetch('/avatar', {
            method: 'POST',
            body: JSON.stringify({ avatar: selectedAvatar }), // Passiamo l'avatar selezionato
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            // Gestisci la risposta (ad esempio, chiudi il menu o mostra un messaggio di successo)
            console.log('Avatar selezionato e salvato:', data);
            localStorage.setItem('avatar', selectedAvatar);
            closeMenu(); // Chiudi il menu
        })
        .catch(error => {
            console.error('Errore nella selezione dell\'avatar:', error);
        });
    } else {
        // Se non è stato selezionato nessun avatar, chiudi semplicemente il menu senza fare fetch
        closeMenu();
    }
});

function closeMenu() {
    // Qui metti la logica per chiudere il menu degli avatar, ad esempio:
    avatarContainer.classList.add('hidden'); // Nascondi il menu
    selectedAvatar = null; // Resetta la selezione
    selectButton.disabled = true; // Disabilita il bottone "Seleziona" di nuovo
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









