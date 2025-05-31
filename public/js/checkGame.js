let editor;
let game_id;
const user_id = Number(localStorage.getItem("user_id"));
let unreadMessages = {};

document.addEventListener("DOMContentLoaded", function () {
    fetchUserData();
});

async function fetchUserData() {
    try {
        const urlPath = window.location.pathname;
        const urlGameId = urlPath.split("/").pop();
        const response = await fetch("/profile/user-data");
        if (!response.ok)
            throw new Error("Errore nel recupero dei dati utente");

        const data = await response.json();

        if (data.status === "in_game" && data.games.hasOwnProperty(urlGameId)) {
            game_id = urlGameId;
            initializeGame(game_id);
        } else {
            window.location.href = `/dashboard/${data.username}`;
        }
    } catch (error) {
        console.error("Errore nel recupero dei dati utente:", error);
    }
}

async function initializeGame(game_id) {
    initializeSocket(game_id);
    try {
        const response = await fetch(`/game/game-status/${game_id}`);
        if (!response.ok)
            throw new Error("Errore nel recupero dello stato del gioco");

        const data = await response.json();
        if (data.status === "to-start") {
            const popup = document.getElementById("popup-start-countdown");
            popup.classList.remove("hidden");
            popup.classList.add("flex");

            if (data.alreadyReady) {
                waitingSpinning();
            }
        }
    } catch (error) {
        console.error("Errore nel recupero dello stato del gioco:", error);
    }

    fetchGameData(game_id);
}

async function fetchGameData(game_id) {
    try {
        const response = await fetch(`/game/game-data/${game_id}`);
        if (!response.ok)
            throw new Error("Errore nel recupero dei dati del gioco");

        const data = await response.json();
        updateCurrentPlayerDisplay(data.currentPlayer);
        updateTurnOrderDisplay(data.turnOrder);
        handleEditorAccess(
            data.currentPlayer,
            localStorage.getItem("username")
        );

        updateChaptersDisplay(data.chapters);
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

    container.innerHTML = "";

    chapters.forEach((chapter, index) => {
        const chapterBox = document.createElement("div");
        chapterBox.className =
            "p-3 border rounded-lg bg-gray-200 cursor-pointer hover:bg-gray-300 transition";
        chapterBox.textContent = `Capitolo ${index + 1}: ${chapter.title}`;

        container.appendChild(chapterBox);
    });

    modal.classList.remove("hidden");
    modal.classList.add("flex");
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
            showGameStartPopup();
        });

        socket.on("gameCompleted", () => {
            const existingPopup = document.getElementById("change-turn-popup");
            if (existingPopup) {
                existingPopup.remove();
            }

            sessionStorage.clear();

            const popup = document.getElementById("end-game-popup");
            const popupText = document.getElementById("end-game-text");
            const username = localStorage.getItem("username");
            const closeBtn = document.getElementById("end-game-redirect");

            popupText.textContent = "Un nuovo racconto ha preso vita!";
            popup.classList.remove("hidden");
            popup.classList.add("flex");

            const confAnimation = lottie.loadAnimation({
                container: document.getElementById(
                    "confetti-animation-container"
                ),
                renderer: "svg",
                loop: true,
                autoplay: true,
                path: "/animations/confetti_animation.json",
            });
            confAnimation.setSpeed(2);

            closeBtn.onclick = () => {
                window.location.href = `/dashboard/${username}`;
            };

            setTimeout(() => {
                window.location.href = `/dashboard/${username}`;
            }, 20000);
        });

        socket.on("gameCanceled", (data) => {
            const existingPopup = document.getElementById("change-turn-popup");
            if (existingPopup) {
                existingPopup.remove();
            }
            showGameCanceledPopup(
                data.reason || "La partita è stata annullata."
            );
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
                displayReceivedMessage(messageText, avatar, username);
                socket.emit("chatRead", {
                    game_id: game_id,
                    user_id: user_id,
                    readUntil: sentAt,
                });
            } else {
                if (!unreadMessages[game_id]) {
                    unreadMessages[game_id] = [];
                }

                unreadMessages[game_id].push({
                    messageText,
                    avatar,
                    username,
                    sentAt,
                });

                displayNotificationSymbol();
            }
        });

        socket.on("newChapterNotification", ({ timestamp, gameId }) => {
            socket.emit("chapterRead", {
                game_id: gameId,
                readUntil: timestamp,
                user_id,
            });
        });

        socket.on("chatStatus", ({ allMessagesRead, chat, game_id }) => {
            if (!allMessagesRead) {
                displayNotificationSymbol();
            }

            if (!unreadMessages[game_id]) {
                unreadMessages[game_id] = [];
            }

            chat.forEach((message) => {
                const { messageText, avatar, username, sentAt } = message;
                unreadMessages[game_id].push({
                    messageText,
                    avatar,
                    username,
                    sentAt,
                });
            });
        });

        socket.on("gameUpdate", (data) => {
            try {
                updateCountdownDisplay(data.formatted);
            } catch (error) {
                console.error("Errore durante updateCountdownDisplay:", error);
            }
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

function showGameCanceledPopup(message) {
    const overlay = document.createElement("div");
    overlay.className =
        "fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50";

    overlay.innerHTML = `
        <div class="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center animate-scaleIn">
            <h2 class="text-2xl font-bold mb-4 text-red-600">Partita Annullata</h2>
            <p class="text-gray-700 mb-6">${message}</p>
            <button id="backToDashboardBtn" onclick="dashboardButton()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition">
                Torna alla Dashboard
            </button>
        </div>
    `;

    document.body.appendChild(overlay);
}

function dashboardButton() {
    const username = localStorage.getItem("username");
    if (username) {
        window.location.href = `/dashboard/${username}`;
    } else {
        alert("Errore: nome utente non trovato.");
    }
}

let isChatOpen = false;

const toggleChatButton = document.getElementById("toggleChatButton");
const chatContainer = document.getElementById("chatContainer");

toggleChatButton.addEventListener("click", () => {
    isChatOpen = !isChatOpen;
    if (isChatOpen) {
        chatContainer.classList.add("chatVisible");
        chatContainer.classList.remove("chatNotVisible");

        const notificationSymbol =
            document.getElementById("notificationSymbol");
        notificationSymbol.classList.add("hidden");

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
                user_id: user_id,
                readUntil: lastMessage.sentAt,
            });
        }
        unreadMessages = {};
    } else {
        chatContainer.classList.add("chatNotVisible");
        chatContainer.classList.remove("chatVisible");
    }
});

