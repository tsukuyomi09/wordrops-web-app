const { client } = require('../database/db'); 

async function getUserByUsername(loginUserName) {
    const query = "SELECT user_id, password, username FROM users WHERE username = $1";
    const result = await client.query(query, [loginUserName]);
    if (result.rows.length === 0) {
        console.log(`errore getUserByUsername`)
        throw new Error("Invalid Credentials");
    }
    console.log(`passato getUserByUsername`)
    return result.rows[0];
}

module.exports = { getUserByUsername };