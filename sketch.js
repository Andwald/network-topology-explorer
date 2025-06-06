let nodes = [];
let uiHeight = 80;
let topology = "ring";
let algorithm = "nearest";
let algorithmSelector;

function setup() {
  noCanvas(); // Canvas erstellen wir später manuell

  const ui = createDiv().id("ui");
  ui.style("display", "grid");
  ui.style("grid-template-columns", "repeat(auto-fit, minmax(120px, auto))");
  ui.style("grid-template-rows", "auto auto");
  ui.style("gap", "10px");
  ui.style("padding", "10px");
  ui.style("background", "#e0e0e0");

  // Titel (0,0), über mehrere Spalten
  const title = createElement("h2", "Network Topology Explorer");
  title.parent(ui);
  title.style("grid-column", "1 / -1");

  // Topologie-Dropdown
  const topologySel = createSelect();
  topologySel.option("Ring");
  topologySel.selected("Ring");
  topologySel.changed(() => {
    topology = topologySel.value().toLowerCase();
    nodes = [];
  });
  topologySel.parent(ui);

  // Algorithmus-Dropdown
  const algorithmSel = createSelect();
  algorithmSel.option("Nearest Neighbor");
  algorithmSel.option("2-Nearest");
  algorithmSel.option("Random");
  algorithmSel.selected("Nearest Neighbor");
  algorithmSel.changed(() => {
    algorithm = algorithmSel.value().toLowerCase().replace(" ", "-");
  });
  algorithmSel.parent(ui);

  // Apply Button
  const applyBtn = createButton("▶️ Apply");
  applyBtn.mousePressed(applyAlgorithm);
  applyBtn.parent(ui);

  // Reset Button
  const resetBtn = createButton("🔄 Reset");
  resetBtn.mousePressed(() => nodes = []);
  resetBtn.parent(ui);

  // Export Button
  const exportBtn = createButton("💾 Export JSON");
  exportBtn.mousePressed(exportToJSON);
  exportBtn.parent(ui);

  // Versteckter Datei-Input
  const hiddenInput = createFileInput(importFromJSON);
  hiddenInput.attribute("accept", ".json");
  hiddenInput.hide(); // ← Versteckt das native Feld

  // Sichtbarer Button
  const importBtn = createButton("📂 Import JSON");
  importBtn.mousePressed(() => hiddenInput.elt.click()); // Öffnet das versteckte Input-Feld
  importBtn.parent(ui);

  // Jetzt das Canvas darunter
  canvas = createCanvas(windowWidth, windowHeight - 100);
  canvas.parent(document.body); // explizit unterhalb des UI-Containers
}


function draw() {
  background(240);

  // Hinweistext am oberen linken Rand des Canvas (nicht im UI)
  noStroke();
  fill(0);
  textAlign(LEFT, TOP);
  text("Klick im unteren Bereich, um Knoten hinzuzufügen.", 10, 10);

  // Netzwerk-Logik
  if (topology === "ring") {
    drawRingTopology();
  }

  // Knoten zeichnen
  for (let n of nodes) {
    fill(n.color ?? "#6495ED");
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


function mousePressed() {
  // Nur klicken unterhalb des UI-Bereichs
  if (mouseY > uiHeight) {
    nodes.push({ x: mouseX, y: mouseY });
  }
}

function drawRingTopology() {
  stroke(100);
  for (let i = 1; i < nodes.length; i++) {
    line(nodes[i - 1].x, nodes[i - 1].y, nodes[i].x, nodes[i].y);
  }
  if (nodes.length > 2) {
    line(
      nodes[nodes.length - 1].x,
      nodes[nodes.length - 1].y,
      nodes[0].x,
      nodes[0].y
    );
  }
}

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
  console.log("file:", file);
  console.log("typeof file.data:", typeof file.data);
  
  let data;
  try {
    if (typeof file.data === "object") {
      // Schon geparst
      data = file.data;
    } else {
      // Muss noch geparsed werden
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

  nodes = [];

  if (typeof data.topology === "string") topology = data.topology.toLowerCase();
  if (typeof data.algorithm === "string") algorithm = data.algorithm.toLowerCase();

  for (let n of data.nodes) {
    if (typeof n.x === "number" && typeof n.y === "number") {
      nodes.push({
        id: n.id ?? null,
        label: n.label ?? "",
        x: n.x,
        y: n.y,
        color: n.color ?? "#6495ED"
      });
    } else {
      console.warn("Ungültiger Knoten übersprungen:", n);
    }
  }
}



function applyAlgorithm() {
  console.log("Applying:", algorithm);

  // Hier später die Logik für "nearest", "2-nearest", etc. implementieren
  // Zum Beispiel: neue Verbindungslinien zeichnen oder Daten aktualisieren
}
