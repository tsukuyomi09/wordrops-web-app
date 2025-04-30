const user_id = Number(localStorage.getItem("user_id"));

document.addEventListener("DOMContentLoaded", function () {
    const mainSwiper = new Swiper(".swiper-container", {
        loop: true,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        on: {
            slideChangeTransitionEnd: function () {
                // Titoli
                document.querySelectorAll(".slide-title").forEach((el, idx) => {
                    if (idx === mainSwiper.realIndex) {
                        el.classList.add("opacity-100");
                    } else {
                        el.classList.remove("opacity-100");
                    }
                });

                // Immagini
                document.querySelectorAll(".slide-image").forEach((el, idx) => {
                    if (idx === mainSwiper.realIndex) {
                        el.classList.add("opacity-10");
                    } else {
                        el.classList.remove("opacity-10");
                    }
                });
            },
        },
    });

    // Imposta lo stato iniziale
    document
        .querySelectorAll(".slide-title")
        [mainSwiper.realIndex].classList.add("opacity-100");
    document
        .querySelectorAll(".slide-image")
        [mainSwiper.realIndex].classList.add("opacity-10");
});

function showLoadingAnimation() {
    const overlay = document.getElementById("loading-overlay");
    const pagewrap = document.getElementById("pagewrap");
    pagewrap.classList.remove("hidden");

    overlay.classList.remove("hidden");
    overlay.classList.add("opacity-100");

    setTimeout(() => {
        overlay.classList.remove("opacity-100");
        overlay.classList.add("opacity-0");

        setTimeout(() => {
            overlay.classList.add("hidden");
        }, 1000);
    }, 3000);
}

const bookAnimation = lottie.loadAnimation({
    container: document.getElementById("lottie-book"), // Dove inserire l'animazione
    renderer: "svg",
    loop: false, // Non loop
    autoplay: false, // Non parte automaticamente
    path: "/images/new-book-anime.json", // Percorso al tuo file JSON Lottie
});

// Partire con hover
const lottieButton = document.getElementById("lottie-button");

lottieButton.addEventListener("mouseenter", function () {
    bookAnimation.play(); // Inizia animazione on hover
});

lottieButton.addEventListener("mouseleave", function () {
    bookAnimation.stop(); // Ferma l'animazione quando il mouse esce
});

function showAvatarTransition() {
    const avatarContainer = document.querySelector(".avatar-container");
    setTimeout(() => {
        avatarContainer.classList.add("show");
    }, 50);
}

window.addEventListener("load", () => {
    const pagewrap = document.getElementById("pagewrap");

    if (!sessionStorage.getItem("hasVisited")) {
        showLoadingAnimation();
        sessionStorage.setItem("hasVisited", "true");
    } else {
        pagewrap.classList.remove("hidden");
    }
    showAvatarTransition();
});

