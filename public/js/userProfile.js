document.addEventListener("DOMContentLoaded", function () {
    getUserData();
});

function getUserData() {
    const username = window.location.pathname.split("/")[2];
    if (username) {
        fetch(`/profile/user-profile-data/${username}`, {
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
                console.log(
                    "Dati dell'utente arrivati:",
                    JSON.stringify(data, null, 2)
                );
                displayUserItems(data);
            })
            .catch((error) => {
                console.error(
                    "Errore durante il recupero degli elementi:",
                    error
                );
            });
    }
}

function displayUserItems(data) {
    // Aggiorna le informazioni del profilo
    document.getElementById("profile-username").innerText = data.username;
    document.getElementById(
        "profile-avatar"
    ).src = `/images/avatars/${data.avatar}.png`;
    console.log(`images/avatars/${data.avatar}.png`);
    document.getElementById("profile-rank").innerText = data.rank;

    // Aggiorna le statistiche
    document.getElementById("partite-classiche").innerText =
        data.stats.classic_played;
    document.getElementById("partite-ranked").innerText =
        data.stats.ranked_played;
    document.getElementById("miglior-performance").innerText =
        data.stats.perfect_performances;
    document.getElementById("punteggio-ranked").innerText =
        data.stats.ranked_score;
    document.getElementById("partite-pessime").innerText =
        data.stats.worst_performances;
    document.getElementById("abbandoni").innerText =
        data.stats.stories_abandoned;
}

function showAvatarTransition() {
    const avatarContainer = document.querySelector(".avatar-container");
    setTimeout(() => {
        avatarContainer.classList.add("show");
    }, 50);
}

showAvatarTransition();
