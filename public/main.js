// Get UI elements
const statusText = document.getElementById("status");
const playersText = document.getElementById("players");

// Connect to websocket server
const socket = new WebSocket(
  `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`
);

// Connected
socket.addEventListener("open", () => {
  statusText.textContent = "Connected";
});

// Receive server messages
socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);

  // Update player count
  if (data.type === "player_count") {
    playersText.textContent = `Players: ${data.count}`;
  }
});

// Disconnected
socket.addEventListener("close", () => {
  statusText.textContent = "Disconnected";
});