window.onpopstate = function (event) {
    fetch("/game/game-queue", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Errore HTTP: ${response.status}`);
            }
            setTimeout(() => {
                waitingOverlay.classList.add("hidden");
            }, 1500);
            return response.json();
        })

        .catch((error) => {
            console.error(
                "Errore nella richiesta per abbandonare la coda:",
                error
            );
        });
};

// Aggiungi uno stato iniziale
history.pushState(null, null, location.href);

const formInput = document.getElementById("p-input");
const usernameDashboard = document.getElementById("username");
const waitingOverlay = document.getElementById("waiting-overlay");

let socket;
let socketId = null;
let countdownStarted = false;

function initSocket() {
    return new Promise((resolve, reject) => {
        console.log("Tentativo di connessione a /socket.io...");
        socket = io(); // Prova prima con il percorso predefinito; // Connessione a /socket.io

        // Quando il WebSocket è connesso
        socket.on("connect", () => {
            console.log("Connesso a Socket.IO con ID:", socket.id); // Log con socket.id
            socketId = socket.id;
            resolve(); // Risolvi la promessa
        });

        socket.on("connect_error", (err) => {
            console.error("Errore di connessione:", err);
            reject(err);
        });

        socket.on("connect_timeout", () => {
            console.log("Timeout di connessione.");
            reject("Timeout di connessione");
        });

        // Listener per quando il gioco è pronto
        socket.on("in-queue", (message) => {
            waitingOverlay.classList.remove("hidden");
        });

        socket.on("game-ready", (message) => {
            alert(message); // Mostra l'alert
        });

        socket.on("countdown", (seconds) => {
            if (!countdownStarted) {
                waitingOverlay.classList.add("hidden");
                document.getElementById("countdown-overlay").style.display =
                    "flex";
                countdownStarted = true; // Imposta il flag per evitare di farlo più volte
            }
            document.getElementById("countdown-seconds").innerText = seconds;
        });

        socket.on("gameIdAssigned", (data) => {
            currentGameId = data.gameId;
        });

        socket.on("receiveChatMessage", (messageData) => {
            const { game_id } = messageData;
            console.log("New message for game:", game_id);

            const gameWrapper = document.querySelector(
                `[data-game-id="${game_id}"]`
            );
            if (gameWrapper) {
                const dot = gameWrapper.querySelector(".chat-notification-dot");
                if (dot) {
                    dot.classList.remove("hidden");
                }
            }
        });

        socket.on("chatStatus", ({ allMessagesRead, chat, game_id }) => {
            const gameWrapper = document.querySelector(
                `[data-game-id="${game_id}"]`
            );

            // Controlla se il wrapper per il gioco esiste
            if (gameWrapper) {
                const chatNotificationDot = gameWrapper.querySelector(
                    ".chat-notification-dot"
                );

                if (chatNotificationDot) {
                    if (!allMessagesRead) {
                        // Se ci sono messaggi non letti, rimuovi 'hidden' per visualizzare la notifica
                        chatNotificationDot.classList.remove("hidden");
                        console.log(
                            `Notifica di chat visibile per il gioco ${game_id}`
                        );
                    } else {
                        // Se tutti i messaggi sono letti, mantieni la notifica nascosta
                        chatNotificationDot.classList.add("hidden");
                        console.log(
                            `Notifica di chat nascosta per il gioco ${game_id}`
                        );
                    }
                }
            }
        });

        socket.on("chapterStatus", ({ game_id, hasUnreadChapter }) => {
            console.log(`allChaptersRead = ${hasUnreadChapter}`);
            const gameWrapper = document.querySelector(
                `[data-game-id="${game_id}"]`
            );
            if (!gameWrapper) return;

            const chapterNotificationDot = gameWrapper.querySelector(
                ".chapter-notification-dot"
            );
            if (!chapterNotificationDot) return;

            if (hasUnreadChapter) {
                // Ci sono capitoli non letti, mostra il badge
                chapterNotificationDot.classList.remove("hidden");
            } else {
                // Tutto letto, nascondi il badge
                chapterNotificationDot.classList.add("hidden");
            }
        });

        socket.on("newChapterNotification", ({ timestamp, gameId }) => {
            const gameWrapper = document.querySelector(
                `[data-game-id="${gameId}"]`
            );
            if (gameWrapper) {
                // Trova l'icona di notifica per il nuovo capitolo
                const chapterNotificationDot = gameWrapper.querySelector(
                    ".chapter-notification-dot"
                );
                if (chapterNotificationDot) {
                    // Mostra la notifica per il capitolo
                    chapterNotificationDot.classList.remove("hidden");
                }
            }
            showNotification("NUOVO CAPITOLO", "📚");
        });

        socket.on("gameCanceled", (data) => {
            const canceledGameId = data.gameId;
            const gameWrapper = document.querySelector(
                `[data-game-id="${canceledGameId}"]`
            );

            if (gameWrapper) {
                gameWrapper.remove();
            }

            showNotification("PARTITA ANNULLATA", "❌");
        });

        socket.on("gameCompleted", (data) => {
            const canceledGameId = data.gameId;
            const gameWrapper = document.querySelector(
                `[data-game-id="${canceledGameId}"]`
            );
            if (gameWrapper) {
                gameWrapper.remove();
            }
            showNotification("PARTITA CONCLUSA", "🏆");
        });

        socket.on("gamequeue-cancelled", (message) => {
            // Modifica la UI
            document.getElementById("countdown-seconds").style.display = "none"; // Nascondi il countdown
            document.getElementById("countdown").innerText = message;
            document.getElementById("ready-btn").style.display = "none"; // Nascondi il pulsante "Sono pronto"

            // Dopo 2 secondi, nascondi l'overlay e ripristina la UI
            setTimeout(() => {
                document
                    .getElementById("countdown-overlay")
                    .style.removeProperty("display");
                document.getElementById("countdown-seconds").style.display =
                    "block"; // Rendi visibile di nuovo il countdown
                document.getElementById("ready-btn").style.display = "block"; // Mostra il pulsante "Sono pronto"
                document.getElementById("countdown").innerText =
                    "Partita trovata, Inizio in:"; // Ripristina il testo iniziale
                document.getElementById("ready-btn").classList.remove("hidden");
                document.getElementById("pronto-text").classList.add("hidden");
                // stopBackgroundMusic()
                countdownStarted = false;
                socket.disconnect();
                socket = null;
            }, 2000); // Aspetta 2 secondi prima di ripristinare la UI
        });

        socket.on("game-start", (data) => {
            document
                .getElementById("countdown-seconds-container")
                .classList.add("hidden");
            document
                .getElementById("game-ready-container")
                .classList.remove("hidden");
            setTimeout(() => {
                window.location.href = `/game/${data.gameId}`;
            }, 3000);
        });

        socket.on("queueAbandoned", (data) => {
            waitingOverlay.classList.add("hidden");
        });
    });
}

//// notification box  //////

function showNotification(message, icon) {
    const container = document.getElementById("notification-container");

    const notification = document.createElement("div");

    notification.innerHTML = `
            <div
                class="bg-white relative text-red-400 text-sm font-semibold px-4 py-4 mt-2 rounded-lg shadow-lg font-sans opacity-100 transition-opacity duration-500"
            >
                ${message}
            </div>
            <div class="absolute -left-2 -top-2 text-lg">${icon}</div>
    `;

    container.append(notification);

    // Fade-out + remove dopo 5 secondi
    setTimeout(() => {
        notification.firstElementChild.style.opacity = "0";
        setTimeout(() => {
            notification.remove();
        }, 500); // attende che finisca il fade
    }, 5000);
}

function readyToPlay() {
    document.getElementById("ready-btn").classList.add("hidden");
    document.getElementById("pronto-text").classList.remove("hidden");
    if (currentGameId) {
        console.log(`current game di: ${currentGameId}`);
        socket.emit("playerReady", {
            gameId: currentGameId,
            userId: socket.id,
        });
    } else {
        console.log("Non sei ancora stato assegnato a un gioco.");
    }
}

const sound = document.getElementById("click-sound");
function buttonSound() {
    if (sound) {
        sound.currentTime = 0; // Resetta il suono per farlo partire sempre da capo
        sound.play();
    } else {
        console.error("Elemento audio non trovato!");
    }
}

const selectSound = document.getElementById("select-sound");
function avatarSelectSound() {
    if (selectSound) {
        selectSound.currentTime = 0; // Resetta il suono per farlo partire sempre da capo
        selectSound.play();
    } else {
        console.error("Elemento audio non trovato!");
    }
}

const selectSoundNewGame = document.getElementById("select-sound-new-game");
function newGameSound() {
    if (selectSoundNewGame) {
        selectSoundNewGame.currentTime = 0; // Resetta il suono per farlo partire sempre da capo
        selectSoundNewGame.play();
    } else {
        console.error("Elemento audio non trovato!");
    }
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let currentAudioSource = null;
// Funzione per caricare il file audio e riprodurlo
async function loadAndPlayAudio(filePath) {
    try {
        // Carica il file audio
        const response = await fetch(filePath);
        const arrayBuffer = await response.arrayBuffer();

        // Decodifica l'audio in un AudioBuffer
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        // Crea un AudioBufferSourceNode
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.loop = true; // Configura il loop

        // Collega il source al contesto audio
        source.connect(audioCtx.destination);

        // Riproduci l'audio
        source.start();

        // Salva il riferimento al nodo audio per fermarlo successivamente
        currentAudioSource = source;
    } catch (error) {
        console.error(
            "Errore durante il caricamento o la riproduzione dell'audio:",
            error
        );
    }
}

async function startBackgroundMusic(filePath) {
    // Verifica se c'è già un audio in riproduzione e lo ferma prima di iniziarne uno nuovo
    if (currentAudioSource) {
        currentAudioSource.stop(); // Ferma la musica in corso
    }

    try {
        // Carica e avvia la musica
        await loadAndPlayAudio(filePath); // Usa la tua funzione loadAndPlayAudio
    } catch (error) {
        console.error("Errore durante la riproduzione della musica:", error);
    }
}

function stopBackgroundMusic() {
    if (currentAudioSource) {
        currentAudioSource.stop(); // Ferma la riproduzione
        currentAudioSource = null; // Resetta la variabile
    } else {
        console.log("Nessun audio in riproduzione.");
    }
}

function fetchAvatarData(username) {
    // Controlla se l'avatar è già salvato nel localStorage
    const avatar = localStorage.getItem(`avatar_${username}`);
    if (avatar) {
        // Se l'avatar è già presente nel localStorage, usa direttamente l'immagine
        updateAvatarImage(avatar);
    } else {
        // Altrimenti, fai la fetch per ottenere l'avatar dal server
        fetch("/profile/avatar", {
            method: "GET", // Metodo GET per ottenere l'avatar
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include", // Include il cookie per l'autenticazione
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Errore nella rete");
                }
                return response.json(); // Ottieni i dati in formato JSON
            })
            .then((data) => {
                const avatar = data.avatar;
                console.log(`avatar ${avatar}`);

                // Memorizza l'avatar nel localStorage per evitare future richieste
                localStorage.setItem(`avatar_${username}`, avatar);
                updateAvatarImage(avatar);
            })
            .catch((error) => {
                console.error("Errore durante il recupero dell'avatar:", error);
            });
    }
}

// Funzione per aggiornare l'immagine dell'avatar
function updateAvatarImage(avatar) {
    console.log(`avatar ${avatar}`);
    const avatarContainer = document.getElementById("main-avatar");
    avatarContainer.src = `/images/avatars/${avatar}.png`; // Imposta il nuovo avatar
}

let username;

async function fetchdashboardData() {
    try {
        const response = await fetch("/profile/user-data", {
            method: "GET", // Metodo GET per ottenere gli item
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        if (!response.ok) {
            throw new Error("Errore nella rete");
        }
        const data = await response.json();
        localStorage.setItem("user_id", data.user_id);
        const username = data.username;
        const status = data.status;
        const games = data.games;
        const maxGamesReached = data.maxGamesReached;
        const gameNotifications = data.gameNotifications;
        console.log(
            "Game Notifications:",
            JSON.stringify(gameNotifications, null, 2)
        );

        if (status === "in_game" && games && Object.keys(games).length > 0) {
            await initSocket(); // Assicurati che initSocket sia una funzione asincrona

            Object.keys(games).forEach((gameId) => {
                console.log(`Gmae id to connect: ${gameId}`);
                socket.emit("joinNewGame", { gameId, user_id });
            });

            // Creazione di un pulsante per ogni gioco attivo
            Object.entries(games).forEach(([gameId, gameData], index) => {
                // Assicurati di non superare il massimo di 5 contenitori
                if (index >= 5) return;

                const isRanked = gameData.gameType === "ranked";

                console.log(gameData);
                console.log("gameType:", gameData.gameType);

                // Trova il contenitore corrispondente
                const container = document.getElementById(`game-${index + 1}`);

                if (container) {
                    // Pulisci il contenitore precedente (se c'è)
                    container.innerHTML = "";

                    container.setAttribute("data-game-id", gameId);

                    // Crea il wrapper per il gioco (contenitore principale)
                    const gameWrapper = document.createElement("div");
                    gameWrapper.className =
                        "relative w-full h-full flex items-center justify-center"; // Questo assicura che i dot siano relativi al wrapper

                    // Crea il pulsante per il gioco
                    const button = document.createElement("button");
                    button.innerText = `Torna al game ${index + 1}`;
                    button.onclick = () => handleBackToGame(gameId);
                    button.className = `
                    w-full h-full text-center text-base sm:text-lg font-bold 
                    text-gray-800 rounded-xl shadow-md hover:shadow-lg hover:scale-105 
                    transition duration-300 ease-in-out p-2 cursor-pointer
                    ${
                        isRanked
                            ? "border-4 border-yellow-400"
                            : "bg-white border-white"
                    }
                `;

                    // Aggiungi notifiche (dot) dentro il wrapper
                    const notificationHtml = `
                        <div class="chat-notification-dot absolute -top-4 -right-4 w-4 h-4 bg-red-500 rounded-full border-2 border-white hidden"></div>
                        <div class="chapter-notification-dot absolute -top-4 -left-4 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white hidden"></div>
                    `;

                    // Aggiungi il contenuto al wrapper
                    gameWrapper.innerHTML = notificationHtml;
                    gameWrapper.appendChild(button);

                    // Aggiungi il wrapper al contenitore principale
                    container.appendChild(gameWrapper);
                }
            });
        }

        fetchAvatarData(username);
        displayItems(username);
    } catch (error) {
        console.error("Errore durante il recupero degli elementi:", error);
        console.log(
            "Response status:",
            error.response ? error.response.status : "nessuna risposta"
        );
    }
}

function displayItems(username) {
    const usernameDashboard = document.getElementById("username");
    usernameDashboard.textContent = username;
}

fetchdashboardData();

let isInQueue = false;

async function joinQueue({ gameType, gameSpeed }) {
    if (
        !["ranked", "normal"].includes(gameType) ||
        !["fast", "slow"].includes(gameSpeed)
    ) {
        return;
    }

    newGameSound();
    closeOverlay();

    await initSocket();

    if (socketId) {
        try {
            const usernameForAvatar = localStorage.getItem("username");
            const avatarKey = `avatar_${usernameForAvatar}`;
            const avatarForGame = localStorage.getItem(avatarKey);
            console.log(`avatar main: ${avatarForGame}`);

            const response = await fetch("/game/game-queue", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    socketId,
                    avatarForGame,
                    gameType,
                    gameSpeed,
                }),
            });

            if (!response.ok) {
                throw new Error(`Errore HTTP: ${response.status}`);
            }
        } catch (error) {
            console.error(
                "Errore nella richiesta per unirsi alla coda:",
                error
            );
        }
    } else {
        console.log("Impossibile ottenere il socketId.");
    }
}

function abandonQueue() {
    buttonSound();

    if (socket) {
        socket.disconnect();
        socket = null;
    } else {
        console.log("Nessun socket da chiudere.");
    }

    fetch("/game/game-queue", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Errore HTTP: ${response.status}`);
            }
            setTimeout(() => {
                waitingOverlay.classList.add("hidden");
                // stopBackgroundMusic();
            }, 1500);

            return response.json();
        })

        .catch((error) => {
            console.error(
                "Errore nella richiesta per abbandonare la coda:",
                error
            );
        });
}

