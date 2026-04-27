// Get UI elements
const statusText = document.getElementById("status");
const playersText = document.getElementById("players");

// Get canvas and drawing context
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Store canvas size in real pixels
let width = 0;
let height = 0;

// Resize canvas to match the browser window
function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;

  canvas.width = width;
  canvas.height = height;
}

// Run once at startup
resizeCanvas();

// Run again whenever the window changes size
window.addEventListener("resize", resizeCanvas);

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

// Temporary province centers
// These are not real Voronoi provinces yet.
// This is the first visual test.
const provinces = [
  { x: 300, y: 220, owner: "blue" },
  { x: 420, y: 260, owner: "blue" },
  { x: 540, y: 300, owner: "neutral" },
  { x: 660, y: 340, owner: "red" },
  { x: 780, y: 380, owner: "red" },
];

// Pick color based on owner
function getProvinceColor(owner) {
  if (owner === "blue") return "#496dff";
  if (owner === "red") return "#d94b4b";

  return "#777";
}

// Main draw loop
function draw() {
  // Clear the whole screen
  ctx.clearRect(0, 0, width, height);

  // Background
  ctx.fillStyle = "#202020";
  ctx.fillRect(0, 0, width, height);

  // Draw temporary province circles
  provinces.forEach((province) => {
    ctx.beginPath();
    ctx.arc(province.x, province.y, 40, 0, Math.PI * 2);

    ctx.fillStyle = getProvinceColor(province.owner);
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
  });

  // Keep drawing forever
  requestAnimationFrame(draw);
}

// Start drawing
draw();