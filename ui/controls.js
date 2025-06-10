let topologySel, algorithmSel;
let fileInput; 

function setupUI() {
  const ui = select("#ui");
  ui.html("");
  ui.style("display", "grid");
  ui.style("grid-template-columns", "repeat(auto-fit, minmax(120px, auto))");
  ui.style("gap", "10px");
  ui.style("padding", "10px");
  ui.style("background", "#e0e0e0");

  const speedLabel = createSpan(`Animationspeed: ${animSpeed.toFixed(2)}`);
  speedLabel.parent(ui);
  speedLabel.style("margin-right", "4px");

  const speedSlider = createSlider(0, 2, animSpeed, 0.01);
  speedSlider.parent(ui);
  speedSlider.input(() => {
    animSpeed = speedSlider.value();
    speedLabel.html(`Speed: ${animSpeed.toFixed(2)}`);
  });

  // 1) Titel
  const title = createElement("h2", "Network Topology Explorer");
  title.parent(ui);
  title.style("grid-column", "1 / -1");

  // 2) k-NN Slider & Label (standardmäßig versteckt)
  kLabel = createSpan(`k = ${knnK}`);
  kLabel.parent(ui);
  kLabel.hide();

  kSlider = createSlider(1, 10, knnK, 1);
  kSlider.parent(ui);
  kSlider.hide();

  // Slider-Event: k anpassen und ggf. neu zeichnen
  kSlider.input(() => {
    knnK = kSlider.value();
    kLabel.html(`k = ${knnK}`);
    if (topology === "k-nn graph") redraw();
  });

  // 3) Topology-Select
  topologySel = createSelect();
  ["Ring", "Path", "Star", "Binary Tree", "Random Tree", "NNT", "Complete", "EMST", "Delaunay", "Gabriel", "RNG", "GG", "Chordal Ring"]
    .forEach(opt => topologySel.option(opt));
  topologySel.selected("Ring");
  topologySel.changed(() => {
    const newTopo = topologySel.value().toLowerCase();
    // 1) internen Zustand setzen + Info-Box updaten
    topology = newTopo;
    showTopologyInfo(topology);

    // 2) Alle bestehenden Kanten animiert entfernen
    edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));

    // 3) Nach Ende des Shrink-Animationszyklus neue Kanten enqueue’n
    //    (einfachheitshalber direkt hintereinander – sie kommen ja in die Queue)
    if (topology === "ring") {
      if (nodes.length > 1) {
        for (let i = 0; i < nodes.length; i++) {
          const from = nodes[i];
          const to   = nodes[(i + 1) % nodes.length];
          enqueueEdgeTask(from, to);
        }
      }
    } else if (topology === "star") {
      if (nodes.length > 1) {
        const hub = nodes[0];
        nodes.slice(1)
            .forEach(n => enqueueEdgeTask(hub, n));
      }
    } else if (topology === "binary tree") {
      // Für jeden Knoten i>0: Parent = floor((i–1)/2)
      for (let i = 1; i < nodes.length; i++) {
        const parentIdx = Math.floor((i - 1) / 2);
        enqueueEdgeTask(nodes[parentIdx], nodes[i]);
      }
    } else if (topology === "random tree") {
      // 1) Alte randomParents verwerfen und neu aufbauen
      randomParents = [];
      // 2) Für den Root-Knoten kein Parent
      if (nodes.length > 0) {
        randomParents.push(null);
      }
      // 3) Für jeden weiteren Knoten i einen zufälligen Parent < i wählen
      for (let i = 1; i < nodes.length; i++) {
        const pIdx = Math.floor(Math.random() * i);
        randomParents.push(pIdx);
        enqueueEdgeTask(nodes[pIdx], nodes[i]);
      }
    } else if (topology === "nnt") {
      // Für jeden Knoten i>0: finde per Greedy-Lookup den nächsten Parent
      for (let i = 1; i < nodes.length; i++) {
        let bestIdx = 0;
        let bestDist = Infinity;
        for (let j = 0; j < i; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d  = Math.hypot(dx, dy);
          if (d < bestDist) {
            bestDist = d;
            bestIdx  = j;
          }
        }
        enqueueEdgeTask(nodes[bestIdx], nodes[i]);
      }
    } else if (topology === "complete") {
      // alle bestehenden Knotenpaare mit neuem Node verbinden:
      // (hier incremental: für i=1..N-1 alle j< i)
      for (let i = 1; i < nodes.length; i++) {
        for (let j = 0; j < i; j++) {
          enqueueEdgeTask(nodes[j], nodes[i]);
        }
      }
    } else if (topology === "path") {
      // Neuaufbau: für i = 1..N-1 jeweils Vorgänger → aktueller
      for (let i = 1; i < nodes.length; i++) {
        enqueueEdgeTask(nodes[i - 1], nodes[i]);
      }
    } else if (topology === "emst") {
      // 1) alle alten Edges wegshrinken
      edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
      // 2) dann MST-Kanten neu animiert hinzufügen
      const mstEdges = computeEMSTEdges(nodes);
      mstEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
    } else if (topology === "delaunay") {
      // 1) alle alten Kanten shrinken
      edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
      // 2) dann neue Delaunay-Kanten animiert hinzufügen
      const delaunayEdges = computeDelaunayEdges(nodes);
      delaunayEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
    } else if (topology === "gabriel") {
      // 1) Alte Kanten shrinken
      edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
      // 2) Gabriel global neu berechnen und aufbauen
      const gabrielEdges = computeGabrielEdges(nodes);
      gabrielEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
    } else if (topology === "rng") {
      // 1) Alte Kanten shrinken
      edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
      // 2) RNG global neu berechnen und aufbauen
      const rngEdges = computeRNGEdges(nodes);
      rngEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
    } else if (topology === "gg") {
      edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
      const r = 100; // Threshold
      const ggEdges = computeGGEdges(nodes, r);
      ggEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
    } else if (topology === "chordal ring") {
      // 1) Alte Kanten shrinken
      edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
      // 2) Ring + Chords neu aufbauen
      const crEdges = computeDynamicChordalRingEdges(nodes);
      crEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
    }

    // 4) Animation starten (falls nicht schon)
    animation.running = true;
    loop();
  });
  topologySel.parent(ui);

  // 4) Random Button
  const randBtn = createButton("🎲 Random Node");
  randBtn.mousePressed(() => {
    // Zufällige Klickkoordinaten auf dem Canvas
    const rx = random(width);
    const ry = random(height);

    // Snap & occupied wie in mousePressed()
    const { x, y, occupiedKey } = snapNode(rx, ry);
    if (occupiedKey && occupied[occupiedKey]) return;
    if (occupiedKey) occupied[occupiedKey] = true;

    // Node- und Edge-Tasks enqueuen
    enqueueNodeTask(x, y);
    computeEdges(nodes, { x, y }).forEach(e => enqueueEdgeTask(e.from, e.to));

    // Animation starten
    animation.running = true;
    loop();
  });

  // 5) Algorithmus-Select
  algorithmSel = createSelect();
  ["Nearest Neighbor", "2-Nearest", "Random"]
    .forEach(opt => algorithmSel.option(opt));
  algorithmSel.selected("Nearest Neighbor");
  algorithmSel.changed(() => {
    algorithm = algorithmSel.value().toLowerCase().replace(" ", "-");
    redraw();
  });
  algorithmSel.parent(ui);

  // 6) Buttons
  const applyBtn    = createButton("▶️ Apply").parent(ui);
  const stepBackBtn = createButton("↩️ Step Back").parent(ui);
  const resetBtn    = createButton("🔄 Reset").parent(ui);
  const exportBtn   = createButton("💾 Export JSON").parent(ui);
  const importBtn   = createButton("📂 Import JSON").parent(ui);

  applyBtn.mousePressed(() =>  { applyAlgorithm(); redraw(); });
  stepBackBtn.mousePressed(() => {
    animation.running = false;
    noLoop();
    // 1) Nichts tun, wenn keine Knoten da sind
    if (nodes.length === 0) return;

    // 2) Zu entfernenden Knoten und vorherige Knotensammlung merken
    const removedNode = nodes[nodes.length - 1];
    const prevNodes   = nodes.slice(0, nodes.length - 1);

    // 3) Shrink-Tasks für die alten Kanten anlegen
    if (topology === "ring") {
      if (prevNodes.length > 0) {
        const prevLast = prevNodes[prevNodes.length - 1];
        const first    = prevNodes[0];
        enqueueRemoveEdgeTask(prevLast, removedNode);
        enqueueRemoveEdgeTask(removedNode, first);
        enqueueEdgeTask(prevLast, first);
      }
    } else if (topology === "star") {
      if (prevNodes.length > 0) {
        const hub = prevNodes[0];
        enqueueRemoveEdgeTask(hub, removedNode);
      }
    } else if (topology === "binary tree") {
      // Einzige Kante: Parent → removedNode
      if (prevNodes.length > 0) {
        // Index des entfernten Knotens war prevNodes.length
        const removedIndex = prevNodes.length;
        const parentIdx    = Math.floor((removedIndex - 1) / 2);
        const parentNode   = prevNodes[parentIdx];
        enqueueRemoveEdgeTask(parentNode, removedNode);
      }
    } else if (topology === "random tree") {
      // entfernten Knoten i = prevNodes.length
      const removedIndex = prevNodes.length;
      const pIdx         = randomParents[removedIndex];
      if (pIdx != null) {
        enqueueRemoveEdgeTask(prevNodes[pIdx], removedNode);
      }
    } else if (topology === "nnt") {
      // Für den entfernten Knoten removedNode i = prevNodes.length:
      if (prevNodes.length > 0) {
        let bestIdx = 0;
        let bestDist = Infinity;
        // nächstgelegenen Vorgänger in prevNodes suchen
        for (let j = 0; j < prevNodes.length; j++) {
          const dx = removedNode.x - prevNodes[j].x;
          const dy = removedNode.y - prevNodes[j].y;
          const d  = Math.hypot(dx, dy);
          if (d < bestDist) {
            bestDist = d;
            bestIdx  = j;
          }
        }
        enqueueRemoveEdgeTask(prevNodes[bestIdx], removedNode);
      }
    }  else if (topology === "complete") {
      // entferne alle Kanten vom gelöschten Knoten zu jedem Vorgänger
      const removedIndex = prevNodes.length;
      for (let j = 0; j < removedIndex; j++) {
        enqueueRemoveEdgeTask(prevNodes[j], removedNode);
      }
    } else if (topology === "path") {
      // entferne die Kante zwischen Vorgänger und removedNode
      const removedIndex = prevNodes.length;
      if (removedIndex > 0) {
        enqueueRemoveEdgeTask(prevNodes[removedIndex - 1], removedNode);
      }
    } else if (topology === "emst") {
      // 1) alle verbleibenden statischen Kanten wegshrinken
      edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
      // 2) neue MST-Kanten basierend auf prevNodes aufbauen
      const prevMST = computeEMSTEdges(prevNodes);
      prevMST.forEach(e => enqueueEdgeTask(e.from, e.to));
    }  else if (topology === "delaunay") {
      // alte Kanten global wegschrumpfen
      edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
      // Delaunay für prevNodes neu berechnen
      const prevDT = computeDelaunayEdges(prevNodes);
      prevDT.forEach(e => enqueueEdgeTask(e.from, e.to));
    } else if (topology === "gabriel") {
      // 1) alle verbleibenden Kanten shrinken
      edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
      // 2) Gabriel für prevNodes neu berechnen
      const prevGabriel = computeGabrielEdges(prevNodes);
      prevGabriel.forEach(e => enqueueEdgeTask(e.from, e.to));
    } else if (topology === "rng") {
      // 1) alle verbleibenden Kanten shrinken
      edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
      // 2) RNG für prevNodes neu berechnen
      const prevRNG = computeRNGEdges(prevNodes);
      prevRNG.forEach(e => enqueueEdgeTask(e.from, e.to));
    } else if (topology === "gg") {
      edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
      const r = 100;
      const prevGG = computeGGEdges(prevNodes, r);
      prevGG.forEach(e => enqueueEdgeTask(e.from, e.to));
    } else if (topology === "chordal ring") {
      // Alte Kanten wegshrinken
      edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
      // Ring + Chords neu aufbauen
      const crEdges = computeDynamicChordalRingEdges(nodes);
      crEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
    } else {
      const created = computeEdges(prevNodes, removedNode);
      created.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
    } 

    // 4) Knoten intern entfernen
    nodes.pop();
    randomParents.pop();

    // 5) Falls Tasks da sind: Animation starten und sofort einen Frame zeichnen
    if (animation.queue.length > 0) {
      animation.running = true;
      loop();
      // Erzwinge direkt einen Draw, damit man die Shrink-Animation sofort sieht
      redraw();
    } else {
      // sonst: einfach sofort komplett neu zeichnen
      redraw();
    }
  });

  resetBtn.mousePressed(() => {
    // 1) Animation stoppen
    animation.running = false;
    noLoop();

    // 2) Alle Daten löschen
    nodes = [];
    edges = [];
    randomParents = [];
    randEdges = [];
    occupied = {};

    // 3) Alle pending-Tasks verwerfen
    animation.queue = [];
    animation.current = null;

    // 4) Canvas neu zeichnen
    redraw();
  });
  exportBtn.mousePressed(exportToJSON);
  importBtn.mousePressed(() => fileInput.elt.click());

  // 7) File-Input verstecken
  fileInput = createFileInput(importFromJSON);
  fileInput.attribute("accept", ".json");
  fileInput.hide();

  // 8) Info-Text initial anzeigen
  showTopologyInfo(topologySel.value().toLowerCase());
}
