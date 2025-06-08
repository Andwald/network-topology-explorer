
function exportToJSON() {
  const data = {
    nodes: nodes.map((n, i) => ({
      id: n.id ?? i,
      label: n.label ?? "",
      x: n.x,
      y: n.y,
      color: n.color ?? "#6495ED"
    })),
    topology: topology,
    algorithm: algorithm
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = createA(url, "network_export.json");
  a.attribute("download", "network_export.json");
  a.hide();
  a.elt.click();
  URL.revokeObjectURL(url);
}

function importFromJSON(file) {
  let data;
  try {
    if (typeof file.data === "object") {
      data = file.data;
    } else {
      let content = file.data;
      if (typeof content !== "string") {
        content = new TextDecoder("utf-8").decode(content);
      }
      data = JSON.parse(content);
    }
  } catch (e) {
    alert("Fehler beim Parsen der Datei.");
    console.error(e);
    return;
  }

  if (!Array.isArray(data.nodes)) {
    alert("Ungültige Datei: 'nodes' fehlt oder ist kein Array.");
    return;
  }

  // --- Alte Daten löschen ---
  // Stoppe laufende Animation und leere Canvas
  animation.running = false;
  noLoop();

  // Leere alle Strukturen
  nodes = [];
  randomParents = [];
  randEdges         = [];
  edges             = [];
  animation.queue   = [];
  animation.current = null;

  // --- Topologie und Algorithmus übernehmen ---
if (typeof data.topology === "string") {
  const requested = data.topology.trim().toLowerCase();
  // gültige Keys aus deinem info.js (oder alternativ topologyHandlers)
  const validKeys = Object.keys(topologyInfo); 
  // finde exakt den Eintrag, unabhängig von Groß-/Kleinschreibung
  const match = validKeys.find(key => key.toLowerCase() === requested);
  if (match) {
    topology = match;
    // Dropdown-Label wieder in Title Case
    const label = match
      .split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    topologySel.selected(label);
    showTopologyInfo(topology);
  } else {
    console.warn("Unbekannte Topologie:", data.topology);
  }
}


  if (typeof data.algorithm === "string") {
    algorithm = data.algorithm.toLowerCase();
    let algoCapitalized;
    switch (data.algorithm) {
      case "nearest-neighbor":
        algoCapitalized = "Nearest Neighbor"; break;
      case "2-nearest":
        algoCapitalized = "2-Nearest";       break;
      case "random":
        algoCapitalized = "Random";          break;
      default:
        algoCapitalized = algorithmSel.value();
    }
    algorithmSel.selected(algoCapitalized);
  }

  // --- Knoten aus JSON übernehmen ---
  for (let n of data.nodes) {
    if (typeof n.x === "number" && typeof n.y === "number") {
      nodes.push({
        id:    n.id ?? null,
        label: n.label ?? "",
        x:     n.x,
        y:     n.y,
        color: n.color ?? "#6495ED"
      });
      randomParents.push(null);
    } else {
      console.warn("Ungültiger Knoten übersprungen:", n);
    }
  }

  // Eingabe zurücksetzen, damit derselbe Dateiname erneut importiert werden kann
  if (typeof fileInput !== "undefined" && fileInput.elt) {
    fileInput.elt.value = "";
  }

  // --- Neue Kanten animiert aufbauen ---
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
      nodes.slice(1).forEach(n => enqueueEdgeTask(hub, n));
    }
  } else if (topology === "binary tree") {
    for (let i = 1; i < nodes.length; i++) {
      const parentIdx = Math.floor((i - 1) / 2);
      enqueueEdgeTask(nodes[parentIdx], nodes[i]);
    }
  } else if (topology === "random tree") {
    // zufällige Parents neu generieren und animiert aufbauen
    randomParents = [];  // sicherstellen
    if (nodes.length > 0) {
      randomParents.push(null);
      for (let i = 1; i < nodes.length; i++) {
        const pIdx = Math.floor(Math.random() * i);
        randomParents.push(pIdx);
        enqueueEdgeTask(nodes[pIdx], nodes[i]);
      }
    }
  } else if (topology === "ntt") {
    // für jeden Knoten i>0 Greedy-Parent suchen
    if (nodes.length > 1) {
      for (let i = 1; i < nodes.length; i++) {
        let bestIdx = 0, bestDist = Infinity;
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
    }
  } else if (topology === "complete") {
    // für jeden i=1..N-1 und j<i
    for (let i = 1; i < nodes.length; i++) {
      for (let j = 0; j < i; j++) {
        enqueueEdgeTask(nodes[j], nodes[i]);
      }
    }
  } else if (topology === "path") {
    // import: für i = 1..N-1 jeweils Vorgänger → aktueller
    for (let i = 1; i < nodes.length; i++) {
      enqueueEdgeTask(nodes[i - 1], nodes[i]);
    }
  } else if (topology === "emst") {
    const mstEdges = computeEMSTEdges(nodes);
    mstEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
  } else if (topology === "delaunay") {
    // Delaunay nach dem Import animiert aufbauen
    const delaunayEdges = computeDelaunayEdges(nodes);
    delaunayEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
  } else if (topology === "gabriel") {
    // nach dem Import Gabriel animiert aufbauen
    const gabrielEdges = computeGabrielEdges(nodes);
    gabrielEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
  } else if (topology === "rng") {
    // nach dem Import RNG animiert aufbauen
    const rngEdges = computeRNGEdges(nodes);
    rngEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
  } else if (topology === "gg") {
    const r = 100;
    const ggEdges = computeGGEdges(nodes, r);
    ggEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
  } else if (topology === "chordal ring") {
    const d = 2;
    // kompletten Chordal Ring importieren
    const crEdges = computeChordalRingEdges(nodes, d);
    crEdges.forEach(e => enqueueEdgeTask(e.from, e.to));
  }

  // Animation starten
  animation.running = true;
  loop();
}

/** TODO
  "chordal ring": {
    title: "Chordal Ring",
    desc: "Ring plus fixed-step chords based on node indices.",
    pros: ["Improves diameter over simple ring", "Regular topology"],
    cons: ["Assumes circular ordering", "Chaotic on arbitrary layouts"]
  },
  "k-nn graph": {
    title: "k-Nearest Neighbors Graph",
    desc: "Each node connects to its k closest neighbors.",
    pros: ["Controls local connectivity", "Reflects clustering structure"],
    cons: ["Needs sorting distances", "May be asymmetric"]
  },"grid": {
    title: "Grid Graph",
    desc: "Snaps nodes to a fixed grid and connects 4-neighbors (up/down/left/right).",
    pros: ["Structured layout", "Simple neighbor logic"],
    cons: ["Depends on grid size", "May distort true distances"]
  }
 */
