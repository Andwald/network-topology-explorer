window.nodes = [];
window.edges = [];
window.randomParents = [];
window.randEdges = [];
window.topologyVersion = 0;
let topology = "ring";
let algorithm = "nearest";
let knnK = 3;               // Default k-Wert
let kSlider, kLabel;        // UI-Elemente
let animSpeed = 1;         // 1 = Normal, 0 = sofort
const BASE_DURATION = 10;  // Basisdauer in Frames
window.animation = {
  running: false,
  queue: [],
  current: null
};
let occupied = {};
const gridSize = 50;
// threshold = Anzahl Knoten pro Schritt in d für Chord Ring
window.chordThreshold = 6;

function initSpeedControl() {
  const slider = document.getElementById('speedRange');
  const maxV   = parseFloat(slider.max);
  slider.addEventListener('input', () => {
    const v = parseFloat(slider.value);
    // ganz rechts = maxV → sofort (animSpeed=0)
    if (Math.abs(v - maxV) < 1e-6) {
      animSpeed = 0;
    } else {
      animSpeed = v;   // alle anderen Positionen: 0.1…1.9 → proportional
    }
  });

  // Hier verhindern wir, dass Klicks/Touches auf dem Regler zum Canvas durchgereicht werden:
  const wrapper = document.getElementById('speed-control');
  ['mousedown', 'touchstart'].forEach(evt =>
    wrapper.addEventListener(evt, e => e.stopPropagation())
  );
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

  // 2) Snap-Koordinaten ermitteln (inkl. Grid-Slot key)
  const { x, y, occupiedKey } = snapNode(mouseX, mouseY);
  if (occupiedKey && occupied[occupiedKey]) return;  // Slot schon belegt
  if (occupiedKey) occupied[occupiedKey] = true;

  // 3) Node-Task in die Queue
  enqueueNodeTask(x, y);

  // 4) Topologien
  if (topology === "ring") {
    const newNode   = nodes[nodes.length - 1];
    const prevCount = nodes.length - 1; 
    if (prevCount > 1) {
      const prevLast = nodes[prevCount - 1];
      const first    = nodes[0];
      enqueueRemoveEdgeTask(prevLast, first);
      enqueueEdgeTask(prevLast, newNode);
      enqueueEdgeTask(newNode, first);
    } else if (prevCount === 1) {
      // wenn vorher nur ein Knoten da war, haben wir keine alte Abschlusskante,
      // sondern nur eine neue Kante zum Startknoten:
      const first = nodes[0];
      enqueueEdgeTask(first, newNode);
    }
    animation.running = true;
    loop();
    return;
  }
  if (topology === "star") {
    const newNode = nodes[nodes.length - 1];
    // Falls schon ein Hub existiert, knüpfen wir sofort eine Kante
    if (nodes.length > 0) {
      const hub = nodes[0];
      enqueueEdgeTask(hub, newNode);
    }
    animation.running = true;
    loop();
    return;
  }
  if (topology === "binary-tree") {
    const prevCount = nodes.length - 1;
    const newNode = nodes[prevCount];
    if (prevCount > 0) {
      const parentIdx = Math.floor((prevCount - 1) / 2);
      const parent    = nodes[parentIdx];
      enqueueEdgeTask(parent, newNode);
    }
    animation.running = true;
    loop();
    return;
  }
  if (topology === "random-tree") {
    const prevCount = nodes.length - 1;     // Knotenzahl vor dem neuen
    const newNode   = nodes[prevCount];     // das frisch gepushte Objekt

    if (prevCount > 0) {
      // Wähle Parent ausschließlich aus den alten prevCount Knoten
      const parentIdx = Math.floor(Math.random() * prevCount);
      const parent    = nodes[parentIdx];
      enqueueEdgeTask(parent, newNode);
      randomParents.push(parentIdx);
    } else {
      // erster Knoten hat keinen Parent
      randomParents.push(null);
    }

    animation.running = true;
    loop();
    return;
  }
  if (topology === "nnt") {
    // prevCount = Anzahl der Knoten vor dem neuen
    const prevCount = nodes.length - 1;
    // newNode ist das soeben in nodes gepushte Objekt
    const newNode   = nodes[prevCount];
    if (prevCount > 0) {
      let bestIdx  = 0;
      let bestDist = Infinity;
      // Suche unter den alten prevCount Knoten
      for (let j = 0; j < prevCount; j++) {
        const dx = newNode.x - nodes[j].x;
        const dy = newNode.y - nodes[j].y;
        const d  = Math.hypot(dx, dy);
        if (d < bestDist) {
          bestDist = d;
          bestIdx  = j;
        }
      }
      enqueueEdgeTask(nodes[bestIdx], newNode);
    }
    animation.running = true;
    loop();
    return;
  }
  if (topology === "complete") {
    // prevCount = Anzahl vor dem neuen
    const prevCount = nodes.length - 1;
    const newNode   = nodes[prevCount];
    // mit allen alten Knoten verbinden
    for (let j = 0; j < prevCount; j++) {
      enqueueEdgeTask(nodes[j], newNode);
    }
    animation.running = true;
    loop();
    return;
  }
  if (topology === "path") {
    // prevCount = Anzahl vor dem neuen
    const prevCount = nodes.length - 1;
    const newNode   = nodes[prevCount];
    if (prevCount > 0) {
      enqueueEdgeTask(nodes[prevCount - 1], newNode);
    }
    animation.running = true;
    loop();
    return;
  }
  if (topology === "emst") {
    // 1) prevCount = Knotenzahl vor neuem
    const prevCount = nodes.length - 1;
    // newNode ist in nodes[prevCount]
    const newNode = nodes[prevCount];

    // 2) alle alten Kanten entfernen
    edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
    // 3) MST über alle Knoten neu berechnen
    const mstEdges = computeEMSTEdges(nodes);
    mstEdges.forEach(e => enqueueEdgeTask(e.from, e.to));

    animation.running = true;
    loop();
    return;
  }
  if (topology === "delaunay") {
    // 1) alle alten Kanten entfernen
    edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
    // 2) alle Knoten (incl. neuem) triangulieren
    const delaunayEdges = computeDelaunayEdges(nodes);
    delaunayEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
    animation.running = true;
    loop();
    return;
  }
  if (topology === "gabriel") {
    // prevNodes = alle Knoten vor dem neuen
    const prevNodes = nodes.slice(0, nodes.length - 1);
    const newNode   = nodes[nodes.length - 1];
    // 1) Alte Kanten entfernen
    edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
    // 2) Gabriel global neu berechnen
    const gabrielEdges = computeGabrielEdges(nodes);
    // 3) enqueuen
    gabrielEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
    animation.running = true;
    loop();
    return;
  }
  if (topology === "rng") {
    // 1) alle alten Kanten entfernen
    edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
    // 2) RNG über alle Knoten neu berechnen
    const rngEdges = computeRNGEdges(nodes);
    rngEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
    animation.running = true;
    loop();
    return;
  }
  if (topology === "gg") {
    edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
    const r = 100;
    const ggEdges = computeGGEdges(nodes, r);
    ggEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
    animation.running = true;
    loop();
    return;
  }
  if (topology === "chordal-ring") {
      // Alle bestehenden Kanten schrumpfen lassen
    edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));

    // Neu: Ring + Chords komplett neu berechnen
    const allEdges = computeDynamicChordalRingEdges(nodes);
    allEdges.forEach(e => enqueueEdgeTask(e.from, e.to));

    animation.running = true;
    loop();
    return;
  }

  // 5) Fallback für alle anderen Topologien
  const newEdges = computeEdges(nodes, { x, y });
  newEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
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
