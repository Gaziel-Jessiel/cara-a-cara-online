const socket = io("https://cara-a-cara-online-zikq.onrender.com");

const statusDiv = document.getElementById("status");

let currentRoom = "";
let characters = [];

socket.on("connect", () => {
    console.log("Conectado:", socket.id);
});

function createRoom() {

    const roomId =
        Math.random().toString(36).substring(2,8);

    currentRoom = roomId;

    socket.emit("createRoom", roomId);

    statusDiv.innerText =
        "Sala criada: " + roomId;

    document.getElementById("roomInput").value =
        roomId;
}

function joinRoom() {

    const roomId =
        document.getElementById("roomInput").value;

    currentRoom = roomId;

    socket.emit("joinRoom", roomId);

    statusDiv.innerText =
        "Entrando na sala...";
}

socket.on("gameStart", (data) => {

    characters = data.characters;

    document.getElementById("gameArea").style.display =
        "block";

    renderBoard();
});

function renderBoard(){

    const board =
        document.getElementById("board");

    board.innerHTML = "";

    characters.forEach(character => {

        const div =
            document.createElement("div");

        div.className = "card";

        div.innerHTML = `
            <b>ID ${character.id}</b><br>
            ${character.gender}<br>
            ${character.skin}<br>
            ${character.hair}<br>
            ${character.eyes}
        `;

        div.onclick = () => {
            div.classList.toggle("eliminated");
        };

        board.appendChild(div);
    });
}

function sendQuestion(){

    const question =
        document.getElementById("questionInput").value;

    socket.emit("askQuestion", {
        roomId: currentRoom,
        question
    });
}

socket.on("question", (data) => {

    const messages =
        document.getElementById("messages");

    messages.innerHTML +=
        `<p><b>Pergunta:</b> ${data.question}</p>`;
});