function handleBackToGame(firstGameId) {
    if (firstGameId) {
        socket.emit("updateChapterStatus", {
            game_id: firstGameId,
            user_id,
        });

        window.location.href = `/game/${firstGameId}`;
    } else {
        console.error("game_id non trovato. Impossibile tornare in partita.");
    }
}

// Seleziona tutti gli avatar
const avatars = document.querySelectorAll(".avatar");
const mainAvatar = document.getElementById("main-avatar");
const avatarContainer = document.getElementById("avatarContainer");
const selectButton = document.getElementById("select-avatar-button");
const closeButton = document.getElementById("close-avatar-menu");
let selectedAvatar = null;

function openAvatarMenu() {
    buttonSound();
    document.getElementById("avatarContainer").classList.remove("hidden");
}

// Aggiungi l'evento click a ciascun avatar
avatars.forEach((avatar) => {
    avatar.addEventListener("click", () => {
        avatarSelectSound();
        avatars.forEach((item) => {
            item.classList.remove("bg-blue-600");
            item.classList.add("bg-blue-200");
        });

        avatar.classList.remove("bg-blue-200");
        avatar.classList.add("bg-blue-600");
        selectedAvatar = avatar.getAttribute("data-avatar");
        const selectedAvatarImg = avatar.querySelector("img").src;
        mainAvatar.src = selectedAvatarImg;
        selectButton.disabled = false;
    });
});

