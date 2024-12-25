
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
        handleEditorAccess(currentPlayer, currentUser)
        foxAnimation()

        fetch(`/games/${game_id}/chapters`) // Assumendo che questa sia la rotta giusta
            .then(response => response.json())  // Recupera i dati dei capitoli
            .then(chaptersData => {

                // 3. Aggiungi i capitoli all'interfaccia
                updateChaptersDisplay(chaptersData); // Funzione che aggiorna la visualizzazione dei capitoli
            })
            .catch(error => {
                console.error('Errore nel recupero dei capitoli:', error);
            });

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
                handleEditorAccess(data.currentPlayer, currentUser)
                foxAnimation()

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

        socket.on('game-ready-popup', () => {
            console.log("Evento 'game-ready-popup' ricevuto"); // Debug per confermare la ricezione
            showGameStartPopup(); // Mostra il popup
        });

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
            sessionStorage.setItem('currentPlayer', JSON.stringify(data.nextPlayer));
            const newChapter = data.chapter; // Ottieni il capitolo dal messaggio WebSocket
            updateChaptersDisplay([newChapter]); // Chiamata alla funzione per visualizzare il capitolo

            const currentUser = localStorage.getItem('username');
            foxAnimation()
            handleEditorAccess(data.nextPlayer, currentUser);
            updateCurrentPlayerDisplay(data.nextPlayer);      

            if (currentUser !== data.previousAuthor) {
                changeTurnShowPopup(data.previousAuthor, data.nextPlayer);
            }
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
      console.log('Dati ricevuti dal server:', data); // Log per vedere cosa arriva dal server
  
      if (data.status === 'in-progress') {
        // Se il gioco è stato avviato, esegui altre azioni
        sessionStorage.setItem('game_status', 'in_progress');
        console.log('Stato del gioco aggiornato:', sessionStorage.getItem('game_status')); // Log per verificare lo stato nel sessionStorage
        showGameStartPopup();
      } else {
        console.log('Il gioco non è ancora pronto.');
      }
    })
    .catch(error => console.error("Errore nel segnare il giocatore come pronto:", error));
  }
  

