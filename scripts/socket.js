const logger = require("./logger.js");

module.exports = function(server) {
    const socket = require('socket.io');

    io = socket(server);     //socket.io server listens to https connections

    var games = Array(100);
    for (let i = 0; i < 50; i++) {
        games[i] = { players: 0, pid: [0, 0], custom: false };
    }
    for (let i = 50; i < 100; i++) {
        games[i] = { players: 0, pid: [0, 0], custom: true };
    }

    logger.info("=".repeat(40) + " Running " + "=".repeat(40));

    io.on('connection', function (socket) {
        // Client connects
        let playerId = socket.id;
        logger.info(playerId + ' connected');

        socket.on('joined', function (roomId) {
            logger.info(playerId + " tried to join room " + roomId);
            roomId = parseInt(roomId);
            if (isNaN(roomId)) {
                logger.info("Invalid room id.");
                logger.info(playerId + " was sent home.");
                socket.emit('home', roomId);
                return;
            }
            if (roomId < 0 || roomId >= games.length) {
                logger.info(playerId + " was sent home.");
                socket.emit('home', roomId);
            }
            else if (games[roomId].players < 2) {
                logger.info(playerId + " joined room " + roomId);
                games[roomId].players++;
                games[roomId].pid[games[roomId].players - 1] = playerId;

                socket.emit("playerJoin", {
                    playerId: playerId,
                    roomId: roomId,
                    custom: games[roomId].custom
                });
                 
                if (games[roomId].players == 2) {
                    io.emit("start", {
                        roomId: roomId,
                        player0: games[roomId].pid[0],
                        seed: Date.now()
                    });
                    logger.info("Game started on board " + roomId + " between " + games[roomId].pid[0] + " and " + games[roomId].pid[0]);
                }
            }
            else {
                logger.info(playerId + " was sent home.");
                socket.emit('home', roomId);
                return;
            }

        });

        socket.on('disconnect', function () {
            logger.info(playerId + ' disconnected');
            for (let i = 0; i < games.length; i++) {
                if (games[i].pid[0] == playerId || games[i].pid[1] == playerId) {
                    games[i].players--;
                    games[i].pid[0] = games[i].pid[0] == playerId ? games[i].pid[1] : games[i].pid[0];
                    games[i].pid[1] = null;
                    socket.broadcast.emit('reset', i);
                }
            }
        });

        socket.on('gameOver', function () {
            for (let i = 0; i < games.length; i++) {
                if (games[i].pid[0] == playerId || games[i].pid[1] == playerId) {
                    games[i].players = 0;
                    games[i].pid[0] = null;
                    games[i].pid[1] = null;
                    logger.info("Game over on board " + i + " between " + games[i].pid[0] + " and " + games[i].pid[0]);
                }
            }
        });

        socket.on('requestBoard', function (type) {
            let board = null;
            let boardWithPlayer = null
             
            switch (type) {
                case 0: {
                    logger.info(playerId + " requested a random game");
                    break;
                }
                // Custom game
                case 1: { 
                    logger.info(playerId + " requested a custom game");
                    break;
                }
            }
             
            for (let i = 0; i < games.length; i++) {
                switch (type) {
                    // Random game
                    case 0: {
                        if (games[i].players < 2 && !games[i].otb && !games[i].custom) {
                            if (games[i].players == 1) boardWithPlayer = i;
                            else board = i
                        }
                        break;
                    }
                    // Custom game
                    case 1: { 
                        if (games[i].players == 0 && !games[i].otb && games[i].custom) {
                            board = i
                        }
                        break;
                    }
                }
            }
            if (boardWithPlayer != null) {
                socket.emit('giveBoard', { id: boardWithPlayer, custom: games[boardWithPlayer].custom });
            }
            else if (board != null) {
                socket.emit('giveBoard', { id: board, custom: games[board].custom });
            }
        });

        socket.on('move', function (msg) {
            socket.broadcast.emit('move', msg);
        });

        socket.on('moveSelect', function (msg) {
            socket.broadcast.emit('moveSelect', msg);
        });
    });
}
