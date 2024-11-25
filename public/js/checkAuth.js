async function checkSessionStatus() {
    try {
        const response = await fetch('/check-session', {
            method: 'GET',
            credentials: 'same-origin' 
        });

        if (!response.ok) {
            console.log("Sessione non valida");

            const currentPath = window.location.pathname;
            if (currentPath !== '/') {
                window.location.href = '/';
            }
        } else {
            console.log("Sessione valida");

            const currentPath = window.location.pathname;
            if (currentPath === '/') {
                window.location.href = '/dashboard';
            }
        }
    } catch (error) {
        console.error('Errore durante il controllo della sessione:', error);
    }
}

document.addEventListener('DOMContentLoaded', checkSessionStatus);

