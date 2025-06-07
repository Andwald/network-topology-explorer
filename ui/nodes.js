const MAX_RANDOM_NODES = 100;     
const MIN_DIST = 30;     

function drawNodes() {
  for (let i = 0; i < nodes.length; i++) {
    let n = nodes[i];
    const isStarCenter = (topology === "star" && i === 0);
    fill(isStarCenter ? "#FFD700" : (n.color ?? "#6495ED"));
    stroke(0);
    ellipse(n.x, n.y, 20, 20);

    if (n.label) {
      noStroke();
      fill(0);
      textAlign(CENTER, CENTER);
      text(n.label, n.x, n.y);
    }
  }
}

function placeRandomNode() {
  if (topology === "grid") {
    // 1) Erlaubten Bereich (Slots) wachsen lassen
    const count = nodes.length;
    const frac = constrain(0.25 + 0.75 * (count / MAX_RANDOM_NODES), 0.25, 1);
    const maxGX = floor((width * frac) / gridSize);
    const maxGY = floor((height * frac) / gridSize);

    // 2) Zufälligen, freien Slot finden
    let gx, gy, key, attempts = 0;
    do {
      gx = floor(random(0, maxGX + 1));
      gy = floor(random(0, maxGY + 1));
      key = `${gx},${gy}`;
      attempts++;
    } while (occupied[key] && attempts < 100);

    if (attempts >= 100) {
      console.warn("Kein freier Grid-Slot gefunden nach 100 Versuchen.");
    } else {
      // 3) Slot belegen und Knoten an Slot-Koordinaten legen
      occupied[key] = true;
      nodes.push({
        gx, gy,
        x: gx * gridSize,
        y: gy * gridSize
      });
    }

  } else {
    // Continuous „Place Random Node“ (wie vorher)
    const count = nodes.length;
    const frac = constrain(0.25 + 0.75 * (count / MAX_RANDOM_NODES), 0.25, 1);
    const regionW = width * frac;
    const regionH = height * frac;

    let x, y, ok = false, attempts = 0;
    while (!ok && attempts < 100) {
      x = random(regionW);
      y = random(regionH);
      ok = nodes.every(n => dist(n.x, n.y, x, y) >= MIN_DIST);
      attempts++;
    }
    if (!ok) {
      console.warn("Kein freier Punkt gefunden nach 100 Versuchen.");
    }
    nodes.push({ x, y });
  }

  // immer neu zeichnen
  redraw();
}

function addNode(x, y) {
  nodes.push({ x, y });
  if (topology === "random tree" && nodes.length > 1) {
    const parentIndex = Math.floor(Math.random() * (nodes.length - 1));
    randomParents.push(parentIndex);
  } else {
    randomParents.push(null);
  }
}
