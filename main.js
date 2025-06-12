window.nodes = [];
window.edges = [];
window.randomParents = [];
window.randEdges = [];
window.topologyVersion = 0;
window.knnK = 3;
window.gridSize = 50; // Grid Graph: Zellgröße in Pixeln (Default)
let topology = "ring";
let algorithm = "nearest";
let kSlider, kLabel;        // UI-Elemente
let animSpeed = 1;         // 1 = Normal, 0 = sofort
const BASE_DURATION = 10;  // Basisdauer in Frames
window.animation = {
  running: false,
  queue: [],
  current: null
};
let occupied = {};
// threshold = Anzahl Knoten pro Schritt in d für Chord Ring
window.chordThreshold = 6;
window.ggThreshold = 100;         // Default für Geometric Graph

/**
 * Rundet eine (x,y)-Position auf den nächsten Grid-Slot.
 * @param {number} x Pixel-X
 * @param {number} y Pixel-Y
 * @returns {{x:number,y:number,key:string}} Genauer Slot + eindeutiger Key
 */
function snapToGrid(x, y) {
  const col = Math.round(x / window.gridSize);
  const row = Math.round(y / window.gridSize);
  return {
    x:   col * window.gridSize,
    y:   row * window.gridSize,
    key: `${col},${row}`
  };
}

/**
 * Zeichnet ein einfaches Linien-Raster alle gridSize Pixel.
 */
function drawGridOverlay() {
  stroke(255, 255, 255, 50); // weiß mit 20% Deckkraft
  strokeWeight(1);
  for (let gx = 0; gx <= width; gx += window.gridSize) {
    line(gx, 0, gx, height);
  }
  for (let gy = 0; gy <= height; gy += window.gridSize) {
    line(0, gy, width, gy);
  }
}

/**
 * Setzt alle vorhandenen Knoten auf ihre
 * jeweiligen Grid-Slots zurück und leert das occupied-Map.
 */
function updateGridNodePositions() {
  occupied = {};  // globale Map: slotKey → true
  for (let n of nodes) {
    const { x, y, key } = snapToGrid(n.x, n.y);
    // Wenn Slot noch frei: aktualisiere Position
    if (!occupied[key]) {
      n.x = x;
      n.y = y;
      occupied[key] = true;
    } else {
      // Kollision: wir lassen’s hier einfach überlappen
      // (könntest hier noch Nachbarsuche implementieren)
      n.x = x;
      n.y = y;
    }
  }
}


function updateBottomControls() {
  const panel = document.getElementById('bottom-controls');
  if (!panel) return;
  panel.innerHTML = '';

  if (topology === 'chordal-ring') {
    panel.style.display = 'block';
    panel.innerHTML = `
      <label for="chordThreshold">Max Hops:</label>
      <input
        type="range"
        id="chordThreshold"
        min="2"
        max="50"
        step="1"
        value="${window.chordThreshold}"
      >
      <span id="chordThresholdVal">${window.chordThreshold}</span>
    `;
    const s = document.getElementById('chordThreshold');
    const v = document.getElementById('chordThresholdVal');

    // live nur die Anzeige updaten
    s.addEventListener('input', e => {
      v.textContent = e.target.value;
    });

    // erst beim Loslassen: Version erhöhen, Wert speichern, redraw
    s.addEventListener('change', e => {
      window.topologyVersion++;
      window.chordThreshold = +e.target.value;
      updateTopologyEdges();
      redraw(); 
    });

  }else if (topology === 'gg') {
    panel.style.display = 'block';
    panel.innerHTML = `
      <label for="ggThreshold">Threshold r:</label>
      <input
        type="range"
        id="ggThreshold"
        min="10"
        max="1000"
        step="10"
        value="${window.ggThreshold}"
      >
      <span id="ggThresholdVal">${window.ggThreshold}</span>
    `;

    // HIER kommen die Listener:
    const s = document.getElementById('ggThreshold');
    const v = document.getElementById('ggThresholdVal');

    // live den Wert anzeigen
    s.addEventListener('input', e => {
      v.textContent = e.target.value;
    });

    // beim Loslassen: Version bump, neuen Graph zeichnen
    s.addEventListener('change', e => {
      window.topologyVersion++;
      window.ggThreshold = +e.target.value;
      updateTopologyEdges();
    });

  } else if (topology === 'knn') {
    panel.style.display = 'block';
    panel.innerHTML = `
      <label for="knnK">k (Nachbarn):</label>
      <input
        type="range"
        id="knnK"
        min="1"
        max="10"
        step="1"
        value="${window.knnK}"
      >
      <span id="knnKVal">${window.knnK}</span>
    `;
    const s = document.getElementById('knnK');
    const v = document.getElementById('knnKVal');
    s.addEventListener('input', e => v.textContent = e.target.value);
    s.addEventListener('change', e => {
      window.topologyVersion++;
      window.knnK = +e.target.value;
      updateTopologyEdges();
    });
  } else if (topology === 'grid') {
    panel.style.display = 'block';
    panel.innerHTML = `
      <label for="gridSize">Grid-Zelle (px):</label>
      <input
        type="range"
        id="gridSize"
        min="10"
        max="200"
        step="5"
        value="${window.gridSize}"
      >
      <span id="gridSizeVal">${window.gridSize}</span>
    `;
    const slider = document.getElementById('gridSize');
    const display = document.getElementById('gridSizeVal');

    // live nur die Anzeige anpassen
    slider.addEventListener('input', e => {
      display.textContent = e.target.value;
    });

    // beim Loslassen: version bump, Wert speichern, Neuaufbau
    slider.addEventListener('change', e => {
      window.topologyVersion++;          // alte Animations-Tasks ignorieren
      window.gridSize = +e.target.value;
      updateGridNodePositions();         // (wird in Schritt 3 kommen)
      updateTopologyEdges();             // bestehende Edges removen + neu aufbauen
    });
  }else {
    panel.style.display = 'none';
  }
}


