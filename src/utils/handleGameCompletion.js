const { activeGames } = require("../services/gameManager");
const { handlePlayersMap } = require("./removeGameFromPlayers");

function handleGameCompletion(game, gameId, io) {
    console.log("Game completed, starting final process...");

    // Gestione dei socket (disconnessione dopo che il gioco è completato)
    io.to(gameId).emit("gameCompleted", {
        gameId: gameId,
    });
    console.log("Before stopping countdown:");
    console.log("Countdown Interval ID:", game.countdownInterval); // Mostra l'ID dell'intervallo

    clearInterval(game.countdownInterval);
    game.countdownInterval = null;

    // Log dopo aver fermato l'intervallo
    console.log("After stopping countdown:");
    console.log("Countdown Interval ID:", game.countdownInterval); // Deve essere null

    // Log prima di chiamare handlePlayersMap
    console.log("Before handling players:");
    console.log("Players in game:", game.players); // Mostra i giocatori del gioco

    handlePlayersMap(game);

    // Log dopo aver gestito i giocatori
    console.log("After handling players:");
    console.log("Players after update:", game.players); // Mostra i giocatori dopo l'aggiornamento

    // Log prima di rimuovere il gioco da activeGames
    console.log("Before deleting from activeGames:");
    console.log("ActiveGames:", activeGames); // Mostra l'intero contenuto di activeGames

    console.log(`Removing game ${gameId} from activeGames`);
    delete activeGames[gameId];

    // Log dopo aver rimosso il gioco
    console.log("After deleting from activeGames:");
    console.log("ActiveGames:", activeGames); // Mostra
}

module.exports = { handleGameCompletion };
