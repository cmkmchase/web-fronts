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

// Handle new websocket connections
wss.on("connection", (ws) => {
  console.log("Player connected");

  // Add player
  players.push(ws);

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
