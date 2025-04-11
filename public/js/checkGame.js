let editor;
let game_id;
const user_id = Number(localStorage.getItem("user_id"));
let unreadMessages = {};

window.onload = function initialize() {
    fetchUserData();
};

async function fetchUserData() {
    try {
        const urlPath = window.location.pathname;
        const urlGameId = urlPath.split("/").pop(); // Ottiene l'ID del gioco dall'URL

        console.log("Game ID from URL:", urlGameId);

        // Fetch per ottenere lo stato dell'utente
        const response = await fetch("/userData");
        if (!response.ok)
            throw new Error("Errore nel recupero dei dati utente");

        const data = await response.json();
        console.log("Dati utente:", data);

        if (data.status === "in_game" && data.games.hasOwnProperty(urlGameId)) {
            game_id = urlGameId;
            initializeGame(game_id);
        } else {
            console.log("Non stai partecipando a questa partita");
            window.location.href = `/dashboard/${data.username}`;
        }
    } catch (error) {
        console.error("Errore nel recupero dei dati utente:", error);
    }
}

async function initializeGame(game_id) {
    initializeSocket(game_id);
    console.log("checkGameData in partenza");

    try {
        // Fetch per ottenere lo stato del gioco
        const response = await fetch(`/game-status/${game_id}`);
        if (!response.ok)
            throw new Error("Errore nel recupero dello stato del gioco");

        const data = await response.json();
        if (data.status === "to-start") {
            document
                .getElementById("popup-start-countdown")
                .classList.remove("hidden");
        }
    } catch (error) {
        console.error("Errore nel recupero dello stato del gioco:", error);
    }

    fetchGameData(game_id);
}

async function fetchGameData(game_id) {
    try {
        const response = await fetch(`/game-data/${game_id}`);
        if (!response.ok)
            throw new Error("Errore nel recupero dei dati del gioco");

        const data = await response.json();
        console.log("Dati gioco:", data);
        console.log(`questo lo status del game: ${data.status}`);

        if (data.status === "awaiting_scores") {
            // Se lo status è "awaiting_scores", esegui un'altra logica
            console.log("Dati gioco ricevuti:", data);

            console.log("Il gioco è in attesa dei punteggi.");
            // Puoi aggiungere un altro comportamento qui, per esempio, mostrare una notifica che aspetta i punteggi
            openScoreModal(data.chapters); // Apri il modale con i capitoli
        }
        console.log(`lo status del game é in_game`);
        // Se lo status è "in_game", esegui tutto ciò che c'è
        updateCurrentPlayerDisplay(data.currentPlayer);
        updateTurnOrderDisplay(data.turnOrder);
        handleEditorAccess(
            data.currentPlayer,
            localStorage.getItem("username")
        );
        foxAnimation();

        // Fetch per i capitoli del gioco
        fetchGameChapters(game_id);
    } catch (error) {
        console.error("Errore durante il recupero dei dati del gioco:", error);
    }
}

function openScoreModal(chapters) {
    const modal = document.getElementById("scoreModal");
    const container = document.getElementById("chaptersContainer");

    if (!Array.isArray(chapters)) {
        console.error("Errore: chapters non è un array!", chapters);
        return;
    }

    // Svuota il contenitore
    container.innerHTML = "";

    // Crea le box per i capitoli
    chapters.forEach((chapter, index) => {
        const chapterBox = document.createElement("div");
        chapterBox.className =
            "p-3 border rounded-lg bg-gray-200 cursor-pointer hover:bg-gray-300 transition";
        chapterBox.textContent = `Capitolo ${index + 1}: ${chapter.title}`;

        // Aggiunge il capitolo al contenitore
        container.appendChild(chapterBox);
    });

    // Mostra il modale
    modal.classList.remove("hidden");
}

async function fetchGameChapters(game_id) {
    try {
        const response = await fetch(`/games/${game_id}/chapters`);
        if (!response.ok) throw new Error("Errore nel recupero dei capitoli");

        const chaptersData = await response.json();
        updateChaptersDisplay(chaptersData);
    } catch (error) {
        console.error("Errore nel recupero dei capitoli:", error);
    }
}

