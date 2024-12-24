
let editor;
let game_id;


window.onload = function initialize() {
    checkUserStatus();
}

function checkUserStatus() {
    const userStatus = sessionStorage.getItem("user_status");
    const gameId = sessionStorage.getItem("game_id");
    if (userStatus === "in_game" && gameId) {
            initializeInGameFunction(gameId);
    } else {
        // Se "user_status" non è presente, esegui una fetch per ottenere i dati
        getUserStatus();
    }
}

function getUserStatus() {
    fetch('/userData')
        .then(response => response.json())
        .then(data => {
            // Salva i dati nel session storage
            sessionStorage.setItem("user_status", data.status);
            sessionStorage.setItem("game_id", data.game_id);
            game_id = data.game_id

            // Se l'utente è in gioco, inizializza il gioco
            if (data.status === "in_game") {
                initializeInGameFunction(data.game_id);
            }
        })
        .catch(error => {
            console.error("Errore durante la fetch dei dati:", error);
        });
}

function initializeInGameFunction(game_id) {
    initializeSocket(game_id)
    checkGameData(game_id)

    const game_status = sessionStorage.getItem("game_status");
    if (game_status) {

        if (game_status === "to_start") {
            document.getElementById('popup-start-countdown').classList.remove('hidden');
        }
    } else {
        getGameStatus(game_id)
    }
}

async function getGameStatus(game_id) {

    try {
        const response = await fetch(`/game-status/${game_id}`);
        
        if (!response.ok) {
            throw new Error("Errore nel recupero dei dati dallo stato del gioco");
        }
        const data = await response.json();

        if (data.status === 'to-start') {
            document.getElementById('popup-start-countdown').classList.remove('hidden');
            sessionStorage.setItem('game_status', 'to-start');
        } else if (data.status === 'in-progress') {
            sessionStorage.setItem('game_status', 'in-progress');
        }
    } catch (error) {
        console.error("Errore durante la fetch dello stato del gioco", error);
    }
}

function checkGameData(game_id) {
    // Verifica se i dati del gioco sono presenti nel sessionStorage
    const turnOrderData = JSON.parse(sessionStorage.getItem('turnOrder'));
    const currentPlayer = JSON.parse(sessionStorage.getItem('currentPlayer'));
    const currentUser = localStorage.getItem('username');

    if (turnOrderData && currentPlayer) {

        updateCurrentPlayerDisplay(currentPlayer)
        updateTurnOrderDisplay(turnOrderData, currentPlayer)

    } else {
        // Altrimenti fai una fetch per ottenere i dati del gioco
        getCurrentGameData(game_id)
            .then(data => {
                // Salva i dati nel sessionStorage
                sessionStorage.setItem('players', JSON.stringify(data.players));
                sessionStorage.setItem('turnOrder', JSON.stringify(data.turnOrder));
                sessionStorage.setItem('currentPlayer', JSON.stringify(data.currentPlayer));

                // Poi aggiorna l'interfaccia
                updateCurrentPlayerDisplay(data.currentPlayer)
                updateTurnOrderDisplay(data.turnOrder)

            })
            .catch(error => {
                console.error("Errore durante il recupero dei dati del gioco:", error);
            });
    }
}

async function getCurrentGameData(game_id) {
    try {
        const response = await fetch(`/game-data/${game_id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`Errore nella fetch: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();

        // Assicurati che i dati contengano le informazioni necessarie
        if (!data.players || !data.turnOrder || !data.currentPlayer) {
            throw new Error('I dati del gioco sono incompleti o mancanti');
        }

        return data; // Restituisci i dati ottenuti
    } catch (error) {
        console.error('Errore durante il recupero dei dati del gioco:', error);
        throw error; // Rilancia l'errore per una gestione più specifica in chiamata
    }
}

function initializeSocket(game_id) {
    game_id = Number(game_id)
    try {
        if (!game_id) {
            console.error("Errore: gameId non trovato nell'URL");
            return;
        }

        socket = io();

        socket.on('gameAbandoned', (data) => {
        
            // Recupera gli elementi del popup
            const popup = document.getElementById('popup-message');
            const popupText = document.getElementById('popup-text');
            const popupClose = document.getElementById('popup-close');
        
            // Imposta il messaggio del popup
            const currentUser = localStorage.getItem('username');
            if (data.username === currentUser) {
                popupText.textContent = 'Hai abbandonato la partita. La partita è stata annullata.';
            } else {
                popupText.textContent = `La partita è stata abbandonata da ${data.username}.`;
            }
        
            // Mostra il popup
            popup.classList.remove('hidden');
            popupClose.removeEventListener('click', handlePopupClose);
            popupClose.addEventListener('click', handlePopupClose);
        
            function handlePopupClose() {
                popup.classList.add('hidden'); // Nasconde il popup
                const username = localStorage.getItem('username');
                sessionStorage.clear(); // Cancella i dati relativi alla partita
                window.location.href = `/dashboard/${username}`; // Redirezione
            }
        });
        

        socket.on('nextChapterUpdate', (data) => {        
            // Aggiorna il giocatore corrente e altre logiche correlate
            sessionStorage.setItem('currentPlayer', JSON.stringify(data.nextPlayer));
            const currentUser = localStorage.getItem('username');
            updateCurrentPlayerDisplay(data.nextPlayer);      
        });
        

        socket.on('gameUpdate', (data) => {
            try {
                updateCountdownDisplay(data.formatted);
            } catch (error) {
                console.error("Errore durante updateCountdownDisplay:", error);
            }
        });

        socket.on('playerJoined', (data) => {
            console.log(`Messaggio ricevuto dal server: ${data.message}`);
        });

        socket.on('connect', () => {
            socket.emit('joinNewGame', { gameId: game_id });
        });

    } catch (error) {
        console.error("Errore durante l'inizializzazione della connessione:", error);
    }
}

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


/// update game UI ///

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
                <div class="text-lg font-bold mr-10">Turno corrente:</div>
                <div class="p-2 h-20 w-20 flex flex-col items-center rounded bg-white">
                    <img src="${avatarSrc}" alt="Avatar" class="w-8 h-8 rounded-full mr-2" />
                    <span class="text-lg font-bold">${currentPlayer.username}</span>
                </div>    
            </div>
        `;
    } else if (currentTurnDisplay) {
        currentTurnDisplay.textContent = `Turno corrente non trovato!`; // Messaggio di errore
    }
}

function updateTurnOrderDisplay(turnOrder, currentPlayer) {

    const turnOrderDisplay = document.getElementById('turn-order');

    if (turnOrderDisplay) {
        const turnOrderHTML = turnOrder.map((player, index) => {
            const avatarSrc = getAvatarSrc(player.avatar);
            return `
            <div class="turn-order-item flex flex-row items-center ">
                <div class="p-2 h-12 w-10 flex flex-col items-center rounded bg-white">
                <img src="${avatarSrc}" alt="Avatar" class="w-4 h-4 rounded-full mb-1" />
                <span class="text-sm font-medium">${player.username}</span>
                </div>
                <span class="text-xl ml-4 font-medium mt-2">${index + 1}°</span>
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















    