function initSpeedControl() {
  const slider = document.getElementById('speedRange');
  const maxV   = parseFloat(slider.max);
  slider.addEventListener('input', () => {
    const v = parseFloat(slider.value);
    animSpeed = (Math.abs(v - maxV) < 1e-6) ? 0 : v;
  });

  // Abfangen auf beiden Panels: Speed + Bottom
  ['speed-control','bottom-controls'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    ['mousedown','touchstart'].forEach(evt =>
      el.addEventListener(evt, e => e.stopPropagation())
    );
  });
}

// Hier die neuen Task-Generatoren einfügen:
function enqueueNodeTask(x, y) {
  const dur = animSpeed > 0
    ? Math.max(1, Math.round(BASE_DURATION / animSpeed))
    : 1;
  // 1) Erstelle das Task-Objekt
  const task = {
    type:     "node",
    node:     { x, y },
    progress: 0,
    duration: dur
  };
  // 2) Sofort logischen Knoten hinzufügen,
  //    damit alle Folge-Logiken (Ring/Star/...) ihn sehen
  nodes.push({ x, y });
  // 3) Dann Task in die Animation-Queue
  animation.queue.push(task);
}


function enqueueEdgeTask(from, to) {
  const dur = animSpeed > 0
    ? Math.max(1, Math.round(BASE_DURATION / animSpeed))
    : 1;
  animation.queue.push({
    type: "edge",
    from, to,
    progress: 0,
    duration: dur,
    version:  window.topologyVersion
  });
}

// Entfernt eine Kante (shrink-to-0)
function enqueueRemoveEdgeTask(from, to) {
  const dur = animSpeed > 0
    ? Math.max(1, Math.round(BASE_DURATION / animSpeed))
    : 1;
  animation.queue.push({
    type: "remove-edge",
    from, to,
    progress: 0,
    duration: dur,
    version:  window.topologyVersion
  });
}

function setup() {
  setupUI();
  initSpeedControl();
  updateBottomControls(); 

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
  if (topology === 'grid') {
    drawGridOverlay();
  }
  drawHint();

  // 1) Erst alles, was schon komplett „fertig“ animiert ist
  drawTopologyStatic();
  drawNodes();       // nutzt nur das nodes[]-Array

  // 2) Dann, falls noch Animationstasks offen sind:
  if (animation.running) {
    animateStep();
  }
}

