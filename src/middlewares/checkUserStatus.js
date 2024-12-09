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

        if (userStatus === 'in_game') {
            const gameResult = await client.query(
                'SELECT game_id FROM players_in_game WHERE user_id = $1', 
                [userId]
            );

            if (gameResult.rows.length > 0) {
                req.game_id = gameResult.rows[0].game_id;
            } else {
                req.game_id = null;  // Se non trovi il game_id
            }
        } else {
            req.game_id = null;  // Se l'utente non è in gioco, non impostare il game_id
        }

        // Passa al middleware successivo o gestore
        next();
    } catch (error) {
        console.error('Error checking user status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = checkUserStatus;

