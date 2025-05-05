document.addEventListener("DOMContentLoaded", () => {
    async function getUserStats() {
        try {
            const response = await fetch("/profile/user-stats", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Errore nella rete");
            }

            const data = await response.json();

            if (data) {
                // Chiama la tua funzione qui
                showStatsOnScreen(data);
            }
        } catch (error) {
            console.error("Errore durante il recupero dei dati:", error);
        }
    }

    getUserStats();
});

function showStatsOnScreen(data) {
    const ranked_score = document.getElementById("punteggio-ranked");
    const stories_abandoned = document.getElementById("abbandoni");
    const classic_played = document.getElementById("partite-classiche");
    const ranked_played = document.getElementById("partite-ranked");
    const perfect_performances = document.getElementById("miglior-performance");
    const worst_performances = document.getElementById("partite-pessime");

    ranked_score.textContent = data.ranked_score;
    stories_abandoned.textContent = data.stories_abandoned;
    classic_played.textContent = data.classic_played;
    ranked_played.textContent = data.ranked_played;
    perfect_performances.textContent = data.perfect_performances;
    worst_performances.textContent = data.worst_performances;
}