function initializeSocket(game_id) {
    game_id;
    try {
        if (!game_id) {
            console.error("Errore: gameId non trovato nell'URL");
            return;
        }

        socket = io();

        socket.on("game-ready-popup", () => {
            console.log("Evento 'game-ready-popup' ricevuto"); // Debug per confermare la ricezione
            showGameStartPopup(); // Mostra il popup
        });

        socket.on("gameCompleted", () => {
            // Recupera gli elementi del nuovo popup
            sessionStorage.clear();
            const newPopup = document.getElementById("new-popup-message");
            const newPopupText = document.getElementById("new-popup-text");
            const newPopupClose = document.getElementById("new-popup-close");

            newPopupText.textContent =
                "Congratulazioni, un nuovo racconto ha preso vita!";

            newPopup.classList.remove("hidden");
            newPopupClose.removeEventListener("click", handleNewPopupClose);
            newPopupClose.addEventListener("click", handleNewPopupClose);

            function handleNewPopupClose() {
                const username = localStorage.getItem("username");
                newPopup.classList.add("hidden");
                window.location.href = `/dashboard/${username}`;
            }
        });

        socket.on("nextChapterUpdate", (data) => {
            let activeGames =
                JSON.parse(sessionStorage.getItem("active_games")) || {};
            const game_id = data.gameId;

            if (activeGames[game_id]) {
                activeGames[game_id].currentPlayer = data.nextPlayer;
                sessionStorage.setItem(
                    "active_games",
                    JSON.stringify(activeGames)
                );
            }

            const newChapter = data.chapter;
            updateChaptersDisplay([newChapter]);

            const currentUser = localStorage.getItem("username");
            foxAnimation();
            handleEditorAccess(data.nextPlayer, currentUser);
            updateCurrentPlayerDisplay(data.nextPlayer);

            if (currentUser !== data.previousAuthor) {
                changeTurnShowPopup(data.previousAuthor, data.nextPlayer);
            }
        });

        socket.on("receiveChatMessage", (messageData) => {
            const { game_id, messageText, avatar, username, sentAt } =
                messageData;

            if (isChatOpen) {
                console.log("message read:");

                displayReceivedMessage(messageText, avatar, username);
                socket.emit("chatRead", {
                    game_id: game_id,
                    user_id: user_id, // o recuperalo dal contesto auth
                    readUntil: sentAt,
                });
            } else {
                // Se la chat non è aperta, salva il messaggio nell'oggetto unreadMessages
                if (!unreadMessages[game_id]) {
                    unreadMessages[game_id] = [];
                }

                unreadMessages[game_id].push({
                    messageText,
                    avatar,
                    username,
                    sentAt,
                });
                console.log("message not read:");
                console.log("unreadMessages:", unreadMessages);

                // Mostra il simbolo di notifica
                displayNotificationSymbol();
            }
        });

        socket.on("newChapterNotification", ({ timestamp, gameId }) => {
            // Solo conferma lettura col timestamp
            socket.emit("chapterRead", {
                game_id: gameId,
                readUntil: timestamp,
                user_id,
            });
        });

        socket.on("chatStatus", ({ allMessagesRead, chat, game_id }) => {
            if (!allMessagesRead) {
                // Condizione corretta per i messaggi non letti
                console.log("Ci sono messaggi non letti.");
                displayNotificationSymbol();
            } else {
                console.log("Tutti i messaggi sono stati letti.");
            }

            console.log(`read status: ${allMessagesRead}`);

            // Salva i messaggi nell'oggetto unreadMessages
            if (!unreadMessages[game_id]) {
                unreadMessages[game_id] = []; // inizializza un array se non esiste già
            }

            // Salva tutti i messaggi ricevuti
            chat.forEach((message) => {
                const { messageText, avatar, username, sentAt } = message;
                unreadMessages[game_id].push({
                    messageText,
                    avatar,
                    username,
                    sentAt,
                });
            });

            console.log("unreadMessages:", unreadMessages);
        });

        socket.on("awaiting_scores", (data) => {
            console.log("Awaiting scores event. Opening modal...");
            openScoreModal(data.chapters); // Apri il modale con i capitoli
        });

        socket.on("gameUpdate", (data) => {
            try {
                updateCountdownDisplay(data.formatted);
            } catch (error) {
                console.error("Errore durante updateCountdownDisplay:", error);
            }
        });

        socket.on("playerJoined", (data) => {
            console.log(`Messaggio ricevuto dal server: ${data.message}`);
        });

        socket.on("connect", () => {
            socket.emit("joinNewGame", { gameId: game_id, user_id });
        });
    } catch (error) {
        console.error(
            "Errore durante l'inizializzazione della connessione:",
            error
        );
    }
}

