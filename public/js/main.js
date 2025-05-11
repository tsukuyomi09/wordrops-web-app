const user_id = Number(localStorage.getItem("user_id"));

document.addEventListener("DOMContentLoaded", function () {
    new Swiper(".swiper-container", {
        loop: true,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        on: {
            init: function () {
                updateSlideStyles(this.realIndex);
            },
            slideChangeTransitionEnd: function () {
                updateSlideStyles(this.realIndex);
            },
        },
    });

    function updateSlideStyles(index) {
        document.querySelectorAll(".slide-title").forEach((el, idx) => {
            el.classList.toggle("opacity-100", idx === index);
        });

        document.querySelectorAll(".slide-image").forEach((el, idx) => {
            el.classList.toggle("opacity-10", idx === index);
        });
    }
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
    container: document.getElementById("lottie-book"),
    renderer: "svg",
    loop: false,
    autoplay: false,
    path: "/images/new-book-anime.json",
});

const lottieButton = document.getElementById("lottie-button");

lottieButton.addEventListener("mouseenter", function () {
    bookAnimation.play();
});

lottieButton.addEventListener("mouseleave", function () {
    bookAnimation.stop();
});

function showAvatarTransition() {
    const avatarContainer = document.querySelector(".avatar-container");
    setTimeout(() => {
        avatarContainer.classList.add("show");
    }, 50);
}

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

history.pushState(null, null, location.href);

const formInput = document.getElementById("p-input");
const usernameDashboard = document.getElementById("username");
const waitingOverlay = document.getElementById("waiting-overlay");

let socket;
let socketId = null;
let countdownStarted = false;

