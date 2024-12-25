async function fetchCompletedGames() {
    try {
        const response = await fetch('/personal-library');
        const data = await response.json();
        
        if (response.ok) {
            if (data.completedGames.length > 0) {
                const containerToReveal = document.getElementById('stories-container-absolute');
                containerToReveal.classList.remove('hidden'); // Rende visibile il contenitore
                renderCompletedGames(data.completedGames); // Se ci sono giochi, li renderizza
            } else {
                console.log('Non ci sono giochi completati.');
            }
        } else {
            console.error('Errore nel recupero dei giochi completati:', data.message);
        }
    } catch (err) {
        console.error('Errore di rete:', err);
    }
}

// Funzione per visualizzare i titoli sulla dashboard
function renderCompletedGames(completedGames) {
    const container = document.getElementById('stories-container');
    container.innerHTML = ''; // Resetta il contenuto prima di aggiungere i nuovi giochi

    completedGames.forEach(game => {
        // Crea un div per ogni titolo di gioco completato
        const storyDiv = document.createElement('div');
        storyDiv.classList.add('story', 'bg-white', 'bg-opacity-60', 'p-2', 'rounded-lg', 'shadow-md', 'text-center', 'hover:bg-green-100', 'cursor-pointer', 'transition-all', 'duration-300', 'ease-in-out');
        
        // Crea solo il titolo per la storia
        storyDiv.innerHTML = `
            <div class="story-icon mb-2">
                <img src="/images/book-icon.png" alt="Icona Libro" class="w-8 h-8 mx-auto">
            </div>
            <h3 class="story-title text-sm font-semibold">${game.title}</h3>
        `;

        // Aggiungi l'evento per il click sul titolo (anche se per ora non fa nulla)
        storyDiv.addEventListener('click', () => {
            // Al momento, non facciamo niente quando viene cliccato
            console.log(`Hai cliccato su: ${game.title}`);
        });

        // Aggiungi il div della storia alla dashboard
        container.appendChild(storyDiv);
    });
}

// Chiamata alla funzione per caricare i giochi completati al caricamento della pagina
window.addEventListener('DOMContentLoaded', fetchCompletedGames);