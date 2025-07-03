let ioInstance;

function initSocket(server) {
    ioInstance = require("socket.io")(server);

    ioInstance.on("connection", (socket) => {
        console.log("Client connected:", socket.id);
    });

    ioInstance.on("connect_error", (err) => {
        console.error("Connection error:", err);
    });

    return ioInstance;
}

function getSocket() {
    if (!ioInstance) {
        throw new Error("Socket.IO not initialized. Call initSocket first.");
    }
    return ioInstance;
}

module.exports = { initSocket, getSocket };
