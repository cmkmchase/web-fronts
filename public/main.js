// Get UI elements
const statusText = document.getElementById("status");
const playersText = document.getElementById("players");

// Get canvas and drawing context
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Store canvas size in real pixels
let width = 0;
let height = 0;

// Game map data
let provinces = [];

// Track selected province
let selectedProvince = null;

// Number of provinces to generate
const PROVINCE_COUNT = 180;

// Resize canvas to match browser window
function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;

  canvas.width = width;
  canvas.height = height;

  generateMap();
}

// Generate random Voronoi province map
function generateMap() {
  provinces = [];

  // Leave room for UI on the left
  const mapPadding = 80;
  const leftOffset = 260;

  // Generate random province center points
  const points = [];

  for (let i = 0; i < PROVINCE_COUNT; i++) {
    points.push([
      leftOffset + Math.random() * (width - leftOffset - mapPadding),
      mapPadding + Math.random() * (height - mapPadding * 2),
    ]);
  }

  // Create Delaunay triangulation from points
  const delaunay = d3.Delaunay.from(points);

  // Convert Delaunay triangulation into Voronoi cells
  const voronoi = delaunay.voronoi([
    leftOffset,
    mapPadding,
    width - mapPadding,
    height - mapPadding,
  ]);

  // Convert each Voronoi cell into a province object
  for (let i = 0; i < points.length; i++) {
    const polygon = voronoi.cellPolygon(i);

    // Skip broken cells
    if (!polygon) continue;

    provinces.push({
      id: i,
      center: {
        x: points[i][0],
        y: points[i][1],
      },
      polygon,

      // Temporary ownership for testing
      owner: getStartingOwner(points[i][0]),

      // Terrain comes later
      terrain: "plains",
    });
  }
}

// Assign test ownership based on map position
function getStartingOwner(x) {
  if (x < width * 0.45) return "blue";
  if (x > width * 0.65) return "red";

  return "neutral";
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

// Handle province clicks
canvas.addEventListener("click", (event) => {
  // Get canvas position on screen
  const rect = canvas.getBoundingClientRect();

  // Convert browser click position into canvas position
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  // Find clicked province by checking polygons
  selectedProvince = provinces.find((province) =>
    pointInPolygon(mouseX, mouseY, province.polygon)
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
});

// Disconnected
socket.addEventListener("close", () => {
  statusText.textContent = "Disconnected";
});

// Draw one province polygon
function drawProvince(province) {
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

// Regenerate map when window changes size
window.addEventListener("resize", resizeCanvas);