function displayNotificationSymbol() {
    const notificationSymbol = document.getElementById("notificationSymbol");
    notificationSymbol.classList.remove("hidden");
}

const sendMessageButton = document.getElementById("sendMessageButton");

sendMessageButton.addEventListener("click", () => {
    if (!game_id) {
        return;
    }
    const messageInput = document.getElementById("messageInput");
    const messageText = messageInput.value.trim();

    if (!messageText || !user_id || !game_id) return;

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
        "p-2 mb-2 rounded text-gray-700 flex items-start gap-2 justify-end";
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

    const wrapper = document.createElement("div");
    wrapper.className =
        "p-2 mb-2 bg-gray-100 rounded text-gray-700 flex items-start gap-2";

    wrapper.innerHTML = `
        <img src="/images/avatars/${avatar}.png" alt="Avatar" class="w-4 h-4 rounded-lg" />
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

function waitingSpinning() {
    document.getElementById("box-confirm-ready").classList.add("hidden");
    document.getElementById("waiting-gif").classList.remove("hidden");
}

function buttonStartGame() {
    document.getElementById("box-confirm-ready").classList.add("hidden");
    document.getElementById("waiting-gif").classList.remove("hidden");

    fetch(`/game/player-ready/${game_id}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ game_id }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.status === "in-progress") {
                sessionStorage.setItem("game_status", "in_progress");
                showGameStartPopup();
            } else {
                return;
            }
        })
        .catch((error) =>
            console.error("Errore nel segnare il giocatore come pronto:", error)
        );
}

function showGameStartPopup() {
    document.getElementById("popup-start-countdown").classList.add("hidden");
    document.getElementById("popup-start-countdown").classList.remove("flex");
    const gameStartPopup = document.createElement("div");
    gameStartPopup.classList.add(
        "fixed",
        "inset-0",
        "flex",
        "items-center",
        "justify-center",
        "z-50"
    );
    gameStartPopup.innerHTML = "<strong>La partita è iniziata!</strong>";
    document.body.appendChild(gameStartPopup);

    setTimeout(() => {
        gameStartPopup.remove();
    }, 2000);
}

/// update game UI ///

function updateCountdownDisplay(formattedTime) {
    const countdownDisplay = document.getElementById("countdown-display");
    if (countdownDisplay) {
        countdownDisplay.textContent = formattedTime;
    }
}

