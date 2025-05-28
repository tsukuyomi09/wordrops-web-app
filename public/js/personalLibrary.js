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

                renderCompletedGames(data.completedGames);
            }
        } else {
            console.log(
                "Errore nel recupero dei giochi completati:",
                data.message
            );
        }
    } catch (err) {
        console.log("Errore di rete:", err);
    }
}

function renderCompletedGames(books) {
    const container = document.getElementById("stories-container");

    books.forEach((book) => {
        const storyDiv = document.createElement("div");
        storyDiv.classList.add(
            "story",
            "p-2",
            "text-center",
            "hover:bg-green-100",
            "cursor-pointer",
            "transition-all",
            "duration-300",
            "ease-in-out"
        );

        storyDiv.setAttribute("data-game-id", book.id);

        storyDiv.innerHTML = `
        <div class="p-2 md:p-4  rounded-lg w-full flex flex-col items-start gap-2">
            <!-- Immagine del libro -->
            <div class="w-12 md:w-16  aspect-[2/3]">
                <img src="${book.cover_image_url}" alt="Icona Libro" class="w-full h-full object-cover rounded">
            </div>

            <!-- Titolo sotto, allineato a sinistra -->
            <h3 class="story-title text-sm font-semibold text-left italic"> ${book.title}</h3>
        </div>
            `;

        storyDiv.addEventListener("click", async () => {
            const gameId = storyDiv.getAttribute("data-game-id");
            const storyDetails = await fetchStoryDetails(gameId);

            openBookOverlay(book, storyDetails);
        });
        container.appendChild(storyDiv);
    });
}

// Funzione per aprire l'overlay

function openBookOverlay(book, storyDetails) {
    const overlay = document.getElementById("overlay-books");
    const bookCoverDesk = document.querySelector(".book-cover-desk");
    const bookCoverMob = document.querySelector(".book-cover-mob");

    const bookTitle = document.getElementById("book-title");
    const authorsContainer = document.getElementById("authors-container");
    const bookGenresContainer = document.getElementById("book-genre");
    const bookDescription = document.getElementById("book-summary");
    const bookRating = document.getElementById("average-rating");
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
        chapterDiv.classList.add("book-chapters", "flex", "flex-col", "gap-6");
        authorDiv.classList.add("flex", "flex-col", "items-center");

        chapterDiv.innerHTML = `
            <h3 class="text-xl font-semibold italic" id="chapter-title">
                 ${item.title}
            </h3>
            <div class="flex items-center">
                <a href="/profile-page/${item.username}" target="_blank" class="flex items-center">
                    <div class="size-10 rounded-lg overflow-hidden mr-2">
                        <img src="/images/avatars/${item.avatar}.png" alt="Autore" class="w-full h-full object-contain" />
                    </div>
                    <span class="text-mg md:text-lg font-semibold ">${item.username}</span>
                </a>
            </div>
            <p class="text-gray-700 text-md leading-[2.5] md:text-lg mt-2" id="chapter-text">
                ${item.content}
            </p>
        `;

        authorDiv.innerHTML = `
            <div class="size-8 rounded-lg overflow-hidden">
                <a href="/profile-page/${item.username}" target="_blank" class="flex items-center">
                    <img src="/images/avatars/${item.avatar}.png" class="w-full h-full object-cover"/>
                </a>
            </div>
            <span class="text-sm mt-1">${item.username}</span>
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
            "border-1",
            "border-gray-200",
            "rounded-lg",
            "text-sm"
        );
        bookGenresContainer.appendChild(bookGenre);
    });

    bookTitle.innerHTML = `"${book.title}"`;
    bookDescription.innerHTML = book.back_cover;
    bookCoverDesk.src = book.cover_image_url;
    bookCoverMob.src = book.cover_image_url;

    bookRating.innerHTML = `${storyDetails.average}`;
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
        console.log("Errore di rete:", err);
        throw err;
    }
}

window.addEventListener("DOMContentLoaded", fetchCompletedGames);
