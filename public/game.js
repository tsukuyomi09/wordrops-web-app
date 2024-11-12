function toggleQueue() {
    if (!inQueue) {
        // Entrare in coda
        fetch('/join-queue', { method: 'POST' })
            .then(response => {
                if (response.ok) {
                    inQueue = true;
                    document.getElementById('queue-button').textContent = 'Abbandona';
                }
            });
    } else {
        // Uscire dalla coda
        fetch('/leave-queue', { method: 'POST' })
            .then(response => {
                if (response.ok) {
                    inQueue = false;
                    document.getElementById('queue-button').textContent = 'Nuova partita';
                }
            });
    }
}