function updateCurrentPlayerDisplay(currentPlayer) {
    currentTurnDisplay = document.getElementById("current-turn");
    if (currentTurnDisplay && currentPlayer) {
        const avatarSrc = getAvatarSrc(currentPlayer.avatar);

        const currentUser = localStorage.getItem("username");
        const isMyTurn = currentPlayer.username === currentUser;
        const turnText = isMyTurn ? "il tuo turno" : ``;

        currentTurnDisplay.innerHTML = `
        <div class="flex items-center justify-center gap-4 bg-gradient-to-r from-blue-400 to-purple-500  px-4 py-3 rounded-xl shadow">
        <div class="lg:text-xl md:text-lg sm:text-md font-semibold text-white whitespace-nowrap"> ${turnText} </div>
            ${
                !isMyTurn
                    ? `
            <div class="flex items-center gap-4">
            <p class=" lg:text-lg md:text-lg sm:text-md font-semibold text-white">${currentPlayer.username}</p>
                <div class="size-10 rounded-lg overflow-hidden shadow-2xl flex items-center justify-center relative">
                    <img src="${avatarSrc}" alt="Avatar" class="w-full h-full " />
                </div>
            </div>
            `
                    : ""
            }
        </div>
    `;
    } else if (currentTurnDisplay) {
        currentTurnDisplay.textContent = `Turno corrente non trovato!`;
    }
}

function updateTurnOrderDisplay(turnOrder) {
    const turnOrderDisplay = document.getElementById("turn-order");

    if (turnOrderDisplay) {
        const turnOrderHTML = turnOrder
            .map((player, index) => {
                const avatarSrc = getAvatarSrc(player.avatar);
                return `
            <div class="turn-order-item flex flex-col items-center justify-center">
                <div class=" size-10 flex flex-col items-center rounded-lg overflow-hidden bg-gray-100 shadow-2xl mb-2">
                    <img src="${avatarSrc}" alt="Avatar" class="w-full h-full" />
                </div>
                <span class="text-sm md:text-white font-medium">${player.username}</span>
            </div>
        `;
            })
            .join("");

        turnOrderDisplay.innerHTML = turnOrderHTML;
    }
}

function getAvatarSrc(avatar) {
    return avatar
        ? `/images/avatars/${avatar}.png`
        : "/images/avatars/default-avatar.png";
}

function getChapter() {
    const title = document.getElementById("chapter-title").value.trim();
    const editorContent = editor.getText().trim();
    const currentUser = localStorage.getItem("username");

    const wordCount = editorContent ? editorContent.split(/\s+/).length : 0;

    if (!title) {
        showError("Il titolo è obbligatorio!");
        return;
    }
    if (wordCount < 100) {
        showError("Il contenuto deve avere almeno 100 parole!");
        return;
    }

    const data = {
        title: title,
        content: editorContent,
        currentUser: currentUser,
    };
    saveChapterChangeTurn(data);
}

function showError(message) {
    const popup = document.getElementById("error-more-info-chapter");
    const text = document.getElementById("error-chapter-text");

    text.textContent = message;

    popup.classList.remove("hidden", "opacity-0");
    popup.classList.add("opacity-100");

    setTimeout(() => {
        popup.classList.remove("opacity-100");
        popup.classList.add("opacity-0");

        setTimeout(() => {
            popup.classList.add("hidden");
        }, 300);
    }, 2000);
}

function saveChapterChangeTurn(data) {
    const gameId = window.location.pathname.split("/")[2];

    fetch(`/game/save-chapter-change-turn/${gameId}`, {
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
            document.getElementById("chapter-title").value = "";
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
    [{ size: ["small", "medium", "large"] }],
    ["clean"],
];

editor = new Quill("#editor-container", {
    theme: "snow",
    modules: {
        toolbar: toolbarOptions,
    },
});

const qlEditor = document.querySelector(".ql-editor");

qlEditor.setAttribute("spellcheck", "false");
qlEditor.setAttribute("autocorrect", "off");
qlEditor.setAttribute("autocapitalize", "off");
qlEditor.setAttribute("autocomplete", "off");

const gameIdQuill = window.location.pathname.split("/")[2];

function salvaDraft() {
    const contenuto = editor.root.innerHTML;
    localStorage.setItem("draft-" + gameIdQuill, contenuto);
}

function debounce(callback, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            callback(...args);
        }, delay);
    };
}

const saveDraftDebounced = debounce(salvaDraft, 3000);

editor.on("text-change", () => {
    saveDraftDebounced();
});

const savedDraft = localStorage.getItem("draft-" + gameIdQuill);
if (savedDraft) {
    editor.root.innerHTML = savedDraft; // Carica il contenuto nel Quill
}

