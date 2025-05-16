document.addEventListener("DOMContentLoaded", function () {
    getUserData();
});

function dashboardButton() {
    const username = localStorage.getItem("username");
    if (username) {
        window.location.href = `/dashboard/${username}`;
    } else {
        alert("Errore: nome utente non trovato.");
    }
}

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
                console.log(`lunghezza = ${data.games.length}`);
                displayUserItems(data);
                if (data.games.length > 0) {
                    console.log("entrato nella fuzione");
                    const books = data.games;
                    console.log(`I giochi ricevuti:`, books);
                    displayUserBooks(books);
                }
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
    return;
}

function displayUserBooks(books) {
    document.getElementById("no-books-container").classList.add("hidden");
    document.getElementById("books-grid").classList.remove("hidden");

    console.log(`the games: ${books}`);
    const booksGrid = document.getElementById("books-grid");
    booksGrid.innerHTML = "";

    books.forEach((book) => {
        const card = document.createElement("div");
        card.classList.add(
            "h-full",
            "w-full",
            "py-4",
            "rounded-lg",
            "border-2",
            "px-6",
            "border-custom-light",
            "relative",
            "flex",
            "flex-col",
            "gap-6"
        );
        card.innerHTML = `
                <img src="/images/book-icon.png" class="absolute w-10 -top-4 -left-4" alt="book icon" />
                <div id="book-date" class="text-right text-sm text-gray-600">${new Date(
                    book.finished_at
                ).toLocaleDateString()}</div>
                <div class="flex flex-col cursor-pointer gap-4">
                    <h3 id="book-main" class="text-2xl italic font-semibold">${
                        book.title
                    }</h3>
                    <div class="flex gap-4">
                        <span id="game-type" class="px-4 py-1 bg-amber-400 text-gray-800 rounded-lg font-mono">${translateGameType(
                            book.game_type
                        )}</span>
                        <span id="game-speed" class="px-4 py-1 bg-green-600 text-gray-800 rounded-lg font-mono">${translateGameSpeed(
                            book.game_speed
                        )}</span>
                    </div>
                    <div>
                        <p id="book-description">${book.back_cover}</p>
                    </div>
                </div>
                <div class="flex justify-end">
                    <a id="book-add-favourite" href="">
                        <img src="/images/icons/add_to_favourite_icon.png" class="w-6 h-6 cursor-pointer" alt="add to favourite icon" />
                    </a>
                </div>
        `;
        booksGrid.appendChild(card);
    });
}

function translateGameType(type) {
    const types = {
        ranked: "classificata",
        normal: "classica",
    };
    return types[type] || type;
}

function translateGameSpeed(speed) {
    const speeds = {
        slow: "lunga",
        fast: "corta",
    };
    return speeds[speed] || speed;
}
