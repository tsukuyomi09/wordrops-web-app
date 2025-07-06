const bookLimit = 5;
let bookOffset = 0;

document.addEventListener("DOMContentLoaded", function () {
    getUserData();
    startPing(60000);
});

function startPing(intervalMs = 60000) {
    async function ping() {
        try {
            const res = await fetch("/profile/user-last-seen", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) throw new Error("Ping error");
        } catch (err) {
            console.error("Ping failed", err);
        }
    }

    ping(); // ping iniziale subito
    setInterval(ping, intervalMs);
}

function dashboardButton() {
    const username = localStorage.getItem("username");
    if (username) {
        window.location.href = `/dashboard/${username}`;
    } else {
        const registerModal = document.getElementById("popup-register-user");
        registerModal.classList.remove("hidden");
    }
}

function closeModal(id) {
    const modalToClose = document.getElementById(id);
    modalToClose.classList.add("hidden");
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
                    throw new Error("Network Error");
                }
                return response.json();
            })
            .then((data) => {
                displayUserItems(data);
                if (data.games.length > 0) {
                    const books = data.games;
                    displayUserBooks(books);
                    bookOffset += bookLimit;
                }
            })
            .catch((error) => {
                console.error("Error retrieving items:", error);
            });
    }
}

function loadMoreBooks() {
    const username = window.location.pathname.split("/")[2];
    if (username) {
        fetch(`/profile/load-more-books/${username}?offset=${bookOffset}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network error");
                }
                return response.json();
            })
            .then((data) => {
                if (data.games.length > 0) {
                    const books = data.games;
                    displayUserBooks(books);
                    bookOffset += bookLimit;
                }
            })
            .catch((error) => {
                console.error("Error retrieving items:", error);
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

    const booksGrid = document.getElementById("books-grid");

    books.forEach((book) => {
        const card = document.createElement("a");
        card.href = `/story/${book.game_lang}/${book.id}-${book.slug}`;

        card.classList.add(
            "h-full",
            "w-full",
            "p-2",
            "py-4",
            "rounded-lg",
            "border-1",
            "md:px-6",
            "md:border-custom-light",
            "border-white",
            "relative",
            "flex",
            "flex-col",
            "gap-6"
        );
        card.innerHTML = `
                <img src="${
                    book.cover_image_url
                }" class="w-18 md:w-24 -top-4 -left-4" alt="book icon" />
                <div class="absolute top-2 right-2 flex flex-col items-end gap-4">
                    <div id="book-date" class="text-right text-sm text-gray-600">${new Date(
                        book.finished_at
                    ).toLocaleDateString()}</div>
                    <button id="book-add-favourite" >
                        <img src="/images/icons/add_to_favourite_icon.png" class="w-6 h-6 cursor-pointer" alt="add to favourite icon" />
                    </button>

                </div>
                <div class="flex flex-col cursor-pointer gap-4">
                    <h3 id="book-main" class=" text-xl md:text-2xl italic font-semibold">${
                        book.title
                    }</h3>
                    <div
                        id="lang-box"
                        class="self-start inline-flex text-xs md:text-lm p-1 md:p-2 border-1 bg-orange-500 text-white font-bold flex items-center justify-center rounded select-none z-10"
                    >${book.game_lang.toUpperCase()}</div>
                    <div class="flex gap-4">
                        <span id="game-type" class="text-sm px-4 py-1 bg-amber-400 text-gray-800 rounded-lg font-mono">${
                            book.game_type
                        }</span>
                        <span id="game-speed" class=" text-sm px-4 py-1 bg-green-600 text-gray-800 rounded-lg font-mono">${
                            book.game_speed
                        }</span>
                    </div>
                    <div>
                        <p id="book-description" class="text-sm ">${
                            book.back_cover
                        }</p>
                    </div>
                </div>
 
        `;
        booksGrid.appendChild(card);
    });
}
