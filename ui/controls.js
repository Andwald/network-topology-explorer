// ganz oben im File
let fileInput;

function initTopologyIcons() {
  // items für alle Topologien (SVG-Dateien liegen unter "icons/<key>.svg")
  const items = [
    { key: 'ring',          icon: 'icons/ring.svg',            label: 'Ring' },
    { key: 'path',          icon: 'icons/path.svg',            label: 'Path' },
    { key: 'star',          icon: 'icons/star.svg',            label: 'Star' },
    { key: 'binary-tree',   icon: 'icons/binary-tree.svg',     label: 'Binary Tree' },
    { key: 'random-tree',   icon: 'icons/random-tree.svg',     label: 'Random Tree' },
    { key: 'nnt',           icon: 'icons/nnt.svg',             label: 'NNT' },
    { key: 'complete',      icon: 'icons/complete.svg',        label: 'Complete' },
    { key: 'emst',          icon: 'icons/emst.svg',            label: 'EMST' },
    { key: 'delaunay',      icon: 'icons/delaunay.svg',        label: 'Delaunay' },
    { key: 'gabriel',       icon: 'icons/gabriel.svg',         label: 'Gabriel' },
    { key: 'rng',           icon: 'icons/rng.svg',             label: 'RNG' },
    { key: 'gg',            icon: 'icons/gg.svg',              label: 'GG' },
    { key: 'chordal-ring',  icon: 'icons/chordal-ring.svg',    label: 'Chordal Ring' },
    { key: 'knn',           icon: 'icons/knn.svg',             label: 'k-NN Graph' },
    { key: 'grid',          icon: 'icons/grid.svg',           label: 'Grid Graph' }
  ];
  const grid = document.getElementById('topo-grid');
  grid.innerHTML = '';  // vorher leeren
  items.forEach(item => {
    const img = document.createElement('img');
    img.src       = item.icon;
    img.alt       = item.label;
    img.title     = item.label;
    img.dataset.topo = item.key;
    img.addEventListener('click', () => selectTopology(img));
    grid.appendChild(img);
  });
}

function initAlgorithmIcons() {
  const items = [
    { key: 'nearest',  icon: 'icons/nearest.svg',  label: 'Nearest' },
    { key: '2-nearest',icon: 'icons/2nearest.svg', label: '2-Nearest' },
    { key: 'random',   icon: 'icons/random.svg',   label: 'Random' },
    // … alle weiteren Algorithmen
  ];
  const grid = document.getElementById('algo-grid');
  grid.innerHTML = '';
  items.forEach(item => {
    const img = document.createElement('img');
    img.src        = item.icon;
    img.alt        = item.label;
    img.title      = item.label;
    img.dataset.algo = item.key;
    img.addEventListener('click', () => selectAlgorithm(img));
    grid.appendChild(img);
  });
}

// wird vom main.js aufgerufen
function setupUI() {
  // 1) File-Input erzeugen
  fileInput = createFileInput(importFromJSON);
  fileInput.attribute("accept", ".json");
  fileInput.hide();

  // 2) Icon-Grid füllen
  initTopologyIcons();  // hier packst du dein Icon-Grid aus dem Canvas-Dokument rein
  initAlgorithmIcons();

  // 3) Button-Handlers binden
  document.getElementById('stepBackBtn')
          .addEventListener('click', stepBackHandler);
  document.getElementById('resetBtn')
          .addEventListener('click', resetHandler);
  document.getElementById('exportBtn')
          .addEventListener('click', exportToJSON);
  document.getElementById('importBtn')
          .addEventListener('click', () => fileInput.elt.click());
  document.getElementById('exportSvgBtn')
        .addEventListener('click', () => downloadSVG());
  document.getElementById('exportPngBtn')
          .addEventListener('click', () => downloadPNG());

  document.getElementById('applyAlgoBtn')
          .addEventListener('click', () => {
            applyAlgorithm();
            redraw();
          });

  // 4) Erstselektion
  // wähle „ring“ und „nearest” als Standard
  document.querySelector('#topo-grid img[data-topo="ring"]')
          .classList.add('selected');
  document.querySelector('#algo-grid img[data-algo="nearest"]')
          .classList.add('selected');

  showTopologyInfo(topology);
  updateTopologyEdges();
}

// 1) Berechne Bounding-Box aller Knoten und Kanten
function computeBoundingBox(nodes, edges) {
  const xs = nodes.map(n => n.x).concat(edges.flatMap(e => [e.from.x, e.to.x]));
  const ys = nodes.map(n => n.y).concat(edges.flatMap(e => [e.from.y, e.to.y]));
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  return { minX, minY, width: maxX - minX, height: maxY - minY };
}

// 2) Baue den SVG-String zusammen und croppe via viewBox
function buildSVGString(nodes, edges, padding = 10) {
  const { minX, minY, width, height } = computeBoundingBox(nodes, edges);
  const w = width + 2 * padding, h = height + 2 * padding;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" `
          + `viewBox="${minX - padding} ${minY - padding} ${w} ${h}">`;

  // Kanten
  edges.forEach(e => {
    svg += `<line x1="${e.from.x}" y1="${e.from.y}"`
         + ` x2="${e.to.x}" y2="${e.to.y}"`
         + ` stroke="#646464" stroke-width="1"/>`;
  });
  // Knoten
  nodes.forEach(n => {
    svg += `<circle 
      cx="${n.x}" 
      cy="${n.y}" 
      r="10" 
      fill="#6495ED" 
      stroke="#000" 
      stroke-width="1"
    />`;
  });

  svg += `</svg>`;
  return svg;
}