//chat messages

let isChatOpen = false;

const toggleChatButton = document.getElementById("toggleChatButton");
const chatContainer = document.getElementById("chatContainer");

toggleChatButton.addEventListener("click", () => {
    console.log("clicked");
    // Cambia lo stato della chat
    isChatOpen = !isChatOpen;
    console.log("isChatOpen:", isChatOpen);

    // Mostra o nasconde la chat in base allo stato
    if (isChatOpen) {
        console.log("it is open:", isChatOpen);

        chatContainer.classList.add("chatVisible");
        chatContainer.classList.remove("chatNotVisible");

        const notificationSymbol =
            document.getElementById("notificationSymbol");
        notificationSymbol.classList.add("hidden");

        // Visualizza i messaggi non letti
        for (let game_id in unreadMessages) {
            const messages = unreadMessages[game_id];

            messages.forEach((msg) => {
                displayReceivedMessage(
                    msg.messageText,
                    msg.avatar,
                    msg.username
                );
            });
            const lastMessage = messages[messages.length - 1];
            socket.emit("chatRead", {
                game_id: game_id,
                user_id: user_id, // o recuperalo dal contesto auth
                readUntil: lastMessage.sentAt,
            });
            console.log(`chat read event sent`);
        }
        unreadMessages = {}; // Resetta i messaggi non letti
        console.log(`unreadMessages should be empty:`, unreadMessages);
    } else {
        console.log("it is closed:", isChatOpen);

        chatContainer.classList.add("chatNotVisible");
        chatContainer.classList.remove("chatVisible");
    }
});

function displayNotificationSymbol() {
    console.log("New message received! Show notification icon");
    const notificationSymbol = document.getElementById("notificationSymbol");
    notificationSymbol.classList.remove("hidden"); // Rimuove la classe 'hidden' per mostrare il simbolo
}

const sendButton = document.getElementById("sendButton");

sendButton.addEventListener("click", () => {
    if (!game_id) {
        console.log("game_id non è stato ancora impostato!");
        return;
    }
    const messageInput = document.getElementById("messageInput");
    const messageText = messageInput.value.trim();

    if (!messageText || !user_id || !game_id) return;

    console.log(`game_id prima dell'invio ${game_id}`);

    socket.emit("sendChatMessage", {
        game_id: game_id,
        user_id: user_id,
        messageText: messageText,
    });

    messageInput.value = "";
    logMessage(messageText);
});

function logMessage(messageText) {
    const username = localStorage.getItem("username");
    const current_player_avatar = localStorage.getItem(`avatar_${username}`);
    const messageBox = document.getElementById("chatBox");

    const wrapper = document.createElement("div");
    wrapper.className =
        "p-2 mb-2 bg-blue-100 rounded text-gray-700 flex items-start gap-2 justify-end"; // Aggiungi 'justify-end' per allineare a destra
    wrapper.innerHTML = `

    <div>
            <div class="font-semibold text-sm text-gray-800">${
                username || "Anonimo"
            }</div>
            <div class="text-sm">${messageText}</div>
        </div>
    `;
    messageBox.appendChild(wrapper);
    messageBox.scrollTop = messageBox.scrollHeight;
}

function displayReceivedMessage(messageText, avatar, username) {
    const messageBox = document.getElementById("chatBox");

    // Crea il wrapper per il messaggio
    const wrapper = document.createElement("div");
    wrapper.className =
        "p-2 mb-2 bg-gray-100 rounded text-gray-700 flex items-start gap-2";

    // Utilizza innerHTML per creare il contenuto del messaggio
    wrapper.innerHTML = `
        <img src="/images/avatars/${avatar}.png" alt="Avatar" class="w-4 h-4 rounded-full" />
        <div>
            <div class="font-semibold text-sm text-gray-800">${
                username || "Anonimo"
            }</div>
            <div class="text-sm">${messageText}</div>
        </div>
    `;
    messageBox.appendChild(wrapper);
    messageBox.scrollTop = messageBox.scrollHeight;
}

