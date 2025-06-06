let nodes = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  textSize(14);
}

function draw() {
  background(240);

  // Linien
  for (let i = 1; i < nodes.length; i++) {
    line(nodes[i - 1].x, nodes[i - 1].y, nodes[i].x, nodes[i].y);
  }

  // Knoten
  for (let n of nodes) {
    fill(100, 150, 255);
    ellipse(n.x, n.y, 20, 20);
  }

  fill(0);
  text("Klick zum Hinzufügen von Knoten (Ring-Topologie)", 20, 30);
}

function mousePressed() {
  nodes.push({ x: mouseX, y: mouseY });
}
