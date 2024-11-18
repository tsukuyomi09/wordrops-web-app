async function checkSessionStatus() {
    try {
        const response = await fetch('/check-session', {
            method: 'GET',  // Usa il metodo GET per inviare la richiesta
            credentials: 'same-origin' // Invia i cookie con la richiesta
        });

        const data = await response.json();

        if (data.sessionActive) {
            // Se la sessione è attiva, reindirizza l'utente alla pagina del dashboard
            window.location.href = '/dashboard'; // Cambia la destinazione in base alla tua app
        } else {
            console.log('Sessione non attiva. Permesso di registrarsi.');
        }

    } catch (error) {
        console.error('Errore durante il controllo della sessione:', error);
    }
}

// Verifica se l'utente ha una sessione attiva appena carica la pagina
checkSessionStatus();