const boardTemplate = document.createElement('template');
 
boardTemplate.innerHTML = `
<div class="game">
    <div class="board" onmousedown="return false">
    </div>
    <div class="info">
        <div class="message"></div>
        Offer:
        <div class="moveType" style="margin: 0.2em 0.7em">Jazair</div>
        <div class="playerInfo">
            <div class="playerNameAndScore">
                <div class="playerName">Player 1</div>
                <div class="playerScoreWhite">Score</div>
            </div>
            <div class="moveQueue">
                <div class="moveType">Ryott</div>
                <div class="moveType">Chowkidar</div>
                <div class="moveType">Cuirassier</div>
                <div class="moveType">Faujdar</div>
                <div class="moveType">Jazair</div>
            </div>
        </div>
        <div class="playerInfo">
            <div class="playerNameAndScore">
                <div class="playerName">Player 2</div>
                <div class="playerScoreBlack">Score</div>
            </div>
            <div class="moveQueue">
                <div class="moveType">Ryott</div>
                <div class="moveType">Chowkidar</div>
                <div class="moveType">Jazair</div>
                <div class="moveType">Faujdar</div>
                <div class="moveType">Cuirassier</div>
            </div>
        </div>
    </div>
</div>
`;

class Piece {
    constructor(x, y, player, piece, board) {
        this.board = board;

        this.div = document.createElement("div")
        this.div.setAttribute("class", "piece");
        this.div.style.top = y * this.board.calculateTileSize() + "px";
        this.div.style.left = x * this.board.calculateTileSize() + "px";
        this.div.style.width = this.board.calculateTileSize() + "px";
        this.div.style.height = this.board.calculateTileSize() + "px";
         
        this.x = x;
        this.y = y;
         
        this.player = player;

        this.piece = piece;

        this.onMove = null;
        this.onGameOver = null;

        const image = document.createElement("img");
        switch (piece) {
            case "pawn":
                image.src = player ?
                    "https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg" :
                    "https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg";
                break;

            case "mirza":
                image.src = player ?
                    "https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg" :
                    "https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg";
                break;
        }
        this.image = image;
        this.div.appendChild(image);
    }

    onResize() {
        this.setPosition(this.x, this.y);
        this.div.style.width = this.board.calculateTileSize() + "px";
        this.div.style.height = this.board.calculateTileSize() + "px";
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.div.style.top = y * this.board.calculateTileSize() + "px";
        this.div.style.left = x * this.board.calculateTileSize() + "px";
    }
}

