async function fetchCompletedGames() {
    try {
        const response = await fetch("/library/dashboard-own-stories");
        const data = await response.json();

        if (response.ok) {
            if (data.completedGames.length > 0) {
                const containerToReveal = document.getElementById(
                    "stories-container-wrapper"
                );
                containerToReveal.classList.remove("hidden");
                console.log(
                    "Completed Games JSON:",
                    JSON.stringify(data.completedGames, null, 2)
                );
                renderCompletedGames(data.completedGames);
            }
        } else {
            console.error(
                "Errore nel recupero dei giochi completati:",
                data.message
            );
        }
    } catch (err) {
        console.error("Errore di rete:", err);
    }
}

function renderCompletedGames(completedGames) {
    const container = document.getElementById("stories-container");
    container.innerHTML = "";

    completedGames.forEach((game) => {
        const storyDiv = document.createElement("div");
        storyDiv.classList.add(
            "story",
            "bg-white",
            "bg-opacity-60",
            "p-2",
            "rounded-lg",
            "text-center",
            "hover:bg-green-100",
            "cursor-pointer",
            "transition-all",
            "duration-300",
            "ease-in-out"
        );

        storyDiv.setAttribute("data-game-id", game.id);

        storyDiv.innerHTML = `
        <div class="p-2 md:p-4  rounded-lg w-full flex flex-col items-start gap-2">
            <!-- Immagine del libro -->
            <div class="size-8 md:size-10 lg:size-14">
                <img src="/images/book-icon.png" alt="Icona Libro" class="w-full h-full object-cover rounded">
            </div>

            <!-- Titolo sotto, allineato a sinistra -->
            <h3 class="story-title text-sm md:text-lg  font-semibold text-left italic"> ${game.title}</h3>
        </div>
            `;

        storyDiv.addEventListener("click", async () => {
            const gameId = storyDiv.getAttribute("data-game-id");
            const storyDetails = await fetchStoryDetails(gameId);

            openBookOverlay(game, storyDetails);
        });
        container.appendChild(storyDiv);
    });
}

// Funzione per aprire l'overlay

function openBookOverlay(book, storyDetails) {
    const overlay = document.getElementById("overlay-books");
    const bookTitle = document.getElementById("book-title");
    const authorsContainer = document.getElementById("authors-container");
    const bookGenresContainer = document.getElementById("book-genre");
    const bookDescription = document.getElementById("book-summary");
    const gameType = document.getElementById("game-type");
    const gameSpeed = document.getElementById("game-speed");

    const chaptersContainer = document.querySelector(
        ".book-chapters-container"
    );
    chaptersContainer.innerHTML = "";
    authorsContainer.innerHTML = ""; // itera sugli autori, poi mettilo dentro bookDetails
    bookGenresContainer.innerHTML = "";
    gameType.innerHTML = "";
    gameSpeed.innerHTML = "";

    storyDetails.chapters.forEach((item, index) => {
        const authorDiv = document.createElement("div");
        const chapterDiv = document.createElement("div");
        chapterDiv.classList.add(
            "book-chapters",
            "flex",
            "flex-col",
            "gap-6",
            "py-8"
        );
        authorDiv.classList.add("flex", "flex-col", "items-center");

        chapterDiv.innerHTML = `
            <h3 class="text-2xl font-semibold" id="chapter-title">
                Capitolo ${index + 1}: ${item.title}
            </h3>
            <div class="flex items-center mt-2">
                <a href="/profile-page/${
                    item.username
                }" target="_blank" class="flex items-center">
                    <div class="size-10 rounded-lg overflow-hidden mr-2">
                        <img src="/images/avatars/${
                            item.avatar
                        }.png" alt="Autore" class="w-full h-full object-contain" />
                    </div>
                    <span class="text-mg md:text-lg font-semibold ">${
                        item.username
                    }</span>
                </a>
            </div>
            <p class="text-gray-700 text-lg leading-relaxed md:text-2xl mt-2" id="chapter-text">
                ${item.content}
            </p>
        `;

        authorDiv.innerHTML = `
            <div class="size-12 rounded-lg overflow-hidden">
                <a href="/profile-page/${item.username}" target="_blank" class="flex items-center">
                    <img src="/images/avatars/${item.avatar}.png" class="w-full h-full object-cover"/>
                </a>
            </div>
            <span class="text-sm font-semibold mt-1">${item.username}</span>
        `;

        chaptersContainer.appendChild(chapterDiv);
        authorsContainer.appendChild(authorDiv);
    });

    storyDetails.genres.forEach((genre) => {
        const bookGenre = document.createElement("p");
        bookGenre.textContent = genre;
        bookGenre.classList.add(
            "text-gray-00",
            "px-4",
            "py-",
            "border-1",
            "border-gray-200",
            "rounded-lg"
        );
        bookGenresContainer.appendChild(bookGenre);
    });

    bookTitle.innerHTML = `"${book.title}"`;
    bookDescription.innerHTML = book.back_cover;
    gameType.innerHTML = `${translateGameType(book.game_type)}`;
    gameSpeed.innerHTML = `${translateGameSpeed(book.game_speed)}`;

    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeBookOverlay() {
    const overlay = document.getElementById("overlay-books");
    overlay.classList.add("hidden");

    setTimeout(() => {
        document.body.style.overflow = "";
    }, 500);
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

async function fetchStoryDetails(storyId) {
    try {
        const response = await fetch(
            `/library/dashboard-story-details/${storyId}`
        );
        const data = await response.json();
        console.log(`book details:\n${JSON.stringify(data, null, 2)}`);

        if (!response.ok) {
            throw new Error(
                data.message || "Errore nel recupero dettagli storia"
            );
        }

        return data;
    } catch (err) {
        console.error("Errore di rete:", err);
        throw err;
    }
}

window.addEventListener("DOMContentLoaded", fetchCompletedGames);
