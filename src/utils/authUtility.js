const argon2 = require("argon2");

async function verifyPassword(storedHash, loginPassword) {
    const passwordMatch = await argon2.verify(storedHash, loginPassword);
    if (!passwordMatch) {
        throw new Error("Invalid Credentials");
    }
}
module.exports = { verifyPassword };
