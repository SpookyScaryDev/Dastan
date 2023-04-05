var board = document.querySelector("dastan-board");
 
const gameOverBox = document.createElement('template');
gameOverBox.innerHTML = `
<div class="gameOverBox">
    <b style="font-size: 1.4em">Game Over!</b>
    <br>
    <div id="gameOverOutcome"></div>
    <div id="buttons" style="flex-direction: column">
        <a href="./"><div>Home</div></a>
        <a href="./otb"><div>Play Again</div></a>
    </div>
</div>
`;

function onGameOver(winner) {
    board.appendChild(gameOverBox.content.cloneNode(true));
    const div = board.querySelector(".gameOverBox");
    let text;
    if (winner == 2) text = "Draw";
    else text = "Player " + (winner + 1) + " Wins";
    div.querySelector("#gameOverOutcome").appendChild(document.createTextNode(text));
}

board.onGameOver = onGameOver;
addEventListener("resize", function () { board.onResize(); setTimeout(board.onResize.bind(board), 1); });
board.start(0, true, Date.now());
