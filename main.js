window.nodes = [];
window.randomParents = [];
window.randEdges = [];
let topology = "ring";
let algorithm = "nearest";
let knnK = 3;               // Default k-Wert
let kSlider, kLabel;        // UI-Elemente

function setup() {
  setupUI();

  const container = document.getElementById("canvas-container");
  const w = container.offsetWidth;
  const h = container.offsetHeight;

  // 1) Canvas erzeugen und in den Container packen
  const cvs = createCanvas(w, h);
  cvs.parent("canvas-container");

  // 2) Nur auf redraw warten
  noLoop();

  // 3) Einmal initial zeichnen
  redraw();
}

function draw() {
  background(240);
  drawHint();
  drawTopology(topology);
  drawNodes();
}

function mousePressed() {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;

  if (topology === "grid") {
    // 1) Auf Slot runden
    const gx = Math.round(mouseX / gridSize);
    const gy = Math.round(mouseY / gridSize);
    const key = `${gx},${gy}`;

    // 2) Nur wenn noch frei
    if (!occupied[key]) {
      occupied[key] = true;
      // x/y genau am Slot-Mittelpunkt speichern
      nodes.push({
        gx, gy,
        x: gx * gridSize,
        y: gy * gridSize
      });
    }
  } else {
    addNode(mouseX, mouseY);
  }

  redraw();
}



function windowResized() {
  // Wenn das Fenster (oder UI) sich verändert, Canvas neu skalieren
  const container = document.getElementById("canvas-container");
  const w = container.offsetWidth;
  const h = container.offsetHeight;
  resizeCanvas(w, h);
}

function onCanvasClick() {
  addNode(mouseX, mouseY);  // fügt Node + ggf. neue Edges hinzu
  drawGraph();              // und zeichnet den Graph neu
}
window.onCanvasClick = onCanvasClick; // falls erforderlich