selectButton.addEventListener("click", () => {
    buttonSound();
    if (selectedAvatar) {
        fetch("/profile/avatar", {
            method: "POST",
            body: JSON.stringify({ avatar: selectedAvatar }), // Passiamo l'avatar selezionato
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                localStorage.setItem(`avatar_${data.username}`, selectedAvatar);
                closeMenu();
            })
            .catch((error) => {
                console.error("Errore nella selezione dell'avatar:", error);
            });
    }
});

// function to open select game overlay
function openOverlay() {
    var overlay = document.getElementById("overlay-new-game");
    overlay.style.display = "flex";
    setTimeout(() => {
        overlay.classList.remove("opacity-0", "translate-y-10");
        overlay.classList.add("opacity-100", "translate-y-0");
    }, 10);
    e;
}

// function change grayscale select game images

const img1 = document.getElementById("img1");
const img2 = document.getElementById("img2");

function toggleGrayscale(hovered, other) {
    hovered.style.filter = "grayscale(0%)";
    other.style.filter = "grayscale(60%)";
}

img1.addEventListener("mouseenter", () => toggleGrayscale(img1, img2));
img2.addEventListener("mouseenter", () => toggleGrayscale(img2, img1));

// function to close select game overlay

function closeOverlay() {
    var overlay = document.getElementById("overlay-new-game");
    overlay.classList.remove("opacity-100", "translate-y-0");
    overlay.classList.add("opacity-0", "translate-y-10");
    setTimeout(() => {
        overlay.style.display = "none";
    }, 500);
}

