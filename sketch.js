let nodes = [];
let uiHeight = 80;
let topology = "ring";

function setup() {
  createCanvas(windowWidth, windowHeight);
  textSize(14);

  // Dropdown für Topologiewahl
  let sel = createSelect();
  sel.position(20, 20);
  sel.option("Ring");
  sel.selected("Ring");
  sel.changed(() => {
    topology = sel.value().toLowerCase();
    nodes = []; // zurücksetzen
  });

  // Titel
  let title = createElement('h2', 'Network Topology Explorer');
  title.position(160, 5);
}

function draw() {
  background(240);

  // Linien je nach Topologie
  if (topology === "ring") {
    drawRingTopology();
  }

  // Knoten zeichnen
  for (let n of nodes) {
    fill(100, 150, 255);
    stroke(0);
    ellipse(n.x, n.y, 20, 20);
  }

  // Hinweistext
  noStroke();
  fill(0);
  text("Klick im unteren Bereich, um Knoten hinzuzufügen.", 20, uiHeight + 20);
}

function mousePressed() {
  // Nur reagieren, wenn unterhalb des UI-Bereichs geklickt wurde
  if (mouseY > uiHeight) {
    nodes.push({ x: mouseX, y: mouseY });
  }
}

function drawRingTopology() {
  stroke(100);
  noFill();
  for (let i = 1; i < nodes.length; i++) {
    line(nodes[i - 1].x, nodes[i - 1].y, nodes[i].x, nodes[i].y);
  }
  // Ring schließen, wenn mehr als 2 Knoten
  if (nodes.length > 2) {
    line(
      nodes[nodes.length - 1].x,
      nodes[nodes.length - 1].y,
      nodes[0].x,
      nodes[0].y
    );
  }
}
