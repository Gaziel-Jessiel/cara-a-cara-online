const socket = io();

const statusDiv = document.getElementById("status");

function createRoom() {
    const roomId = Math.random().toString(36).substring(2, 8);
    socket.emit("createRoom", roomId);
    statusDiv.innerText = "Sala criada: " + roomId;
}

function joinRoom() {
    const roomId = document.getElementById("roomInput").value;
    socket.emit("joinRoom", roomId);
    statusDiv.innerText = "Entrando na sala...";
}

socket.on("roomCreated", (roomId) => {
    statusDiv.innerText = "Você criou a sala: " + roomId;
});

socket.on("playerJoined", (data) => {
    statusDiv.innerText = `Jogador conectado! Total na sala: ${data.players}`;
});

socket.on("errorMessage", (msg) => {
    statusDiv.innerText = "Erro: " + msg;
});