closeButton.addEventListener("click", () => {
    buttonSound();
    if (selectedAvatar) {
        fetch("/profile/avatar", {
            method: "POST",
            body: JSON.stringify({ avatar: selectedAvatar }), // Passiamo l'avatar selezionato
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.json())
            .then((data) => {
                // Gestisci la risposta (ad esempio, chiudi il menu o mostra un messaggio di successo)
                localStorage.setItem(`avatar_${username}`, selectedAvatar);
                closeMenu(); // Chiudi il menu
            })
            .catch((error) => {
                console.error("Errore nella selezione dell'avatar:", error);
            });
    } else {
        // Se non è stato selezionato nessun avatar, chiudi semplicemente il menu senza fare fetch
        closeMenu();
    }
});

function closeMenu() {
    avatarContainer.classList.add("hidden"); // Nascondi il menu
    selectedAvatar = null; // Resetta la selezione
    selectButton.disabled = true; // Disabilita il bottone "Seleziona" di nuovo
}

function modalDeleteAccount() {
    const modal = document.getElementById("delete-modal");
    const passwordInput = document.getElementById("confirm-password");

    passwordInput.value = "";
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

function closeDeleteModal() {
    const modal = document.getElementById("delete-modal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
}

async function confirmDeleteAccount() {
    const password = document.getElementById("confirm-password").value;

    if (!password) {
        alert("Inserisci la password per confermare.");
        return;
    }

    const res = await fetch("/profile/delete-account", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
    });

    const data = await res.json();

    if (res.ok) {
        alert("Account cancellato. Verrai disconnesso.");
        window.location.href = "/"; // o home page
    } else {
        alert(data.message || "Errore nella cancellazione.");
    }
}
