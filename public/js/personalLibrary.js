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
    // const bookGenresContainer = document.getElementById("book-genre");
    const bookDescription = document.getElementById("book-summary");

    const chaptersContainer = document.querySelector(
        ".book-chapters-container"
    );
    chaptersContainer.innerHTML = "";
    authorsContainer.innerHTML = ""; // itera sugli autori, poi mettilo dentro bookDetails
    storyDetails.chapters.forEach((item) => {
        const authorDiv = document.createElement("div");
        const chapterDiv = document.createElement("div");
        chapterDiv.classList.add(
            "mt-4",
            "book-chapters",
            "flex",
            "flex-col",
            "gap-6"
        );
        authorDiv.classList.add("flex", "flex-col", "items-center");

        chapterDiv.innerHTML = `
            <h3 class="text-2xl font-semibold" id="chapter-title">
                Capitolo: ${item.title}
            </h3>
            <div class="flex items-center mt-2">
                <a href="/profile/${item.username}" class="flex items-center">
                    <div class="h-8 w-8 rounded-lg overflow-hidden mr-2">
                        <img src="/images/avatars/${item.avatar}.png" alt="Autore" class="w-full h-full object-contain" />
                    </div>
                    <span class="text-mg md:text-lg text-blue-600 hover:underline">${item.username}</span>
                </a>
            </div>
            <p class="text-gray-700 text-lg leading-relaxed md:text-2xl mt-2" id="chapter-text">
                ${item.content}
            </p>
        `;

        authorDiv.innerHTML = `
            <div class="w-12 h-12 rounded-lg overflow-hidden">
                <img src="/images/avatars/${item.avatar}.png" class="w-full h-full object-cover"/>
            </div>
            <span class="text-sm font-semibold mt-1">${item.username}</span>
        `;

        chaptersContainer.appendChild(chapterDiv);
        authorsContainer.appendChild(authorDiv);
    });

    // book.genres.forEach((genre) => {
    //     const bookGenre = document.createElement("p");
    //     bookGenre.textContent = genre;
    //     bookGenre.classList.add("text-gray-00");
    //     bookGenresContainer.appendChild(bookGenre);
    // });

    bookTitle.innerHTML = book.title;
    bookDescription.innerHTML = book.back_cover;

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
