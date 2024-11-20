async function checkSessionStatus() {
    try {
        const response = await fetch('/check-session', {
            method: 'GET',
            credentials: 'same-origin' // Invia i cookie con la richiesta
        });


        if (!response.ok) {
            console.log("sessione non valida")
            // Sessione non valida, fai il redirect alla pagina di login (/register)
            const currentPath = window.location.pathname;
            if (currentPath !== '/') {
                window.location.href = '/'; // Vai alla pagina di login
            }
            return;
        } else {
            console.log("sessione valida")

            const currentPath = window.location.pathname;
            if (currentPath === '/') {
                // Se siamo sulla pagina di login e la sessione è attiva, vai su /dashboard
                window.location.href = '/dashboard';
            }
        }

    } catch (error) {
        console.error('Errore durante il controllo della sessione:', error);
    }
}

// Verifica lo stato della sessione appena carica la pagina
document.addEventListener('DOMContentLoaded', checkSessionStatus);