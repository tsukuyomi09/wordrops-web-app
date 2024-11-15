const { client } = require('../database/db'); 

async function getUserByUsername(loginUserName) {
    const query = "SELECT user_id, password FROM users WHERE username = $1";
    const result = await client.query(query, [loginUserName]);
    if (result.rows.length === 0) {
        throw new Error("Invalid Credentials");
    }
    return result.rows[0];
}

module.exports = { getUserByUsername };