function showGameStartPopup() {
    
    const gameStartPopup = document.createElement('div');
    gameStartPopup.classList.add('fixed', 'top-1/2', 'left-1/2', 'bg-green-500', 'text-white', 'py-2', 'px-4', 'rounded-lg', 'shadow-lg', 'z-50');
    gameStartPopup.innerHTML = '<strong>La partita è iniziata!</strong>';
    document.body.appendChild(gameStartPopup);

    setTimeout(() => {
        gameStartPopup.remove();
        console.log("Popup rimosso"); // Debug per verificare se il popup viene rimosso
    }, 2000);
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

function getChapter() {
    const title = document.getElementById('chapter-title').value.trim();
    const editorContent = editor.getText().trim(); // Assumendo che Quill sia inizializzato come `quill`
    const currentUser = localStorage.getItem('username');

    // Conta le parole nel contenuto dell'editor
    const wordCount = editorContent ? editorContent.split(/\s+/).length : 0;

    // Verifica se il titolo è vuoto o ci sono meno di 100 parole
    if (!title) {
        alert('Il titolo è obbligatorio!');
        return;
    }
    if (wordCount < 100) {
        alert('Il contenuto deve avere almeno 100 parole!');
        return;
    }

    const data = {
        title: title,
        content: editorContent,
        currentUser: currentUser
    };
    saveChapterChangeTurn(data)

};

function saveChapterChangeTurn(data){
    const gameId = window.location.pathname.split('/')[2];

    fetch(`/saveChapterChangeTurn/${gameId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Errore durante il salvataggio del capitolo.');
        }
        return response.json();
    })
    .then(result => {
        document.getElementById('chapter-title').value = '';  // Reset del titolo
        editor.setText('');
        localStorage.removeItem('chapterContent');
    })
    .catch(error => {
        console.error('Errore:', error);
        alert('Si è verificato un errore durante l\'invio.');
    });
}



/// quill editor initialization ///

const toolbarOptions = [
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'align': [] }],
    [{ 'header': '1' }, { 'header': '2' }],
    [{ 'size': ['small', 'medium', 'large'] }],  // Modifica le opzioni di size
    ['clean']
];

// Inizializza Quill
editor = new Quill('#editor-container', {
    theme: 'snow',
    modules: {
        toolbar: toolbarOptions
    },
});

const toolbar = document.querySelector('.ql-toolbar');
toolbar.classList.add('rounded', 'mb-4', 'text-2xl');

let writingTimeout;


function getChapterFromLocal() {
    const savedContent = localStorage.getItem('chapterContent'); // Ottieni il contenuto salvato
    if (savedContent) {
      editor.root.innerHTML = savedContent; // Carica il contenuto nell'editor
    }
};

getChapterFromLocal()


function handleEditorAccess(currentPlayer, currentUser) {
    const sendButton = document.getElementById('send-chapter-button');
    if (!sendButton) {
        console.error("Pulsante 'send-chapter-button' non trovato.");
        return;
    }

    if (currentPlayer.username === currentUser) {
        editor.enable(true); // Abilita l'editor
        sendButton.classList.remove('hidden'); // Mostra il pulsante
    } else {
        editor.enable(false); // Disabilita l'editor
        sendButton.classList.add('hidden'); // Nascondi il pulsante
    }
}


async function abandonGame() {
    const gameId = sessionStorage.getItem("game_id");
    const abandonButton = document.getElementById('abandon-game-button');
    try {
        abandonButton.disabled = true;

        const response = await fetch(`/abandon-game/${gameId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Errore nella fetch: ${response.status} - ${response.statusText}`);
        }
    } catch (error) {
        console.error('Errore durante l\'abbandono del gioco:', error);
        alert('Errore durante l\'abbandono del gioco. Riprova.');
    } finally {
        abandonButton.disabled = false;
    }
}


function updateChaptersDisplay(chaptersData) {
    const updatesList = document.getElementById('updates-list');
    
    // Aggiungi ogni capitolo alla lista
    chaptersData.forEach(chapter => {
        const newUpdate = document.createElement('div'); // Usa un <div> invece di un <li>
        newUpdate.classList.add('bg-gray-100', 'p-4', 'mb-4', 'rounded-lg', 'shadow-md'); // Classi Tailwind

        // Creazione della struttura per ogni capitolo
        newUpdate.innerHTML = `
            <div class="font-semibold text-xl mb-2">
                <strong>Titolo:</strong> "${chapter.title}"
            </div>
            <div class="text-gray-600 text-lg mb-2">
                <em>Autore:</em> ${chapter.author}
            </div>
            <div class="text-gray-800 text-base">
                <p>${chapter.content}</p>
            </div>
        `;
        updatesList.appendChild(newUpdate);
    });
}


function foxAnimation() {
    console.log('fox animation started');
    
    const currentPlayer = JSON.parse(sessionStorage.getItem('currentPlayer'));
    const currentPlayerUsername = currentPlayer ? currentPlayer.username : null;

    const ownUsername = localStorage.getItem('username');

    // Verifica se i dati sono disponibili
    if (!currentPlayerUsername || !ownUsername) {
        console.error('Errore: dati utente mancanti');
        return;
    }

    // Elementi del DOM
    const foxAnimationsBox = document.getElementById('fox-animations');
    const writingFox = document.getElementById('writing-fox');
    const writingText = document.getElementById('writing-text');
    const thinkingFox = document.getElementById('thinking-fox');
    const thinkingText = document.getElementById('thinking-text');

    // Nascondi tutte le animazioni prima di applicare la logica
    foxAnimationsBox.classList.add('hidden');
    writingFox.classList.add('hidden');
    thinkingFox.classList.add('hidden');
    
    // Confronta i nomi utente
    if (currentPlayerUsername === ownUsername) {
        // Se sono uguali, non mostrare nulla
        foxAnimationsBox.classList.add('hidden');
    } else {
        // Se sono diversi, mostra l'animazione "thinking"
        foxAnimationsBox.classList.remove('hidden');
        thinkingFox.classList.remove('hidden');
        thinkingText.textContent = `${currentPlayerUsername} sta pensando...` // Aggiungi il testo
    }
}

function changeTurnShowPopup(author, nextPlayer) {
    // Crea un div che rappresenta il popup
    const popup = document.createElement('div');
    popup.classList.add('fixed', 'inset-0', 'flex', 'items-center', 'justify-center', 'bg-black', 'bg-opacity-50', 'z-50');

    // Aggiungi il contenuto del popup
    popup.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full text-center">
            <p class="text-lg font-semibold text-gray-800">
                <span class="font-bold text-blue-600">${author}</span> ha scritto un nuovo capitolo!
            </p>
            <p class="mt-2 text-gray-600">
                Ora è il turno di <span class="font-bold text-blue-600">${nextPlayer.username}</span>.
            </p>
            <button class="mt-4 bg-green-500 text-white py-2 px-4 rounded-full hover:bg-green-400 focus:outline-none" onclick="closeChangeTurnPopup(this)">
                OK
            </button>
        </div>
    `;

    // Aggiungi il popup al body
    document.body.appendChild(popup);
}

// Funzione per chiudere il popup quando l'utente clicca su "OK"
function closeChangeTurnPopup(button) {
    const popupContainer = button.closest('.fixed'); // Trova il contenitore del popup
    popupContainer.remove(); // Rimuovi il popup dal DOM
}




    