function buttonStartGame() {
    document.getElementById("popup-start-countdown").classList.add("hidden");

    fetch(`/game/${game_id}/player-ready`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ game_id }), // Invia il gameId del gioco
    })
        .then((response) => response.json())
        .then((data) => {
            console.log("Dati ricevuti dal server:", data); // Log per vedere cosa arriva dal server

            if (data.status === "in-progress") {
                // Se il gioco è stato avviato, esegui altre azioni
                sessionStorage.setItem("game_status", "in_progress");
                console.log(
                    "Stato del gioco aggiornato:",
                    sessionStorage.getItem("game_status")
                ); // Log per verificare lo stato nel sessionStorage
                showGameStartPopup();
            } else {
                console.log("Il gioco non è ancora pronto.");
            }
        })
        .catch((error) =>
            console.error("Errore nel segnare il giocatore come pronto:", error)
        );
}

function showGameStartPopup() {
    const gameStartPopup = document.createElement("div");
    gameStartPopup.classList.add(
        "fixed",
        "top-1/2",
        "left-1/2",
        "bg-green-500",
        "text-white",
        "py-2",
        "px-4",
        "rounded-lg",
        "shadow-lg",
        "z-50"
    );
    gameStartPopup.innerHTML = "<strong>La partita è iniziata!</strong>";
    document.body.appendChild(gameStartPopup);

    setTimeout(() => {
        gameStartPopup.remove();
        console.log("Popup rimosso"); // Debug per verificare se il popup viene rimosso
    }, 2000);
}

/// update game UI ///

function updateCountdownDisplay(formattedTime) {
    const countdownDisplay = document.getElementById("countdown-display");
    if (countdownDisplay) {
        countdownDisplay.textContent = formattedTime; // Aggiorna il testo con il tempo rimanente
    }
}

function updateCurrentPlayerDisplay(currentPlayer) {
    const currentTurnDisplay = document.getElementById("current-turn");
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
    const turnOrderDisplay = document.getElementById("turn-order");

    if (turnOrderDisplay) {
        const turnOrderHTML = turnOrder
            .map((player, index) => {
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
            })
            .join("");

        turnOrderDisplay.innerHTML = turnOrderHTML;
    }
}

function getAvatarSrc(avatar) {
    // Controlla se l'avatar è definito, altrimenti usa un avatar di default
    return avatar
        ? `/images/avatars/${avatar}.png`
        : "/images/avatars/default-avatar.png";
}

function getChapter() {
    const title = document.getElementById("chapter-title").value.trim();
    const editorContent = editor.getText().trim(); // Assumendo che Quill sia inizializzato come `quill`
    const currentUser = localStorage.getItem("username");

    // Conta le parole nel contenuto dell'editor
    const wordCount = editorContent ? editorContent.split(/\s+/).length : 0;

    // Verifica se il titolo è vuoto o ci sono meno di 100 parole
    if (!title) {
        alert("Il titolo è obbligatorio!");
        return;
    }
    if (wordCount < 100) {
        alert("Il contenuto deve avere almeno 100 parole!");
        return;
    }

    const data = {
        title: title,
        content: editorContent,
        currentUser: currentUser,
    };
    saveChapterChangeTurn(data);
}

