const sessions = {};

const generateSessionId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

const createSession = (user_id) => {
    const sessionId = generateSessionId();
    sessions[sessionId] = user_id;
    return sessionId;
}

const getUserIdFromSession = (sessionId) => {
    return sessions[sessionId];
};

const deleteSession = (sessionId) => {
    delete sessions[sessionId];
};


module.exports = { createSession, getUserIdFromSession, deleteSession };