const socket = io({ secure: true, closeOnBeforeunload: false });

function randomGame() {
    socket.emit('requestBoard', 0);
}

function customGame() {
    socket.emit('requestBoard', 1);
}

socket.on('giveBoard', function (msg) {
    window.open('./game?id=' + msg.id, '_self');
});
