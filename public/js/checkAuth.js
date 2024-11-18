async function checkSessionStatus() {
    try {
        const response = await fetch('/check-session', {
            method: 'GET', // Usa il metodo GET per inviare la richiesta
            credentials: 'same-origin' // Invia i cookie con la richiesta
        });

        const data = await response.json();

        const currentPath = window.location.pathname; // Ottieni il percorso corrente (es. /register o /dashboard)

        if (data.sessionActive) {
            if (currentPath === '/register') {
                // Se siamo su /register e la sessione è attiva, vai su /dashboard
                window.location.href = '/dashboard';
            } 
            // Per qualunque altra pagina, non fare nulla se la sessione è attiva
        } else {
            if (currentPath !== '/register') {
                // Se non siamo su /register e la sessione non è attiva, vai su /register
                window.location.href = '/register';
            }
            // Se siamo su /register e la sessione non è attiva, non fare nulla
        }

    } catch (error) {
        console.error('Errore durante il controllo della sessione:', error);
    }
}

// Verifica lo stato della sessione appena carica la pagina
checkSessionStatus();