function saveChapterChangeTurn(data) {
    const gameId = window.location.pathname.split("/")[2];

    fetch(`/saveChapterChangeTurn/${gameId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Errore durante il salvataggio del capitolo.");
            }
            return response.json();
        })
        .then((result) => {
            document.getElementById("chapter-title").value = ""; // Reset del titolo
            clearDraft();
        })
        .catch((error) => {
            console.error("Errore:", error);
            alert("Si è verificato un errore durante l'invio.");
        });
}

/// quill editor initialization ///

const toolbarOptions = [
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    [{ header: "1" }, { header: "2" }],
    [{ size: ["small", "medium", "large"] }], // Modifica le opzioni di size
    ["clean"],
];

// Inizializza Quill
editor = new Quill("#editor-container", {
    theme: "snow",
    modules: {
        toolbar: toolbarOptions,
    },
});

// Recuperiamo l'ID della partita dalla URL
const gameIdQuill = window.location.pathname.split("/")[2]; // esempio per ottenere l'ID della partita dalla URL

// Funzione per salvare il draft
function salvaDraft() {
    const contenuto = editor.root.innerHTML; // Otteniamo il contenuto dell'editor
    localStorage.setItem("draft-" + gameIdQuill, contenuto); // Salviamo nel localStorage
    console.log("Draft salvato per la partita " + gameIdQuill);
}

// Funzione debounce
function debounce(callback, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            callback(...args);
        }, delay);
    };
}

// Creiamo la versione debounced della funzione salvaDraft
const saveDraftDebounced = debounce(salvaDraft, 3000);

// Ascoltiamo gli eventi text-change di Quill
editor.on("text-change", () => {
    saveDraftDebounced();
});

// Carichiamo il draft al caricamento della pagina, se esiste
const savedDraft = localStorage.getItem("draft-" + gameIdQuill);
if (savedDraft) {
    editor.root.innerHTML = savedDraft; // Carica il contenuto nel Quill
    console.log("Draft caricato per la partita " + gameIdQuill);
}

// Funzione per pulire il draft quando non serve più
function clearDraft() {
    localStorage.removeItem("draft-" + gameIdQuill); // Rimuove il draft
    editor.root.innerHTML = ""; // Pulisce l'editor
    console.log("Draft cancellato per la partita " + gameIdQuill);
}

// editor.root.addEventListener("paste", function (e) {
//     e.preventDefault();
//     alert("Non puoi incollare testo. Devi scrivere manualmente.");
// });

const toolbar = document.querySelector(".ql-toolbar");
toolbar.classList.add("rounded", "mb-4", "text-2xl");

let writingTimeout;

function getChapterFromLocal() {
    const savedContent = localStorage.getItem("chapterContent"); // Ottieni il contenuto salvato
    if (savedContent) {
        editor.root.innerHTML = savedContent; // Carica il contenuto nell'editor
    }
}

getChapterFromLocal();

function handleEditorAccess(currentPlayer, currentUser) {
    const sendButton = document.getElementById("send-chapter-button");
    if (!sendButton) {
        console.error("Pulsante 'send-chapter-button' non trovato.");
        return;
    }

    if (currentPlayer.username === currentUser) {
        editor.enable(true); // Abilita l'editor
        sendButton.classList.remove("hidden"); // Mostra il pulsante
    } else {
        editor.enable(false); // Disabilita l'editor
        sendButton.classList.add("hidden"); // Nascondi il pulsante
    }
}

function updateChaptersDisplay(chaptersData) {
    const updatesList = document.getElementById("updates-list");

    // Aggiungi ogni capitolo alla lista
    chaptersData.forEach((chapter) => {
        const newUpdate = document.createElement("div"); // Usa un <div> invece di un <li>
        newUpdate.classList.add(
            "bg-gray-100",
            "p-4",
            "mb-4",
            "rounded-lg",
            "shadow-md"
        ); // Classi Tailwind

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
    console.log("fox animation started");

    const currentPlayer = JSON.parse(sessionStorage.getItem("currentPlayer"));
    const currentPlayerUsername = currentPlayer ? currentPlayer.username : null;

    const ownUsername = localStorage.getItem("username");

    // Verifica se i dati sono disponibili
    if (!currentPlayerUsername || !ownUsername) {
        console.error("Errore: dati utente mancanti");
        return;
    }

    // Elementi del DOM
    const foxAnimationsBox = document.getElementById("fox-animations");
    const writingFox = document.getElementById("writing-fox");
    const writingText = document.getElementById("writing-text");
    const thinkingFox = document.getElementById("thinking-fox");
    const thinkingText = document.getElementById("thinking-text");

    // Nascondi tutte le animazioni prima di applicare la logica
    foxAnimationsBox.classList.add("hidden");
    writingFox.classList.add("hidden");
    thinkingFox.classList.add("hidden");

    // Confronta i nomi utente
    if (currentPlayerUsername === ownUsername) {
        // Se sono uguali, non mostrare nulla
        foxAnimationsBox.classList.add("hidden");
    } else {
        // Se sono diversi, mostra l'animazione "thinking"
        foxAnimationsBox.classList.remove("hidden");
        thinkingFox.classList.remove("hidden");
        thinkingText.textContent = `${currentPlayerUsername} sta pensando...`; // Aggiungi il testo
    }
}

function changeTurnShowPopup(author, nextPlayer) {
    // Crea un div che rappresenta il popup
    const popup = document.createElement("div");
    popup.classList.add(
        "fixed",
        "inset-0",
        "flex",
        "items-center",
        "justify-center",
        "bg-black",
        "bg-opacity-50",
        "z-50"
    );

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
    const popupContainer = button.closest(".fixed"); // Trova il contenitore del popup
    popupContainer.remove(); // Rimuovi il popup dal DOM
}
