
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
    console.log(`Inizializzazione del gioco con ID: ${game_id}`);
    initializeSocket(game_id)
    checkGameData(game_id)
    const game_status = sessionStorage.getItem("game_status");
    if (game_status) {
        console.log(`game_status found`);

        console.log(`game_status: ${game_status}`);
        if (game_status === "to_start") {
            console.log(`game_status is equals to_start`);
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
    console.log(`turnOrderData in checkGameData: ${turnOrderData}`)
    console.log(`currentTurnData in checkGameData: ${currentPlayer}`)


    if (turnOrderData && currentPlayer) {
        updateCurrentPlayerDisplay(currentPlayer)
        updateTurnOrderDisplay(turnOrderData)
        console.log("Calling handleEditorAccess in 'if' with:");
        console.log("currentPlayer:", currentPlayer);
        console.log("currentUser:", currentUser);
        handleEditorAccess(currentPlayer, currentUser);

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
                console.log("Calling handleEditorAccess in 'else' with:");
                console.log("currentPlayer:", currentPlayer);
                console.log("currentUser:", currentUser);
                handleEditorAccess(currentPlayer, currentUser);

            })
            .catch(error => {
                console.error("Errore durante il recupero dei dati del gioco:", error);
            });
    }
}

async function getCurrentGameData(game_id) {
    try {
        console.log(`sending fetch to "/game-data/${game_id}"`)
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
    try {
        if (!game_id) {
            console.error("Errore: gameId non trovato nell'URL");
            return;
        }
        console.log(`Apertura connessione WebSocket per gameId: ${game_id}`);

        const socket = io();

        socket.on('gameUpdate', (data) => {
            try {
                updateCountdownDisplay(data.formatted);
                console.log(`Tempo rimanente: ${data.formatted}`);
            } catch (error) {
                console.error("Errore durante updateCountdownDisplay:", error);
            }
        });

        socket.on('playerJoined', (data) => {
            console.log(`Messaggio ricevuto dal server: ${data.message}`);
        });

        socket.on('connect', () => {
            console.log(`Connesso al server con ID socket: ${socket.id}`);
            socket.emit('joinNewGame', { gameId: game_id });
            console.log(`Emesso joinNewGame con game_id: ${game_id}`);
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
    console.log(`currentPlayer in checkGameData: ${currentPlayer}`)

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

function updateTurnOrderDisplay(turnOrder) {

    const turnOrderDisplay = document.getElementById('turn-order');
    console.log(`turnOrderDisplay in checkGameData: ${turnOrderDisplay}`)

    if (turnOrderDisplay) {
        const turnOrderHTML = turnOrder.map((player, index) => {
            const avatarSrc = getAvatarSrc(player.avatar);
            return `
            <div class="turn-order-item flex flex-col items-center ">
                <div class="p-2 h-20 w-20 flex flex-col items-center rounded bg-white">
                <img src="${avatarSrc}" alt="Avatar" class="w-8 h-8 rounded-full mb-1" />
                <span class="text-sm font-medium">${player.username}</span>
                </div>
                <span class="text-sm font-medium mt-2">${index + 1}°</span>
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
    const editorContent = quill.getText().trim(); // Assumendo che Quill sia inizializzato come `quill`
    
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
        content: editorContent
    };
    sendChapter(data)

};

function saveChapterChangeTurn(data){
    fetch('/saveChapter', {
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
        alert('Capitolo inviato con successo!');
        console.log(result);
    })
    .catch(error => {
        console.error('Errore:', error);
        alert('Si è verificato un errore durante l\'invio.');
    });
}



/// quill editor initialization ///

const toolbarOptions = [
    ['bold', 'italic', 'underline'],     
    [{ 'list': 'ordered'}, { 'list': 'bullet' }], 
    [{ 'align': [] }],                     
    [{ 'header': '1' }, { 'header': '2' }],
    [{ 'size': ['small', 'medium', 'large', 'huge'] }],
    ['clean']                           
  ];
  
  // Inizializza Quill
  const editor = new Quill('#editor-container', {
    theme: 'snow',                         // Tema 'snow'
    modules: {
      toolbar: toolbarOptions              // Usa la barra degli strumenti configurata
    },
  });

const toolbar = document.querySelector('.ql-toolbar');
toolbar.classList.add('rounded', 'mb-4', 'text-2xl')


function getChapter() {
    const savedContent = localStorage.getItem('chapterContent'); // Ottieni il contenuto salvato
    if (savedContent) {
      editor.root.innerHTML = savedContent; // Carica il contenuto nell'editor
    }
};

editor.on('text-change', function() {
    const content = editor.root.innerHTML;
    localStorage.setItem('chapterContent', content); // Salva il contenuto nell'localStorage
});

getChapter()

function handleEditorAccess(currentPlayer, currentUser) {
    console.log(`handleEditorAccess initialized inside function`)

    const sendButton = document.getElementById('send-chapter-button');
    console.log(`player turn: ${currentPlayer.username}`);
    console.log(`currentUser: ${currentUser}`);

    if (!sendButton) {
        console.error("Pulsante 'send-chapter-button' non trovato.");
        return;
    }

    if (currentPlayer.username === currentUser) {
        editor.enable(true); // Abilita l'editor
        sendButton.classList.remove('hidden'); // Mostra il pulsante
        console.log("Editor abilitato e pulsante visibile per il giocatore di turno.");
    } else {
        editor.enable(false); // Disabilita l'editor
        sendButton.classList.add('hidden'); // Nascondi il pulsante
        console.log("Editor disabilitato e pulsante nascosto per altri giocatori.");
    }
}






