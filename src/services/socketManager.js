let ioInstance;

function initSocket(server) {
    ioInstance = require('socket.io')(server);
    return ioInstance;
}

function getSocket() {
    if (!ioInstance) {
        throw new Error("Socket.IO non inizializzato. Chiama initSocket prima.");
    }
    return ioInstance;
}

module.exports = { initSocket, getSocket };
