window.onload = async () => {
    try {
        console.log(`fetch partita`)
        const response = await fetch('/checkUserGameStatus', {
            method: 'GET', 
            credentials: 'include',  // Assicurati di includere i cookie per l'autenticazione
        });

        if (response.ok) {
            const data = await response.json();

            if (data.isInGame) {
                console.log(`Sì, l'utente è in partita con gameId: ${data.gameId}`);
            } else {
                console.log("L'utente non è in partita.");
            }
        } else {
            console.error("Errore nella fetch: Impossibile verificare lo stato del gioco.");
        }
    } catch (error) {
        console.error("Errore durante il controllo della partita:", error);
    }
};