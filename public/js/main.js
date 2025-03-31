document.addEventListener("DOMContentLoaded", function () {
    const swiper = new Swiper(".swiper-container", {
        loop: true,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
    });
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

function showAvatarTransition() {
    const avatarContainer = document.querySelector(".avatar-container");
    setTimeout(() => {
        avatarContainer.classList.add("show");
    }, 50);
}

window.addEventListener("load", () => {
    const overlay = document.getElementById("loading-overlay");
    const pagewrap = document.getElementById("pagewrap");
    const audioCtx = new window.AudioContext();

    if (!sessionStorage.getItem("hasVisited")) {
        showLoadingAnimation();
        sessionStorage.setItem("hasVisited", "true");
    } else {
        pagewrap.classList.remove("hidden");
    }
    showAvatarTransition();
});

window.onpopstate = function (event) {
    fetch("/gamequeueNew", {
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
    return new Promise((resolve) => {
        socket = io(); // Inizializza la connessione WebSocket

        // Quando il WebSocket è connesso, salva il socketId
        socket.on("connect", () => {
            socketId = socket.id;
            resolve(); // Una volta connesso, risolvi la promessa
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

        socket.on("game-cancelled", (message) => {
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
        fetch("/avatar", {
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
    const avatarContainer = document.getElementById("main-avatar");
    avatarContainer.src = `/images/avatars/${avatar}.png`; // Imposta il nuovo avatar
}

let username;

function fetchdashboardData() {
    fetch("/userData", {
        method: "GET", // Metodo GET per ottenere gli item
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Errore nella rete");
            }
            return response.json();
        })
        .then((data) => {
            username = data.username;
            const status = data.status;
            const games = data.games; // Più giochi attivi
            const maxGamesReached = data.maxGamesReached; // Nuova proprietà ricevuta
            console.log(`games: ${JSON.stringify(games, null, 2)}`);
            console.log(`Max games reached: ${maxGamesReached}`);

            const statusContainer = document.getElementById("status-div");
            const gameUiContainer = document.getElementById("gameUI-update");
            const buttonsContainer = document.getElementById(
                "game-buttons-container"
            );

            // Pulizia pulsanti precedenti
            buttonsContainer.innerHTML = "";

            const newGameButton = document.getElementById("new-game-button");
            if (newGameButton) {
                if (maxGamesReached) {
                    newGameButton.innerText = "LIMITE RAGGIUNTO";
                    newGameButton.disabled = true;
                    newGameButton.classList.add(
                        "opacity-50",
                        "cursor-not-allowed"
                    );
                } else {
                    newGameButton.innerText = "NUOVA PARTITA";
                    newGameButton.disabled = false;
                    newGameButton.classList.remove(
                        "opacity-50",
                        "cursor-not-allowed"
                    );
                }
            }

            if (
                status === "in_game" &&
                games &&
                Object.keys(games).length > 0
            ) {
                gameUiContainer.classList.remove("hidden");
                statusContainer.classList.remove("hidden");

                // Creazione di un pulsante per ogni gioco attivo
                Object.entries(games).forEach(([gameId, gameStatus], index) => {
                    const button = document.createElement("button");
                    button.innerText = `Torna al game ${index + 1}`; // Usa un numero sequenziale invece del gameId
                    button.onclick = () => handleBackToGame(gameId);
                    button.className =
                        "hover-sound text-sm bg-green-600 border-4 border-white text-white font-semibold w-32 h-32 rounded-full flex items-center justify-center shadow-md focus:outline-none focus:ring-2 focus:ring-green-200 transition duration-300 transform hover:scale-105 hover:shadow-lg font-extrabold";

                    buttonsContainer.appendChild(button);
                });
            } else {
                gameUiContainer.classList.add("hidden");
                statusContainer.classList.add("hidden");
            }

            fetchAvatarData(username);
            displayItems(username);
        })
        .catch((error) => {
            console.error("Errore durante il recupero degli elementi:", error);
            console.log(
                "Response status:",
                error.response ? error.response.status : "nessuna risposta"
            );
        });
}

function displayItems(username) {
    const usernameDashboard = document.getElementById("username");
    usernameDashboard.textContent = username;
}

fetchdashboardData();

let isInQueue = false;

async function joinQueue(mode) {
    if (!mode) {
        console.error("Nessuna modalità selezionata.");
        return;
    }

    newGameSound();
    const backgroundMusicPath = "/images/new-queue-music.ogg";
    // setTimeout(async () => {
    //     await startBackgroundMusic(backgroundMusicPath);
    // }, 1000);

    await initSocket();

    if (socketId) {
        try {
            const usernameForAvatar = localStorage.getItem("username");
            const avatarKey = `avatar_${usernameForAvatar}`;
            const avatarForGame = localStorage.getItem(avatarKey);

            const response = await fetch("/gamequeueNew", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ socketId, avatarForGame, mode }),
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

    fetch("/gamequeueNew", {
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
        // Reindirizza alla pagina del gioco
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
        fetch("/avatar", {
            method: "POST",
            body: JSON.stringify({ avatar: selectedAvatar }), // Passiamo l'avatar selezionato
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.json())
            .then((data) => {
                localStorage.setItem(`avatar_${username}`, selectedAvatar);
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
        fetch("/avatar", {
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
    // Qui metti la logica per chiudere il menu degli avatar, ad esempio:
    avatarContainer.classList.add("hidden"); // Nascondi il menu
    selectedAvatar = null; // Resetta la selezione
    selectButton.disabled = true; // Disabilita il bottone "Seleziona" di nuovo
}

function logout() {
    buttonSound();
    sessionStorage.clear();
    fetch("/logout", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    })
        .then((response) => {
            if (response.ok) {
                window.location.href = "/";
            } else {
                return response.json();
            }
        })
        .then((errorData) => {
            if (errorData && errorData.error) {
                console.error("Errore durante il logout: ", errorData.error);
            }
        })
        .catch((error) => {
            console.error("Errore: Problema con il logout: ", error);
        });
}