function animateStep() {
  // Aktuellen Task holen (oder den nächsten aus der Queue)
  let task = animation.current || animation.queue.shift();
  if (!task) {
    // Queue leer → Animation vorbei
    animation.running = false;
    noLoop();
    return;
  }
  animation.current = task;
  task.progress++;
  const t = task.progress / task.duration;

  if (task.type === "node") {
    // Beispiel: aufskalierender Kreis
    push();
      translate(task.node.x, task.node.y);
      const r = lerp(0, 10, t);
      noStroke();
      fill("#6495ED");
      ellipse(0, 0, r*2);
    pop();
    if (t >= 1) {
      animation.current = null;
    }

  } else if (task.type === "edge") {
    // Linie von from → interpolierten Punkt
    const ix = lerp(task.from.x, task.to.x, t);
    const iy = lerp(task.from.y, task.to.y, t);
    stroke(100);
    line(task.from.x, task.from.y, ix, iy);
    if (t >= 1) {
      if (task.version === window.topologyVersion) {
        edges.push({ from: task.from, to: task.to });
      }
      animation.current = null;
    }
  } else if (task.type === "remove-edge") {
    const t = task.progress / task.duration;
    const ix = lerp(task.from.x, task.to.x, t);
    const iy = lerp(task.from.y, task.to.y, t);

    // Zeichne shrink-in-BG-Farbe
    push();
      stroke(240);
      strokeWeight(2);
      line(task.from.x, task.from.y, ix, iy);
    pop();

    if (task.progress >= task.duration) {
      // erst hier die statische Kante endgültig entfernen:
      if (task.version === window.topologyVersion) {
        edges = edges.filter(e =>
          !(e.from.x === task.from.x &&
          e.from.y === task.from.y &&
          e.to.x   === task.to.x &&
          e.to.y   === task.to.y)
        );
      }
      // Reset Styling & Task
      strokeWeight(1);
      animation.current = null;
    }
  }
}

function drawTopologyStatic() {
  // 1) alle fertig-animierten Kanten zeichnen
  stroke(100);
  for (let e of edges) {
    line(e.from.x, e.from.y, e.to.x, e.to.y);
  }
  // 2) die Nodes zeichnet drawNodes()
}

