async function fetchCompletedGames() {
    try {
        const response = await fetch("/personalLibrary");
        const data = await response.json();

        if (response.ok) {
            if (data.completedGames.length > 0) {
                const containerToReveal = document.getElementById(
                    "stories-container-wrapper"
                );
                containerToReveal.classList.remove("hidden"); // Rende visibile il contenitore
                renderCompletedGames(data.completedGames); // Se ci sono giochi, li renderizza
            } else {
                console.log("Non ci sono giochi completati.");
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

// Funzione per visualizzare i titoli sulla dashboard
function renderCompletedGames(completedGames) {
    const container = document.getElementById("stories-container");
    container.innerHTML = ""; // Resetta il contenuto prima di aggiungere i nuovi giochi

    completedGames.forEach((game) => {
        // Crea un div per ogni titolo di gioco completato
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

        // Crea solo il titolo per la storia
        storyDiv.innerHTML = `
        <div class="border p-4 rounded-lg w-full flex items-center gap-4">
            <!-- Immagine del libro -->
            <div class="w-12 h-12 flex-shrink-0">
                <img src="/images/book-icon.png" alt="Icona Libro" class="w-full h-full object-cover rounded">
            </div>
    
            <!-- Titolo a destra -->
            <h3 class="story-title text-sm text-left font-semibold">Titolo: ${game.title}</h3>
        </div>
    `;

        // Aggiungi l'evento per il click sul titolo (anche se per ora non fa nulla)
        storyDiv.addEventListener("click", () => {
            openBookOverlay();
            console.log(`Hai cliccato su: ${game.title}`);
        });

        // Aggiungi il div della storia alla dashboard
        container.appendChild(storyDiv);
    });
}

// Funzione per aprire l'overlay

function openBookOverlay() {
    var overlay = document.getElementById("overlay-books");
    overlay.style.display = "flex";
    setTimeout(() => {
        overlay.classList.remove("opacity-0", "translate-y-10");
        overlay.classList.add("opacity-100", "translate-y-0");
    }, 10);
    e;
}

function closeBookOverlay() {
    var overlay = document.getElementById("overlay-books");
    overlay.classList.remove("opacity-100", "translate-y-0");
    overlay.classList.add("opacity-0", "translate-y-10");
    setTimeout(() => {
        overlay.style.display = "none";
    }, 500);
}

// Chiamata alla funzione per caricare i giochi completati al caricamento della pagina
window.addEventListener("DOMContentLoaded", fetchCompletedGames);
