let ioInstance;

function initSocket(server) {
    ioInstance = require("socket.io")(server);

    ioInstance.on("connection", (socket) => {
        console.log("Client connesso:", socket.id);
    });

    ioInstance.on("connect_error", (err) => {
        console.error("Errore di connessione:", err);
    });

    return ioInstance;
}

function getSocket() {
    if (!ioInstance) {
        throw new Error(
            "Socket.IO non inizializzato. Chiama initSocket prima."
        );
    }
    return ioInstance;
}

module.exports = { initSocket, getSocket };