function clearDraft() {
    localStorage.removeItem("draft-" + gameIdQuill);
    editor.root.innerHTML = "";
}

// editor.root.addEventListener("paste", function (e) {
//     e.preventDefault();
//     alert("Non puoi incollare testo. Devi scrivere manualmente.");
// });

const toolbar = document.querySelector(".ql-toolbar");
toolbar.classList.add("rounded", "mb-4", "text-2xl");

let writingTimeout;

function getChapterFromLocal() {
    const savedContent = localStorage.getItem("chapterContent");
    if (savedContent) {
        editor.root.innerHTML = savedContent;
    }
}

getChapterFromLocal();

function handleEditorAccess(currentPlayer, currentUser) {
    const sendChapterButton = document.getElementById("send-chapter-button");
    if (!sendChapterButton) {
        console.error("Pulsante 'send-chapter-button' non trovato.");
        return;
    }

    if (currentPlayer.username === currentUser) {
        editor.enable(true);
        sendChapterButton.classList.remove("hidden");
    } else {
        editor.enable(false);
        sendChapterButton.classList.add("hidden");
    }
}

function updateChaptersDisplay(chaptersData) {
    const bookSwiperWrapper = document.querySelector(
        ".book-chapters-container"
    );
    let count = bookSwiperWrapper.querySelectorAll(".swiper-slide").length;
    const placeholder = document.querySelector(".placeholder-title");

    chaptersData.forEach((chapter) => {
        if (placeholder) {
            placeholder.remove();
        }
        const bookSlide = document.createElement("div");
        bookSlide.classList.add(
            "swiper-slide",
            "bg-gray-50",
            "shadow-md",
            "rounded-xl",
            "py-4",
            "md:px-8",
            "px-4",
            "flex",
            "h-full"
        );

        bookSlide.innerHTML = `
        <div class="flex flex-col w-full h-full md:gap-8 gap-4">
            <div class="flex flex-row gap-4">
                <div class="text-gray-600 font-bold text-lg">
                    Capitolo ${count + 1}
                </div>
                <div class="text-gray-600 text-lg">
                    <em>Autore:</em> ${chapter.author}
                </div>
            </div>
            <div class="font-semibold text-lg">
                <strong>Titolo:</strong> ${chapter.title}
            </div>

            <div class="text-gray-800 md:text-xl text-md pr-4 text-base h-full overflow-y-auto leading-relaxed">
                <p>${chapter.content}</p>
            </div>
        </div>
    `;
        bookSwiperWrapper.appendChild(bookSlide);
        count++;
    });
    if (window.swiper) {
        window.swiper.update();
    } else {
        window.swiper = new Swiper(".mySwiper", {
            effect: "cards",
            grabCursor: true,
        });
    }
}

function changeTurnShowPopup(author, nextPlayer) {
    const existingPopup = document.getElementById("change-turn-popup");
    if (existingPopup) {
        existingPopup.remove();
    }
    const popup = document.createElement("div");
    popup.id = "change-turn-popup";
    popup.classList.add(
        "fixed",
        "inset-0",
        "flex",
        "items-center",
        "justify-center",
        "z-40",
        "p-12"
    );

    popup.innerHTML = `
        <div class="bg-gray-200 p-6 rounded-lg shadow-lg max-w-sm w-full text-center">
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

    document.body.appendChild(popup);
}

function closeChangeTurnPopup(button) {
    const popupContainer = button.closest(".fixed");
    popupContainer.remove();
}

function openGameInfo() {
    const container = document.getElementById("game-info-container");
    container.classList.remove("hidden");
    container.classList.add(
        "fixed",
        "top-0",
        "left-0",
        "right-0",
        "bottom-0",
        "z-50",
        "overflow-auto",
        "bg-white"
    );
}

function closeGameInfo() {
    const container = document.getElementById("game-info-container");
    container.classList.add("hidden");
    container.classList.remove(
        "fixed",
        "top-0",
        "left-0",
        "right-0",
        "bottom-0",
        "z-50",
        "overflow-auto",
        "bg-white"
    );
}

function openBookOverlay() {
    const bookOverlay = document.getElementById("overlay-books");
    bookOverlay.classList.add("open");

    setTimeout(() => {
        document.body.style.overflow = "";
    }, 500);
}

function closeBookOverlay() {
    const bookOverlay = document.getElementById("overlay-books");
    bookOverlay.classList.remove("open");

    setTimeout(() => {
        document.body.style.overflow = "";
    }, 500);
}
