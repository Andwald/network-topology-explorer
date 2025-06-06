let nodes = [];
let randomParents = [];
let topology = "ring";
let algorithm = "nearest";

function setup() {
  // 1. Zuerst das UI aufbauen
  setupUI();

  // 2. Danach die Maße des Canvas-Containers abfragen
  const container = document.getElementById("canvas-container");
  const w = container.offsetWidth;
  const h = container.offsetHeight;

  // 3. Canvas mit genau dieser Breite/Höhe erstellen
  const canvas = createCanvas(w, h);
  canvas.parent("canvas-container");
}

function draw() {
  background(240);
  drawHint();
  drawTopology(topology);
  drawNodes();
}

function mousePressed() {
  // Prüfen, ob der Klick wirklich IN das Canvas gefallen ist:
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    addNode(mouseX, mouseY);
  }
}

function windowResized() {
  // Wenn das Fenster (oder UI) sich verändert, Canvas neu skalieren
  const container = document.getElementById("canvas-container");
  const w = container.offsetWidth;
  const h = container.offsetHeight;
  resizeCanvas(w, h);
}