class DastanBoard extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.appendChild(boardTemplate.content.cloneNode(true));

        this.div = this.querySelector('.board');

        this.top = this.querySelector('.board').getBoundingClientRect().top;
        this.left = this.querySelector('.board').getBoundingClientRect().left;

        this.turn = 0;

        this.playerInfo = this.div.parentElement.querySelectorAll(".playerInfo");
        this.playerInfo[this.turn].querySelector(".playerName").style.fontWeight = "bold";

        this.currentMove = -1;

        this.moveQueues = [[], []];
        this.moveQueues[0] = Array.from(this.playerInfo[0].querySelectorAll(".moveType"));
        this.moveQueues[1] = Array.from(this.playerInfo[1].querySelectorAll(".moveType"));

        // Setup move queue
        for (var i = 0; i < 5; i++) {
            const move0 = this.moveQueues[0][i];
            const move1 = this.moveQueues[1][i];
            move0.player = 0;
            move0.moveNum = i;
            move1.player = 1;
            move1.moveNum = i;

            move0.addEventListener("click", this.onMoveQueueClicked.bind(this));
            move1.addEventListener("click", this.onMoveQueueClicked.bind(this));

            move0.addEventListener("mouseenter", this.onMoveMouseEnter.bind(this));
            move0.addEventListener("mouseleave", this.onMoveMouseLeave.bind(this));
            move1.addEventListener("mouseenter", this.onMoveMouseEnter.bind(this));
            move1.addEventListener("mouseleave", this.onMoveMouseLeave.bind(this));
        }

        this.offer = this.querySelectorAll(".moveType")[0];
        this.offer.addEventListener("click", this.onMoveQueueClicked.bind(this));
        this.offer.addEventListener("mouseenter", this.onMoveMouseEnter.bind(this));
        this.offer.addEventListener("mouseleave", this.onMoveMouseLeave.bind(this));

        this.acceptOffer = false;

        this.updateMoveStyles();

        // Setup tiles
        this.tiles = [];
        for (let x = 0; x < 6; x++) {
            const array = [];
            for (let y = 0; y < 6; y++) {
                array.push(null);
            }
            this.tiles.push(array);
        }
        for (let y = 0; y < 6; y++) {
            for (let x = 0; x < 6; x++) {
                this.addTile(x, y);
            }
        }

        // Setup Kotlas
        this.kotlas = [document.createElement("div"), document.createElement("div")];
        this.kotlas[0].setAttribute("class", "kotle");
        this.tiles[2][0].appendChild(this.kotlas[0]);

        this.kotlas[1].setAttribute("class", "kotle");
        this.tiles[3][5].appendChild(this.kotlas[1]);

        this.drag = false;
        this.dragTarget = null;

        this.addEventListener("mousedown", this.onMouseDown);
        this.addEventListener("mouseup", this.onMouseUp);
        this.addEventListener("mousemove", this.mouseMove);

        this.addEventListener("touchstart", this.onMouseDown);
        this.addEventListener("touchend", this.onMouseUp);
        this.addEventListener("touchmove", this.mouseMove);

        // Create pieces
        this.pieces = [];
        this.setUpBoard();

        this.scores = [100, 100];
        this.updateScore(0);
        this.updateScore(1);

        this.started = false;
        this.gameOver = false;
        this.player = null;
        this.otb = false;

        this.message = this.querySelector(".message");
        this.updateMessage();
        this.message.parentElement.style.maxWidth = getComputedStyle(this.message.parentElement).width;
    }

    setUpBoard() {
        this.addPiece(new Piece(2, 0, 0, "mirza", this));
        this.addPiece(new Piece(1, 1, 0, "pawn", this));
        this.addPiece(new Piece(2, 1, 0, "pawn", this));
        this.addPiece(new Piece(3, 1, 0, "pawn", this));
        this.addPiece(new Piece(4, 1, 0, "pawn", this));

        this.addPiece(new Piece(3, 5, 1, "mirza", this));
        this.addPiece(new Piece(1, 4, 1, "pawn", this));
        this.addPiece(new Piece(2, 4, 1, "pawn", this));
        this.addPiece(new Piece(3, 4, 1, "pawn", this));
        this.addPiece(new Piece(4, 4, 1, "pawn", this));
    }

    addTile(x, y) {
        const newTile = document.createElement("div");

        newTile.setAttribute("class", "tile");
        newTile.style.backgroundColor = "rgb(235, 236, 208)";

        const canvas = document.createElement("canvas");
        newTile.appendChild(canvas);

        const border = document.createElement("div");
        border.setAttribute("class", "border");
        newTile.appendChild(border);

        if ((x % 2 != 0 && y % 2 == 0) || (x % 2 == 0 && y % 2 != 0)) {
            newTile.style.backgroundColor = "rgb(119, 149, 86)";
        }

        if (x == 0 && y == 0) newTile.style.borderTopLeftRadius = '5px';
        if (x == 0 && y == 5) newTile.style.borderBottomLeftRadius = '5px';
        if (x == 5 && y == 0) newTile.style.borderTopRightRadius = '5px';
        if (x == 5 && y == 5) newTile.style.borderBottomRightRadius = '5px';

        this.tiles[x][y] = newTile;

        this.querySelector('.board').appendChild(newTile);
    }

    addPiece(piece) {
        this.div.appendChild(piece.div);
        this.pieces.push(piece);
    }

    start(player, otb, seed) {
        this.player = player;
        this.otb = otb;
        this.started = true;
        this.rnd = new Math.seedrandom(seed);
        this.updateMessage();
    }

    end() {
        this.gameOver = true;
    }

    endTurn() {
        this.updateMoveQueue(this.turn);
        this.updateMoveStyles();
        this.currentMove = -1;
        this.acceptOffer = false;

        this.playerInfo[this.turn].querySelector(".playerName").style.fontWeight = "";

        this.scoreKotlas();

        this.turn = (this.turn + 1) % 2;

        this.playerInfo[this.turn].querySelector(".playerName").style.fontWeight = "bold";

        var winner = this.scores[0] > this.scores[1] ? 0 : 1;
        if (this.scores[0] == this.scores[1]) winner = 2;
        if (this.gameOver) this.onGameOver(winner);

        this.updateMessage();
    }

    refreshOffer() {
        // Select a new move type for the offer
        const moves = ["Ryott", "Chowkidar", "Faujdar", "Jazair", "Cuirassier"];
        this.offer.innerHTML = moves[Math.abs(this.rnd.int32()) % moves.length];
        this.updateMoveStyles(this.offer);
    }

    outlineTile(x, y) {
        const div = this.tiles[x][y].querySelector(".border");
        div.style.borderWidth = "5px";
    }

    clearOutlines() {
        for (var x = 0; x < 6; x++) {
            for (var y = 0; y < 6; y++) {
                const div = this.tiles[x][y].querySelector(".border");
                div.style.borderWidth = "0px";
            }
        }
    }

    takePiece(piece) {
        for (var i = 0; i < this.pieces.length; i++) {
            if (this.pieces[i].x == piece.x && this.pieces[i].y == piece.y) {
                if (piece.piece == 'mirza') this.end();
                this.scoreTakePiece(piece);
                this.div.removeChild(this.pieces[i].div);
                this.pieces.splice(i, 1);
                return;
            }
        }
    }

    mouseMove(event) {
        if (!this.drag) return;

        if (!event) var event = window.event;

        event.preventDefault();

        var clientX = event.clientX || event.touches[0].clientX;
        var clientY = event.clientY || event.touches[0].clientY;

        const left = clientX - this.div.getBoundingClientRect().left;
        const top = clientY - this.div.getBoundingClientRect().top;

        const x = Math.floor(left / this.calculateTileSize());
        const y = Math.floor(top / this.calculateTileSize());

        this.dragX = x;
        this.dragY = y;

        this.dragTarget.div.style.left = left - this.calculateTileSize() / 2 + 'px';
        this.dragTarget.div.style.top = top - this.calculateTileSize() / 2 + 'px';

        this.clearOutlines();

        if (x >= 0 && x < 6 && y >= 0 && y < 6) {
            this.outlineTile(x, y);
        }
    }

    movePiece(piece, x, y) {
        const targetPiece = this.getPieceAt(x, y);
        if (targetPiece) {
            this.takePiece(targetPiece);
        }
        this.updateMoveScore();
        piece.setPosition(x, y);
        this.endTurn();
    }

    isMoveValid(piece, x, y) {
        if (!this.started || this.gameOver) return false;

        if (!this.otb && this.player != this.turn) return false;

        if (piece.player != this.turn) return false;

        if (this.currentMove == -1) return;

        if (piece.x == x && piece.y == y) return false;

        if (!(x >= 0 && x < 6 && y >= 0 && y < 6)) return false;

        const piece2 = this.getPieceAt(x, y);
        if (piece2) {
            if (piece.player == this.getPieceAt(x, y).player) return false;
        }

        const direction = this.turn ? 1 : -1;

        switch (this.moveQueues[this.turn][this.currentMove].innerHTML) {
            case "Ryott":
                if (Math.abs(piece.x - x) == 1 && piece.y == y ||
                    Math.abs(piece.y - y) == 1 && piece.x == x) {
                    return true;
                }
                break;

            case "Chowkidar":
                if ((Math.abs(piece.x - x) == 1 && Math.abs(piece.y - y) == 1) ||
                    (Math.abs(piece.x - x) == 2 && piece.y == y)) {
                    return true;
                }
                break;

            case "Faujdar":
                if (Math.abs(piece.x - x) <= 2 && piece.y == y) {
                    return true;
                }
                break;

            case "Jazair":
                if (((piece.y == y + 2 * direction || y == piece.y) && (Math.abs(piece.x - x) == 2 || piece.x == x)) ||
                    (Math.abs(piece.x - x) == 1 && piece.y == y - 1 * direction)) {
                    return true;
                }
                break;

            case "Cuirassier":
                if ((piece.y == y + 1 * direction && (Math.abs(piece.x - x) == 2 || piece.x == x)) ||
                    (piece.x == x && piece.y == y + 2 * direction)) {
                    return true;
                }
                break;
        }

        return false;
    }

    showValidMoves(piece) {
        for (let x = 0; x < 6; x++) {
            for (let y = 0; y < 6; y++) {
                if (this.isMoveValid(piece, x, y)) {
                    const tile = this.tiles[x][y];
                    const context = tile.querySelector("canvas").getContext("2d");
                    context.beginPath();
                    if (this.getPieceAt(x, y)) {
                        context.arc(tile.style.left + this.calculateTileSize() / 2, tile.style.top + this.calculateTileSize() / 2, this.calculateTileSize() * 0.9 / 2, 0, 2 * Math.PI, false);
                        context.lineWidth = this.calculateTileSize() * 0.07;
                        context.strokeStyle = "rgba(0, 0, 0, 0.1)";
                        context.stroke();
                    }
                    else {
                        context.arc(tile.style.left + this.calculateTileSize() / 2, tile.style.top + this.calculateTileSize() / 2, this.calculateTileSize() / 3 / 2, 0, 2 * Math.PI, false);
                        context.fillStyle = "rgba(0, 0, 0, 0.1)";
                        context.fill();
                    }
                }
            }
        }
    }

    clearValidMoves() {
        for (let x = 0; x < 6; x++) {
            for (let y = 0; y < 6; y++) {
                const tile = this.tiles[x][y];
                const context = tile.querySelector("canvas").getContext("2d");
                context.clearRect(0, 0, this.calculateTileSize(), this.calculateTileSize());
            }
        }
    }

    selectMove(move) {
        // Select a movement style / take an offer
        if (!this.started || this.gameOver) return false;
        if (!this.acceptOffer && move.moveNum >= 3) return;
        if (move.moveNum == this.currentMove) {
            this.currentMove = -1;
            this.moveResetColours(move);
            return;
        }
        if (move == this.offer && this.acceptOffer) {
            this.acceptOffer = false;
            this.moveResetColours(move);
            return;
        }
        if (move == this.offer) {
            if (this.currentMove >= 0) {
                this.moveResetColours(this.moveQueues[this.turn][this.currentMove]);
                this.currentMove = -1;
            }
            this.acceptOffer = true;
        }
        else {
            if (this.acceptOffer) {
                move.innerHTML = this.offer.innerHTML;
                this.acceptOffer = false;
                this.updateMoveStyles(move);
                this.updateMoveStyles(this.offer);
                this.updateTakeOfferScore(move);
                this.refreshOffer();
                return;
            }
        }
         
        if (this.currentMove >= 0) this.moveResetColours(this.moveQueues[this.turn][this.currentMove]);
        move.style.borderColor = "white";
         
        if (!(move == this.offer)) this.currentMove = move.moveNum;
         
        this.moveSelect(move);
        this.updateMessage()
    }

    getMoveColour(move) {
        return window.getComputedStyle(move).getPropertyValue("--move-colour-" + move.innerHTML.toLowerCase());
    }

    moveSelect(move) {
        move.style.backgroundColor = this.getMoveColour(move);
    }

    moveResetColours(move) {
        move.style.backgroundColor = "";
        move.style.borderColor = this.getMoveColour(move);
    }

    getPieceAt(x, y) {
        for (var i = 0; i < this.pieces.length; i++) {
            const piece = this.pieces[i];
            if (piece.x == x && piece.y == y) return piece;
        }
        return null;
    }

    calculateTileSize() {
        return parseFloat(getComputedStyle(this.tiles[0][0]).width);
    }

    updateMessage() {
        if (!this.otb) this.message.innerHTML = "You are Player " + (this.player + 1) + ": ";
        else {
            this.message.innerHTML = "Player " + (this.turn + 1) + ": ";
        }

        if (!this.started) {
            this.message.innerHTML = "Waiting for opponent...";
        }
        else if (this.gameOver) {
            this.message.innerHTML = "Game Over";
        }
        else if (this.otb || (this.turn == this.player)) {
            if (this.currentMove == -1) {
                this.message.innerHTML += "Pick a move style or take an offer.";
            }
            else {
                this.message.innerHTML += "Make a move or pick a new move style.";
            }
        }
        else {
            this.message.innerHTML += "Wait for your turn..."
        }
    }

    updateMoveQueue(player) {
        var queue = this.moveQueues[player];
        const temp = queue[this.currentMove].innerHTML;
        for (var i = this.currentMove; i < queue.length - 1; i++) {
            queue[i].innerHTML = queue[i + 1].innerHTML;
        }
        queue[queue.length - 1].innerHTML = temp;
    }

    updateMoveStyles() {
        // Set the move types to the correct colour
        for (var i = 0; i < this.moveQueues[0].length; i++) {
            const move0 = this.moveQueues[0][i];
            const move1 = this.moveQueues[1][i];
            this.moveResetColours(move0);
            this.moveResetColours(move1);
        }
        this.moveResetColours(this.offer);
    }

    updateScore(player) {
        this.playerInfo[player].querySelector(".playerNameAndScore").children[1].innerHTML = this.scores[player];
    }

    updateMoveScore() {
        const choice = this.currentMove + 1;
        this.scores[this.turn] -= choice + (2 * (choice - 1))
        this.updateScore(this.turn);
    }

    updateTakeOfferScore(move) {
        const choice = move.moveNum + 1;
        this.scores[this.turn] -= 10 - (choice * 2);
        this.updateScore(this.turn);
    }

    scoreTakePiece(piece) {
        this.scores[this.turn] += piece.piece == "mirza" ? 5 : 1;
        this.updateScore(this.turn);
    }

    scoreKotlas() {
        const pieceInKotla0 = this.getPieceAt(2, 0);
        if (pieceInKotla0) {
            if (pieceInKotla0.player == this.turn) {
                if (pieceInKotla0.player == 0) {
                    this.scores[this.turn] += 5;
                }
                else {
                    this.scores[this.turn] += 1;
                    this.end();
                }
            }
        }

        const pieceInKotla1 = this.getPieceAt(3, 5);
        if (pieceInKotla1) {
            if (pieceInKotla1.player == this.turn) {
                if (pieceInKotla1.player == 1) {
                    this.scores[this.turn] += 5;
                }
                else {
                    this.scores[this.turn] += 1;
                    this.end();
                }
            }
        }

        this.updateScore(this.turn);
    }

    onResize(event) {
        for (var i = 0; i < this.pieces.length; i++) {
            this.pieces[i].onResize(event);
        }
        this.message.parentElement.style.maxWidth = getComputedStyle(this.message.parentElement.parentElement).width;
    }

    onMoveQueueClicked(event) {
        if (!this.otb && this.player != this.turn) return false;
         
        event = event || window.event;
        const button = event.target ? event.target : event.srcElement;

        if (button.player == this.turn || button == this.offer) {
            if (this.onMoveSelect) this.onMoveSelect(button);
            this.selectMove(button);
        }
    }

    onMoveMouseEnter(event) {
        if (!this.started || this.gameOver) return;
        if (!this.otb && this.player != this.turn) return false;

        event = event || window.event;
        const button = event.target ? event.target : event.srcElement;

        if ((button.player != this.turn && button != this.offer) || (button.moveNum >= 3 && !this.acceptOffer)) return;

        this.moveSelect(button);
    }

    onMoveMouseLeave(event) {
        event = event || window.event;
        const button = event.target ? event.target : event.srcElement;

        if (button == this.offer && this.acceptOffer) return;
        if (this.currentMove != button.moveNum || this.turn != button.player) {
            this.moveResetColours(button);
        }
    }

    onMouseDown(event) {
        if (this.drag) return;
        event = event || window.event;

        const target = event.target ? event.target : event.srcElement;
         
        if (target.className != "piece") return;

        target.style.zIndex = 999;
        target.style.cursor = "grabbing";

        this.drag = true;

        event.preventDefault();

        var clientX = event.clientX || event.touches[0].clientX;
        var clientY = event.clientY || event.touches[0].clientY;

        const top = clientY - this.div.getBoundingClientRect().top;
        const left = clientX - this.div.getBoundingClientRect().left;

        const x = Math.floor(left / this.calculateTileSize());
        const y = Math.floor(top / this.calculateTileSize());

        this.dragX = x;
        this.dragY = y;

        this.dragTarget = this.getPieceAt(x, y);
        this.showValidMoves(this.dragTarget);
    }

    onMouseUp() {
        if (!this.drag) return;

        this.drag = false;

        const x = this.dragX;
        const y = this.dragY;

        if (this.isMoveValid(this.dragTarget, x, y)) {
            if (this.onMove) this.onMove(this.dragTarget, x, y);
            this.movePiece(this.dragTarget, x, y);
        }
        else {
            this.dragTarget.setPosition(this.dragTarget.x, this.dragTarget.y);
        }

        this.dragTarget.div.style.zIndex = 500;
        this.dragTarget.div.style.cursor = "grab";

        this.dragTarget = null;

        this.clearValidMoves();
        this.clearOutlines();
    }
}

customElements.define("dastan-board", DastanBoard);
