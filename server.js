// Import required libraries
const express = require("express");
const http = require("http");
const WebSocket = require("ws");

// Create express app
const app = express();

// Serve files from /public
app.use(express.static("public"));

// Create HTTP server
const server = http.createServer(app);

// Attach websocket server to HTTP server
const wss = new WebSocket.Server({ server });

// Store connected players
const players = [];

// Server-owned map state
const MAP_WIDTH = 1400;
const MAP_HEIGHT = 800;
const PROVINCE_COUNT = 180;

// Generate random province centers once when the server starts
const provinces = generateMap();

// Build one shared map on the server
function generateMap() {
  const generatedProvinces = [];

  const mapPadding = 80;
  const leftOffset = 260;

  for (let i = 0; i < PROVINCE_COUNT; i++) {
    const x =
      leftOffset + Math.random() * (MAP_WIDTH - leftOffset - mapPadding);

    const y =
      mapPadding + Math.random() * (MAP_HEIGHT - mapPadding * 2);

    generatedProvinces.push({
      id: i,
      center: { x, y },
      owner: getStartingOwner(x),
      terrain: "plains",
    });
  }

  return generatedProvinces;
}

// Assign test ownership based on map position
function getStartingOwner(x) {
  if (x < MAP_WIDTH * 0.45) return "blue";
  if (x > MAP_WIDTH * 0.65) return "red";

  return "neutral";
}

// Handle new websocket connections
wss.on("connection", (ws) => {
  console.log("Player connected");

  // Add player
  players.push(ws);

  // Send the shared map to this client
  ws.send(JSON.stringify({
    type: "map_state",
    mapWidth: MAP_WIDTH,
    mapHeight: MAP_HEIGHT,
    provinces,
  }));

  // Send player count to everyone
  broadcast({
    type: "player_count",
    count: players.length,
  });

  // Handle messages from client
  ws.on("message", (message) => {
    console.log("Received:", message.toString());
  });

  // Handle disconnect
  ws.on("close", () => {
    console.log("Player disconnected");

    // Remove disconnected player
    const index = players.indexOf(ws);

    if (index !== -1) {
      players.splice(index, 1);
    }

    // Update everyone
    broadcast({
      type: "player_count",
      count: players.length,
    });
  });
});

// Broadcast helper
function broadcast(data) {
  const json = JSON.stringify(data);

  players.forEach((player) => {
    if (player.readyState === WebSocket.OPEN) {
      player.send(json);
    }
  });
}

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});