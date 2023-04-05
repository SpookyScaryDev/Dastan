var board = document.querySelector("dastan-board");
var roomId;
var playerId;
var player;
var custom = false;

const gameOverBox = document.createElement('template');
gameOverBox.innerHTML = `
<div class="gameOverBox">
    <b style="font-size: 1.4em">Game Over!</b>
    <br>
    <div id="gameOverOutcome"></div>
    <div id="buttons" style="flex-direction: column">
        <a href="./"><div>Home</div></a>
        <a><div>Play Again</div></a>
    </div>
</div>
`;

const shareGame = document.createElement('template');
shareGame.innerHTML = `
Share this link with your opponent to begin the game:
<div class="shareBox">
    <div class="icon"><ion-icon onclick="shareURL()" name="clipboard"></ion-icon></div>
</div>
`;

function onMove(piece, x, y) {
    socket.emit("move", {
        start: [piece.x, piece.y],
        end: [x, y],
        roomId: roomId
    });
}

function onMoveSelect(move) {
    socket.emit("moveSelect", {
        move: move.moveNum,
        offer: move == board.offer,
        roomId: roomId
    });
}

function onGameOver(winner) {
    board.appendChild(gameOverBox.content.cloneNode(true));
    const div = board.querySelector(".gameOverBox");
    let text;
    if (winner == board.player) text = "You Win";
    else if (winner == 2) text = "Draw";
    else text = "You Lose";
    div.querySelector("#gameOverOutcome").appendChild(document.createTextNode(text));
    if (custom) {
        div.querySelector("#buttons").querySelectorAll("a")[1].onclick = function () { location.reload() };
    }
    else {
        div.querySelector("#buttons").querySelectorAll("a")[1].onclick = function () { randomGame(); };
    }
    socket.emit("gameOver");
}

function setupBoard() {
    board.onMove = onMove;
    board.onMoveSelect = onMoveSelect;
    board.onGameOver = onGameOver;
    addEventListener("resize", function () { board.onResize(); setTimeout(board.onResize.bind(board), 1); });
    if (custom) {
        const message = document.querySelector(".message");
        message.innerHTML = " ";
        message.appendChild(shareGame.content.cloneNode(true));
        message.querySelector(".shareBox").prepend(document.createTextNode(window.location.href));
    }
}

socket.on('move', function (msg) {
    if (msg.roomId != roomId) return;
    const start = msg.start;
    const end = msg.end;
    board.movePiece(board.getPieceAt(start[0], start[1]), end[0], end[1]);
});

socket.on('moveSelect', function (msg) {
    if (msg.roomId != roomId) return;
    var move = board.moveQueues[board.turn][msg["move"]];
    if (msg["offer"]) move = board.offer;
    board.selectMove(move);
});

socket.on('home', function () {
    window.location.href = "./";
});

socket.on('playerJoin', function (msg) {
    if (msg.roomId == roomId && player == null) {
        playerId = msg.playerId;
        custom = msg.custom;
        setupBoard();
    }
});

socket.on('start', function (msg) {
    if (msg.roomId == roomId) {
        board.start(playerId != msg.player0, msg.otb, msg.seed);
    }
});

socket.on("reset", function (msg) {
    if (msg == roomId) {
        board.replaceWith(document.createElement("dastan-board"));
        board = document.querySelector("dastan-board");
        setupBoard();
    }
})

function shareURL() {
    document.querySelector(".shareBox").querySelector(".icon").style = "color: #5a7aed";
    navigator.clipboard.writeText(window.location.href);
}

window.onbeforeunload = function () {
    if (board.started && !board.gameOver) {
        return "Data will be lost if you leave the page, are you sure?";
    }
};

let params = new URLSearchParams(location.search);
roomId = params.get('id');

socket.emit('joined', roomId);
