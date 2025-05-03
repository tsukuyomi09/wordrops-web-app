const { client } = require("../database/db");

async function getUserByEmail(email) {
    const query =
        "SELECT user_id, password, username, avatar, email, verified FROM users WHERE email = $1";
    const result = await client.query(query, [email]);
    if (result.rows.length === 0) {
        throw new Error("User not found");
    }
    return result.rows[0];
}

module.exports = { getUserByEmail };
