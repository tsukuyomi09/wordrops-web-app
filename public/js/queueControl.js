let socket;
let socketId = null;
let countdownStarted = false;

document.addEventListener("DOMContentLoaded", function () {
    fetchQueueStatus();
});

function initSocket() {
    return new Promise((resolve, reject) => {
        socket = io();

        socket.on("connect", () => {
            socketId = socket.id;
            resolve();
        });

        socket.on("in-queue", (message) => {
            document
                .getElementById("waiting-overlay")
                .classList.remove("hidden");
            document
                .getElementById("mini-queue-display")
                .classList.remove("hidden");
        });

        socket.on("queueAbandoned", (data) => {
            document.getElementById("waiting-overlay").classList.add("hidden");
            document
                .getElementById("mini-queue-display")
                .classList.add("hidden");
        });

        socket.on("countdown", (seconds) => {
            if (!countdownStarted) {
                document
                    .getElementById("waiting-overlay")
                    .classList.add("hidden");
                document.getElementById("countdown-overlay").style.display =
                    "flex";
                countdownStarted = true;
            }
            document.getElementById("countdown-seconds").innerText = seconds;
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

        socket.on("connect_error", (err) => {
            reject(err);
        });
    });
}

async function fetchQueueStatus() {
    try {
        const response = await fetch("/profile/player-queue-status", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.inQueue) {
            if (!socketId) await initSocket();
            if (socketId) {
                await updateQueueSocket(data.gameType, data.gameSpeed);
                document
                    .getElementById("mini-queue-display")
                    .classList.remove("hidden");
            }
        }
    } catch (error) {
        console.error("Error fetching queue status:", error);
        return false; // fallback
    }
}

async function updateQueueSocket(gameType, gameSpeed) {
    try {
        const response = await fetch("/profile/update-queue-socket", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ socketId, gameType, gameSpeed }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return true;
    } catch (error) {
        console.error("Error updating socket ID in queue:", error);
        return false;
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

            setTimeout(() => {
                document
                    .getElementById("waiting-overlay")
                    .classList.add("hidden");
            }, 1500);

            return response.json();
        })

        .catch((error) => {
            console.error("Error while requesting to leave the queue:", error);
        });
}

function closeWaitingQueueModal() {
    document.getElementById("waiting-overlay").classList.add("hidden");
}

function openWaitingQueueModal() {
    document.getElementById("waiting-overlay").classList.remove("hidden");
}
