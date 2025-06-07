
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

  // Alte Knoten und Parent-Arrays löschen
  nodes = [];
  randomParents = [];
  randEdges = [];

  // Topologie intern setzen und Dropdown synchronisieren
  if (typeof data.topology === "string") {
    topology = data.topology.toLowerCase();

    // Beispiel: data.topology = "star" → topoCapitalized = "Star"
    const topoCapitalized = data.topology
      .split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    topologySel.selected(topoCapitalized);
  }

  // Algorithmus intern setzen und Dropdown synchronisieren
  if (typeof data.algorithm === "string") {
    algorithm = data.algorithm.toLowerCase();

    // exportToJSON schreibt z. B. "nearest-neighbor", "2-nearest" oder "random".
    let algoCapitalized;
    switch (data.algorithm) {
      case "nearest-neighbor":
        algoCapitalized = "Nearest Neighbor";
        break;
      case "2-nearest":
        algoCapitalized = "2-Nearest";
        break;
      case "random":
        algoCapitalized = "Random";
        break;
      default:
        // Falls etwas Unerwartetes in der Datei steht, lassen wir die Auswahl unverändert.
        algoCapitalized = algorithmSel.value();
    }
    algorithmSel.selected(algoCapitalized);
  }

  // Knoten aus JSON übernehmen
  for (let n of data.nodes) {
    if (typeof n.x === "number" && typeof n.y === "number") {
      nodes.push({
        id: n.id ?? null,
        label: n.label ?? "",
        x: n.x,
        y: n.y,
        color: n.color ?? "#6495ED"
      });
      // Für den Fall "random tree" könnten hier Parent-Indizes aus JSON übernommen
      // oder einfach null gesetzt werden:
      randomParents.push(null);
    } else {
      console.warn("Ungültiger Knoten übersprungen:", n);
    }
  }

  // WICHTIG: File-Input manuell zurücksetzen, damit derselbe Dateiname erneut importiert werden kann
  if (typeof fileInput !== "undefined" && fileInput.elt) {
    fileInput.elt.value = "";
  }
  redraw();
}