function mousePressed() {
  // 1) Klick nur im Canvas
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;

  // Ring
  if (topology === "ring") {
    const { x, y } = snapNode(mouseX, mouseY);
    enqueueNodeTask(x, y);
    const newNode   = nodes[nodes.length - 1];
    const prevCount = nodes.length - 1;
    if (prevCount > 1) {
      const prevLast = nodes[prevCount - 1];
      const first    = nodes[0];
      enqueueRemoveEdgeTask(prevLast, first);
      enqueueEdgeTask(prevLast, newNode);
      enqueueEdgeTask(newNode, first);
    } else if (prevCount === 1) {
      enqueueEdgeTask(nodes[0], newNode);
    }
    animation.running = true;
    loop();
    return;
  }

  // Star
  if (topology === "star") {
    const { x, y } = snapNode(mouseX, mouseY);
    enqueueNodeTask(x, y);
    const newNode = nodes[nodes.length - 1];
    if (nodes.length > 1) {
      const hub = nodes[0];
      enqueueEdgeTask(hub, newNode);
    }
    animation.running = true;
    loop();
    return;
  }

  // Binary Tree
  if (topology === "binary-tree") {
    const { x, y } = snapNode(mouseX, mouseY);
    enqueueNodeTask(x, y);
    const prevCount = nodes.length - 1;
    if (prevCount > 0) {
      const parentIdx = Math.floor((prevCount - 1) / 2);
      enqueueEdgeTask(nodes[parentIdx], nodes[prevCount]);
    }
    animation.running = true;
    loop();
    return;
  }

  // Random Tree
  if (topology === "random-tree") {
    const { x, y } = snapNode(mouseX, mouseY);
    enqueueNodeTask(x, y);
    const prevCount = nodes.length - 1;
    if (prevCount > 0) {
      const parentIdx = Math.floor(Math.random() * prevCount);
      enqueueEdgeTask(nodes[parentIdx], nodes[prevCount]);
      randomParents.push(parentIdx);
    } else {
      randomParents.push(null);
    }
    animation.running = true;
    loop();
    return;
  }

  // Nearest Neighbor Tree (nnt)
  if (topology === "nnt") {
    const { x, y } = snapNode(mouseX, mouseY);
    enqueueNodeTask(x, y);
    const prevCount = nodes.length - 1;
    if (prevCount > 0) {
      let bestIdx = 0, bestDist = Infinity;
      for (let j = 0; j < prevCount; j++) {
        const dx = x - nodes[j].x, dy = y - nodes[j].y, d = Math.hypot(dx, dy);
        if (d < bestDist) { bestDist = d; bestIdx = j; }
      }
      enqueueEdgeTask(nodes[bestIdx], nodes[prevCount]);
    }
    animation.running = true;
    loop();
    return;
  }

  // Complete Graph
  if (topology === "complete") {
    const { x, y } = snapNode(mouseX, mouseY);
    enqueueNodeTask(x, y);
    const prevCount = nodes.length - 1;
    for (let j = 0; j < prevCount; j++) {
      enqueueEdgeTask(nodes[j], nodes[prevCount]);
    }
    animation.running = true;
    loop();
    return;
  }

  // Path
  if (topology === "path") {
    const { x, y } = snapNode(mouseX, mouseY);
    enqueueNodeTask(x, y);
    const prevCount = nodes.length - 1;
    if (prevCount > 0) {
      enqueueEdgeTask(nodes[prevCount - 1], nodes[prevCount]);
    }
    animation.running = true;
    loop();
    return;
  }

  // EMST
  if (topology === "emst") {
    const { x, y } = snapNode(mouseX, mouseY);
    enqueueNodeTask(x, y);
    edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
    computeEMSTEdges(nodes).forEach(e => enqueueEdgeTask(e.from, e.to));
    animation.running = true;
    loop();
    return;
  }

  // Delaunay
  if (topology === "delaunay") {
    const { x, y } = snapNode(mouseX, mouseY);
    enqueueNodeTask(x, y);
    edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
    computeDelaunayEdges(nodes).forEach(e => enqueueEdgeTask(e.from, e.to));
    animation.running = true;
    loop();
    return;
  }

  // Gabriel
  if (topology === "gabriel") {
    const { x, y } = snapNode(mouseX, mouseY);
    enqueueNodeTask(x, y);
    edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
    computeGabrielEdges(nodes).forEach(e => enqueueEdgeTask(e.from, e.to));
    animation.running = true;
    loop();
    return;
  }

  // RNG
  if (topology === "rng") {
    const { x, y } = snapNode(mouseX, mouseY);
    enqueueNodeTask(x, y);
    edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
    computeRNGEdges(nodes).forEach(e => enqueueEdgeTask(e.from, e.to));
    animation.running = true;
    loop();
    return;
  }

  // Geometric Graph (gg)
  if (topology === "gg") {
    const { x, y } = snapNode(mouseX, mouseY);
    enqueueNodeTask(x, y);
    edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
    computeGGEdges(nodes, window.ggThreshold)
      .forEach(e => enqueueEdgeTask(e.from, e.to));
    animation.running = true;
    loop();
    return;
  }

  // Chordal Ring
  if (topology === "chordal-ring") {
    const { x, y } = snapNode(mouseX, mouseY);
    enqueueNodeTask(x, y);
    edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
    computeDynamicChordalRingEdges(nodes)
      .forEach(e => enqueueEdgeTask(e.from, e.to));
    animation.running = true;
    loop();
    return;
  }

  // k-NN Graph
  if (topology === "knn") {
    const { x, y } = snapNode(mouseX, mouseY);
    enqueueNodeTask(x, y);
    edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
    computeKNNEdges(nodes, window.knnK)
      .forEach(e => enqueueEdgeTask(e.from, e.to));
    animation.running = true;
    loop();
    return;
  }

  // Grid Graph
  if (topology === "grid") {
    const { x: sx, y: sy, key } = snapToGrid(mouseX, mouseY);
    if (occupied[key]) return;          // schon belegt
    occupied[key] = true;

    enqueueNodeTask(sx, sy);
    // alte Kanten wegrashen
    edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
    // neue Grid-Kanten aufbauen
    const gridEdges = computeGridEdges(nodes, window.gridSize);
    gridEdges.forEach(e => enqueueEdgeTask(e.from, e.to));

    animation.running = true;
    loop();
    return;
  }

  // ––––– Fallback (falls du mal was vergisst) –––––
  const { x, y } = snapNode(mouseX, mouseY);
  enqueueNodeTask(x, y);
  computeEdges(nodes, { x, y })
    .forEach(e => enqueueEdgeTask(e.from, e.to));
  animation.running = true;
  loop();
}


function windowResized() {
  // Wenn das Fenster (oder UI) sich verändert, Canvas neu skalieren
  const container = document.getElementById("canvas-container");
  const w = container.offsetWidth;
  const h = container.offsetHeight;
  resizeCanvas(w, h);
}
