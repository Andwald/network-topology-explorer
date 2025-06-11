// Export current network state as JSON
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
  const a = document.createElement('a');
  a.href = url;
  a.download = "network_export.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import network state from JSON file
function importFromJSON(file) {
  let data;
  try {
    // Handle binary or text
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

  // --- Reset ---
  animation.running = false;
  noLoop();
  nodes = [];
  randomParents = [];
  randEdges = [];
  edges = [];
  animation.queue = [];
  animation.current = null;

  // --- Topology & Algorithm ---
  if (typeof data.topology === "string") {
    const requested = data.topology.trim().toLowerCase();
    if (topologyData.hasOwnProperty(requested)) {
      topology = requested;
      selectTopology(document.querySelector(`#topo-grid img[data-topo=\"${requested}\"]`));
    } else {
      console.warn("Unbekannte Topologie:", data.topology);
    }
  }

  if (typeof data.algorithm === "string") {
    const requestedAlgo = data.algorithm.toLowerCase();
    algorithm = requestedAlgo;
    selectAlgorithm(document.querySelector(`#algo-grid img[data-algo=\"${requestedAlgo}\"]`));
  }

  // --- Nodes ---
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

  // Clear file input to allow re-import
  if (fileInput && fileInput.elt) {
    fileInput.elt.value = "";
  }

  // --- Rebuild edges per topology ---
  updateTopologyEdges();

  // --- Start animation if any ---
  if (animation.queue.length > 0) {
    animation.running = true;
    loop();
  } else {
    redraw();
  }
}
