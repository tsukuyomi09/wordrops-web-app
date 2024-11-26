const { gameQueue } = require('../routes/queueRoutesNew');  // Assicurati di avere l'accesso alla lista della coda

const checkUserStatus = (req, res, next) => {
    const userId = req.user_id;  // Ottieni l'ID utente dal middleware di autenticazione

    // Se l'utente non è autenticato
    if (!userId) {
        return res.status(401).json({ message: "Utente non autenticato." });
    }

    // Controlla se l'utente è nella coda
    const isInQueue = gameQueue.some(player => player.id === userId);

    // Assegna lo stato dell'utente in base alla sua posizione nella coda
    if (isInQueue) {
        req.userStatus = 'in queue';  // Se l'utente è in coda
    } else {
        req.userStatus = 'idle';  // Se l'utente non è in coda
    }

    // Passa al prossimo middleware o alla rotta
    next();
};

module.exports = checkUserStatus;