// 3) Download-Trigger
function downloadSVG(filename = 'topology.svg') {
  const svgStr = buildSVGString(window.nodes, window.edges, 10);
  const blob   = new Blob([svgStr], { type: 'image/svg+xml' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href       = url;
  a.download   = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exportiert nur den Teil des p5-Canvas, der alle Knoten+Kanten umfasst.
 */
function downloadPNG(filename = 'topology.png', padding = 10) {
  // 1) Bounding-Box aus deinen Daten holen
  const { minX, minY, width, height } = computeBoundingBox(window.nodes, window.edges);
  const w = width + 2 * padding;
  const h = height + 2 * padding;

  // 2) Original-Canvas finden
  const orig = document.querySelector('#canvas-container canvas');
  if (!orig) return console.error('Canvas nicht gefunden!');

  // 3) Offscreen-Canvas anlegen
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const ctx = off.getContext('2d');

  // 4) Ausschnitt vom Original in das Offscreen-Canvas zeichnen
  ctx.drawImage(
    orig,
    minX - padding,    // source x
    minY - padding,    // source y
    w,                 // source width
    h,                 // source height
    0,                  // dest x
    0,                  // dest y
    w,                 // dest width
    h                  // dest height
  );

  // 5) Als Blob exportieren und Download auslösen
  off.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href    = url;
    a.download= filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}



// selektiert die Topologie, high-lightet das Icon, updated `topology` und Info-Box
function selectTopology(img) {
  document.querySelectorAll('#topo-grid img')
          .forEach(i => i.classList.remove('selected'));
  img.classList.add('selected');
  topology = img.dataset.topo;
  window.topologyVersion++;

  if (topology === 'grid') {
    updateGridNodePositions();
  }

  showTopologyInfo(topology);
  updateTopologyEdges();
  updateBottomControls();
  if (window.updateBottomControls) window.updateBottomControls();
}

// selektiert den Algorithmus, high-lightet das Icon, updated `algorithm`
function selectAlgorithm(img) {
  document.querySelectorAll('#algo-grid img')
          .forEach(i => i.classList.remove('selected'));
  img.classList.add('selected');
  algorithm = img.dataset.algo;
}

// Wrapper um deine bestehende stepBack-Logik
function stepBackHandler() {
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
  } else if (topology === "binary-tree") {
    // Einzige Kante: Parent → removedNode
    if (prevNodes.length > 0) {
      // Index des entfernten Knotens war prevNodes.length
      const removedIndex = prevNodes.length;
      const parentIdx    = Math.floor((removedIndex - 1) / 2);
      const parentNode   = prevNodes[parentIdx];
      enqueueRemoveEdgeTask(parentNode, removedNode);
    }
  } else if (topology === "random-tree") {
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
  } else if (topology === "chordal-ring") {
    // Alte Kanten wegshrinken
    edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
    // Ring + Chords neu aufbauen
    const crEdges = computeDynamicChordalRingEdges(nodes);
    crEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
  } else if (topology === "knn") {
    // 1) alle alten Kanten wegrashen
    edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
    // 2) k-NN auf prevNodes neu berechnen
    const prevKNNEdges = computeKNNEdges(prevNodes, window.knnK);
    prevKNNEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
  } else if (topology === "grid") {
    // 1) Alle verbliebenen Kanten wegrashen
    edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));

    // 2) Knoten intern entfernen
    //    (wird außerhalb dieses Blocks schon gemacht: nodes.pop())

    // 3) Re-Grid: alle übrigen Nodes aufs Raster setzen
    updateGridNodePositions();

    // 4) Grid-Kanten neu aufbauen
    const prevGridEdges = computeGridEdges(nodes, window.gridSize);
    prevGridEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
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
}

// Wrapper um deine bestehende reset-Logik
function resetHandler() {
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
}

function updateTopologyEdges() {
  // 1) Alte Kanten animiert entfernen
  edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));

  // 2) Für jede Topologie die neuen Kanten enqueuen
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
  } else if (topology === "binary-tree") {
    // Für jeden Knoten i>0: Parent = floor((i–1)/2)
    for (let i = 1; i < nodes.length; i++) {
      const parentIdx = Math.floor((i - 1) / 2);
      enqueueEdgeTask(nodes[parentIdx], nodes[i]);
    }
  } else if (topology === "random-tree") {
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
    const r = window.ggThreshold;  // jetzt dynamisch vom Slider
    const ggEdges = computeGGEdges(nodes, r);
    ggEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
  } else if (topology === "chordal-ring") {
    // 1) Alte Kanten shrinken
    edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
    // 2) Ring + Chords neu aufbauen
    const crEdges = computeDynamicChordalRingEdges(nodes);
    crEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
  } else if (topology === "knn") {
    // k-NN Graph: global neu berechnen anhand window.knnK
    edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));
    const knnEdges = computeKNNEdges(nodes, window.knnK);
    knnEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
  } else if (topology === 'grid') {
    // 1) Alte Grid-Kanten wegshrinken
    edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to));

    // 2) alle 4-Nachbarschaften neu berechnen
    const gridEdges = computeGridEdges(nodes, window.gridSize);
    gridEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
  }
  // 3) Animation starten
  if (!animation.running) {
    animation.running = true;
    loop();
  }
}