function initSocket() {
    return new Promise((resolve, reject) => {
        socket = io();

        socket.on("connect", () => {
            socketId = socket.id;
            resolve();
        });

        socket.on("connect_error", (err) => {
            console.error("Errore di connessione:", err);
            reject(err);
        });

        socket.on("connect_timeout", () => {
            reject("Timeout di connessione");
        });

        socket.on("in-queue", (message) => {
            waitingOverlay.classList.remove("hidden");
        });

        socket.on("game-ready", (message) => {
            alert(message);
        });

        socket.on("countdown", (seconds) => {
            if (!countdownStarted) {
                waitingOverlay.classList.add("hidden");
                document.getElementById("countdown-overlay").style.display =
                    "flex";
                countdownStarted = true;
            }
            document.getElementById("countdown-seconds").innerText = seconds;
        });

        socket.on("gameIdAssigned", (data) => {
            currentGameId = data.gameId;
        });

        socket.on("receiveChatMessage", (messageData) => {
            const { game_id } = messageData;

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

            if (gameWrapper) {
                const chatNotificationDot = gameWrapper.querySelector(
                    ".chat-notification-dot"
                );

                if (chatNotificationDot) {
                    if (!allMessagesRead) {
                        chatNotificationDot.classList.remove("hidden");
                    } else {
                        chatNotificationDot.classList.add("hidden");
                    }
                }
            }
        });

        socket.on("chapterStatus", ({ game_id, hasUnreadChapter }) => {
            const gameWrapper = document.querySelector(
                `[data-game-id="${game_id}"]`
            );
            if (!gameWrapper) return;

            const chapterNotificationDot = gameWrapper.querySelector(
                ".chapter-notification-dot"
            );
            if (!chapterNotificationDot) return;

            if (hasUnreadChapter) {
                chapterNotificationDot.classList.remove("hidden");
            } else {
                chapterNotificationDot.classList.add("hidden");
            }
        });

        socket.on("newChapterNotification", ({ timestamp, gameId }) => {
            const gameWrapper = document.querySelector(
                `[data-game-id="${gameId}"]`
            );
            if (gameWrapper) {
                const chapterNotificationDot = gameWrapper.querySelector(
                    ".chapter-notification-dot"
                );
                if (chapterNotificationDot) {
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
            document.getElementById("countdown-seconds").style.display = "none";
            document.getElementById("countdown").innerText = message;
            document.getElementById("ready-btn").style.display = "none";

            setTimeout(() => {
                document
                    .getElementById("countdown-overlay")
                    .style.removeProperty("display");
                document.getElementById("countdown-seconds").style.display =
                    "block";
                document.getElementById("ready-btn").style.display = "block";
                document.getElementById("countdown").innerText =
                    "Partita trovata, Inizio in:";
                document.getElementById("ready-btn").classList.remove("hidden");
                document.getElementById("pronto-text").classList.add("hidden");
                countdownStarted = false;
                socket.disconnect();
                socket = null;
            }, 2000);
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

    setTimeout(() => {
        notification.firstElementChild.style.opacity = "0";
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 5000);
}

function readyToPlay() {
    document.getElementById("ready-btn").classList.add("hidden");
    document.getElementById("pronto-text").classList.remove("hidden");
    if (currentGameId) {
        socket.emit("playerReady", {
            gameId: currentGameId,
            userId: socket.id,
        });
    } else {
        return;
    }
}

function fetchAvatarData(username) {
    const avatar = localStorage.getItem(`avatar_${username}`);
    if (avatar) {
        updateAvatarImage(avatar);
    } else {
        fetch("/profile/avatar", {
            method: "GET",
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
                const avatar = data.avatar;

                localStorage.setItem(`avatar_${username}`, avatar);
                updateAvatarImage(avatar);
            })
            .catch((error) => {
                console.error("Errore durante il recupero dell'avatar:", error);
            });
    }
}

function updateAvatarImage(avatar) {
    const avatarContainer = document.getElementById("main-avatar");
    avatarContainer.src = `/images/avatars/${avatar}.png`;
}

let username;

async function fetchdashboardData() {
    try {
        const response = await fetch("/profile/user-data", {
            method: "GET",
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
        showScoreNotificationsSequential(gameNotifications);

        if (status === "in_game" && games && Object.keys(games).length > 0) {
            await initSocket();

            Object.keys(games).forEach((gameId) => {
                socket.emit("joinNewGame", { gameId, user_id });
            });

            Object.entries(games).forEach(([gameId, gameData], index) => {
                if (index >= 5) return;
                const isRanked = gameData.gameType === "ranked";
                const container = document.getElementById(`game-${index + 1}`);

                if (container) {
                    container.innerHTML = "";
                    container.setAttribute("data-game-id", gameId);
                    const gameWrapper = document.createElement("div");
                    gameWrapper.className =
                        "relative w-full h-full flex items-center justify-center";

                    const button = document.createElement("button");
                    button.innerText = `Torna al game ${index + 1}`;
                    button.onclick = () => handleBackToGame(gameId);
                    button.className = `
                    w-full h-full text-center text-[12px] sm:text-md font-bold 
                    text-gray-800 rounded-xl shadow-md hover:shadow-lg hover:scale-105 
                    transition duration-300 ease-in-out p-2 cursor-pointer
                    ${
                        isRanked
                            ? "border-2 border-yellow-400"
                            : "bg-white border-2 border-green-400"
                    }
                `;

                    const notificationHtml = `
                        <div class="chat-notification-dot absolute -top-4 -left-0 w-4 h-4 bg-blue-500 rounded-full border-2 border-white hidden"></div>
                        <div class="chapter-notification-dot absolute -top-4 left-4 w-4 h-4 bg-orange-500 rounded-full border-2 border-white hidden"></div>
                    `;

                    gameWrapper.innerHTML = notificationHtml;
                    gameWrapper.appendChild(button);
                    container.appendChild(gameWrapper);
                }
            });
        }

        fetchAvatarData(username);
        displayItems(username);
    } catch (error) {
        alert("Si è verificato un errore.");
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

    closeOverlay();

    await initSocket();

    if (socketId) {
        try {
            const usernameForAvatar = localStorage.getItem("username");
            const avatarKey = `avatar_${usernameForAvatar}`;
            const avatarForGame = localStorage.getItem(avatarKey);

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
        alert("Si è verificato un errore. Riprova più tardi.");
    }
}

function abandonQueue() {
    fetch("/game/game-queue", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
            socketId,
        }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Errore HTTP: ${response.status}`);
            }
            if (socket) {
                socket.disconnect();
                socket = null;
            } else {
                alert("Si è verificato un errore. Riprova più tardi.");
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

const avatars = document.querySelectorAll(".avatar");
const mainAvatar = document.getElementById("main-avatar");
const avatarContainer = document.getElementById("avatarContainer");
const selectButton = document.getElementById("select-avatar-button");
const closeButton = document.getElementById("close-avatar-menu");
let selectedAvatar = null;

function openAvatarMenu() {
    document.getElementById("avatarContainer").classList.remove("hidden");
}

avatars.forEach((avatar) => {
    avatar.addEventListener("click", () => {
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
    if (selectedAvatar) {
        fetch("/profile/avatar", {
            method: "POST",
            body: JSON.stringify({ avatar: selectedAvatar }),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.json())
            .then((data) => {
                localStorage.setItem(`avatar_${data.username}`, selectedAvatar);
                closeMenu();
            })
            .catch((error) => {
                console.error("Errore nella selezione dell'avatar:", error);
            });
    }
});

function openOverlay() {
    var overlay = document.getElementById("overlay-new-game");
    overlay.style.display = "flex";
    setTimeout(() => {
        overlay.classList.remove("opacity-0", "translate-y-10");
        overlay.classList.add("opacity-100", "translate-y-0");
    }, 10);
}

const img1 = document.getElementById("img1");
const img2 = document.getElementById("img2");

function toggleGrayscale(hovered, other) {
    hovered.style.filter = "grayscale(0%)";
    other.style.filter = "grayscale(60%)";
}

img1.addEventListener("mouseenter", () => toggleGrayscale(img1, img2));
img2.addEventListener("mouseenter", () => toggleGrayscale(img2, img1));

function closeOverlay() {
    var overlay = document.getElementById("overlay-new-game");
    overlay.classList.remove("opacity-100", "translate-y-0");
    overlay.classList.add("opacity-0", "translate-y-10");
    setTimeout(() => {
        overlay.style.display = "none";
    }, 500);
}

closeButton.addEventListener("click", () => {
    if (selectedAvatar) {
        fetch("/profile/avatar", {
            method: "POST",
            body: JSON.stringify({ avatar: selectedAvatar }),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.json())
            .then(() => {
                localStorage.setItem(`avatar_${username}`, selectedAvatar);
                closeMenu();
            })
            .catch((error) => {
                console.error("Errore nella selezione dell'avatar:", error);
            });
    } else {
        closeMenu();
    }
});

function closeMenu() {
    avatarContainer.classList.add("hidden");
    selectedAvatar = null;
    selectButton.disabled = true;
}

///////// POPUP NEW RANKED SCORE /////////////

function showScoreNotificationsSequential(gameNotifications) {
    let index = 0;

    function showNext() {
        if (index >= gameNotifications.length) return;

        const notification = gameNotifications[index];
        const scorePopup = document.createElement("div");
        scorePopup.classList.add(
            "popup-newscore-notification",
            "fixed",
            "inset-0",
            "flex",
            "items-center",
            "justify-center",
            "z-50",
            "bg-black/40",
            "p-12"
        );

        const lottieContainer = document.createElement("div");
        lottieContainer.classList.add(
            "absolute",
            "top-1/2",
            "left-1/2",
            "transform",
            "-translate-x-1/2",
            "-translate-y-1/2",
            "w-[80vw]",
            "h-[80vh]",
            "z-1"
        );
        scorePopup.appendChild(lottieContainer);

        const animation = lottie.loadAnimation({
            container: lottieContainer,
            renderer: "svg",
            loop: true,
            autoplay: true,
            path: "/animations/new-score-animation.json",
        });

        setTimeout(() => {
            const popupContent = document.createElement("div");
            popupContent.classList.add(
                "bg-white",
                "border",
                "relative",
                "border-gray-300",
                "shadow-xl",
                "rounded-2xl",
                "max-w-[24em]",
                "flex",
                "flex-col",
                "opacity-0",
                "transition-opacity",
                "duration-300",
                "z-2"
            );

            popupContent.innerHTML = `
                <div class="bg-white border relative border-gray-300 shadow-xl rounded-2xl max-w-[24em] flex flex-col  ">
                    <img src="/images/trophy-image.png" alt="Trophy" class="absolute -top-6 -left-6 md:-top-12 md:-left-12  transform -rotate-24 object-contain size-18 md:size-24 " />
        
                    <div class=" py-6 bg-gray-200 rounded-2xl">
                        <h2 class="text-md lg:text-lg font-semibold text-center text-gray-800 ">Nuovo punteggio!</h2>
                    </div>

                    <div class="p-4 flex flex-col relative w-full h-auto">
                        <div class=" flex flex-grow justify-center items-center">
                            <p class=" text-gray-500 py-6 font-semibold">
                                <span class="${
                                    notification.points > 0
                                        ? "text-green-600 text-4xl  md:text-6xl"
                                        : notification.points < 0
                                        ? "text-red-600 text-4xl  md:text-6xl"
                                        : "text-gray-600  text-4xl  md:text-6xl"
                                }">
                                    ${notification.points}
                                </span>
                            </p>
                        </div>
                        <p class="text-gray-800 text-xl mb-6 italic ">${`"${notification.comment}"`}</p>

                        
                        <div class="">
                            <button 
                                data-game-id="${notification.gameId}" 
                                class="bg-custom-blue cursor-pointer  px-6 py-2 w-full  text-white text-lg font-semibold rounded-md"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            `;

            scorePopup.appendChild(popupContent);

            requestAnimationFrame(() => {
                popupContent.classList.add("opacity-100");
            });

            scorePopup
                .querySelector("button")
                .addEventListener("click", async (e) => {
                    const game_id = e.target.getAttribute("data-game-id");
                    await deleteNotification(Number(game_id));
                    scorePopup.remove();
                    index++;
                    showNext();
                });
        }, 2000);
        document.body.appendChild(scorePopup);
    }

    showNext();
}

function deleteNotification(game_id) {
    fetch("/profile/remove-game-notification", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ game_id }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Errore nella rimozione della notifica");
            }
        })
        .catch(() => {
            alert("Qualcosa é andato storto");
        });
}

///////// POPUP NEW RANKED SCORE /////////////
