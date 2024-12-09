const { client } = require('../database/db'); 

const checkUserStatus = async (req, res, next) => {
    try {
        const userId = req.user_id; // Assumi che `req.user_id` sia disponibile (ad esempio, dal token JWT o sessione)

        // Verifica lo status dell'utente
        const result = await client.query(`
            SELECT status 
            FROM users 
            WHERE user_id = $1;`,
            [userId]
        );

        const userStatus = result.rows[0]?.status;

        if (!userStatus) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Aggiungi lo status nel request per usarlo più avanti se necessario
        req.userStatus = userStatus;

        // Passa al middleware successivo o gestore
        next();
    } catch (error) {
        console.error('Error checking user status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = checkUserStatus;

