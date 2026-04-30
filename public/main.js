// Get UI elements
const statusText = document.getElementById("status");
const playersText = document.getElementById("players");

// Get canvas and drawing context
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Store canvas size in real pixels
let width = 0;
let height = 0;

// Server map size
let mapWidth = 1400;
let mapHeight = 800;

// Game map data
let provinces = [];

// Track selected province
let selectedProvince = null;

// Resize canvas to match browser window
function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;

  canvas.width = width;
  canvas.height = height;
}

// Build Voronoi polygons from server-owned province centers
function buildVoronoiFromServerMap() {
  const points = provinces.map((province) => [
    province.center.x,
    province.center.y,
  ]);

  // Create Delaunay triangulation from server points
  const delaunay = d3.Delaunay.from(points);

  // Convert Delaunay triangulation into Voronoi cells
  const voronoi = delaunay.voronoi([0, 0, mapWidth, mapHeight]);

  // Add polygon data to each province
  provinces.forEach((province, index) => {
    province.polygon = voronoi.cellPolygon(index);
  });
}

// Pick color based on owner
function getProvinceColor(owner) {
  if (owner === "blue") return "#496dff";
  if (owner === "red") return "#d94b4b";

  return "#777";
}

// Check if a point is inside a polygon
function pointInPolygon(x, y, polygon) {
  let inside = false;

  // Ray-casting algorithm
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

// Convert browser/canvas coordinates into map coordinates
function screenToMap(screenX, screenY) {
  return {
    x: screenX,
    y: screenY,
  };
}

// Handle province clicks
canvas.addEventListener("click", (event) => {
  // Get canvas position on screen
  const rect = canvas.getBoundingClientRect();

  // Convert browser click position into canvas position
  const screenX = event.clientX - rect.left;
  const screenY = event.clientY - rect.top;

  // Convert canvas position into map position
  const mouse = screenToMap(screenX, screenY);

  // Find clicked province by checking polygons
  selectedProvince =
    provinces.find((province) =>
      province.polygon && pointInPolygon(mouse.x, mouse.y, province.polygon)
    ) || null;
});

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

  // Receive shared map from server
  if (data.type === "map_state") {
    mapWidth = data.mapWidth;
    mapHeight = data.mapHeight;
    provinces = data.provinces;

    buildVoronoiFromServerMap();
  }
});

// Disconnected
socket.addEventListener("close", () => {
  statusText.textContent = "Disconnected";
});

// Draw one province polygon
function drawProvince(province) {
  if (!province.polygon) return;

  ctx.beginPath();

  province.polygon.forEach((point, index) => {
    const x = point[0];
    const y = point[1];

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.closePath();

  ctx.fillStyle = getProvinceColor(province.owner);
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "#eeeeee";
  ctx.stroke();

  // Selected province outline
  if (province === selectedProvince) {
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#ffd84d";
    ctx.stroke();
  }
}

// Main draw loop
function draw() {
  // Clear screen
  ctx.clearRect(0, 0, width, height);

  // Background
  ctx.fillStyle = "#202020";
  ctx.fillRect(0, 0, width, height);

  // Draw all provinces
  provinces.forEach(drawProvince);

  // Keep drawing forever
  requestAnimationFrame(draw);
}

// Run startup setup
resizeCanvas();
draw();

// Resize canvas without changing the generated map
window.addEventListener("resize", resizeCanvas);