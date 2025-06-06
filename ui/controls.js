let topologySel, algorithmSel;
let fileInput; // <<< hier neu

function setupUI() {
  const ui = select("#ui");
  ui.html("");
  ui.style("display", "grid");
  ui.style("grid-template-columns", "repeat(auto-fit, minmax(120px, auto))");
  ui.style("gap", "10px");
  ui.style("padding", "10px");
  ui.style("background", "#e0e0e0");

  const title = createElement("h2", "Network Topology Explorer");
  title.parent(ui);
  title.style("grid-column", "1 / -1");

  // Topology-Select
  topologySel = createSelect();
  ["Ring", "Star", "Binary Tree", "Random Tree", "Nearest Tree", "Complete", "Path", "EMST", "Gabriel", "RNG", "Delaunay", "Grid", "RGG", "K-Nearest", "Convex Hull", "Clustered", "Chordal Ring", "Layered", "Random Weighted"]
    .forEach(opt => topologySel.option(opt));
  topologySel.selected("Ring");
  topologySel.changed(() => {
    topology = topologySel.value().toLowerCase();
    nodes = [];
    randomParents = [];
  });
  topologySel.parent(ui);

  // Algorithmus-Select
  algorithmSel = createSelect();
  ["Nearest Neighbor", "2-Nearest", "Random"]
    .forEach(opt => algorithmSel.option(opt));
  algorithmSel.selected("Nearest Neighbor");
  algorithmSel.changed(() => {
    algorithm = algorithmSel.value().toLowerCase().replace(" ", "-");
  });
  algorithmSel.parent(ui);

  // Apply-Button
  const applyBtn = createButton("▶️ Apply");
  applyBtn.mousePressed(applyAlgorithm);
  applyBtn.parent(ui);

  // Step Back
  const stepBackBtn = createButton("↩️ Step Back");
  stepBackBtn.mousePressed(() => nodes.pop());
  stepBackBtn.parent(ui);

  // Reset
  const resetBtn = createButton("🔄 Reset");
  resetBtn.mousePressed(() => {
    nodes = [];
    randomParents = [];
  });
  resetBtn.parent(ui);

  // Export JSON
  const exportBtn = createButton("💾 Export JSON");
  exportBtn.mousePressed(exportToJSON);
  exportBtn.parent(ui);

  // Versteckter File-Input zum Import von JSON (in globale Variable schreiben)
  fileInput = createFileInput(importFromJSON);
  fileInput.attribute("accept", ".json");
  fileInput.hide();

  const importBtn = createButton("📂 Import JSON");
  importBtn.mousePressed(() => fileInput.elt.click());
  importBtn.parent(ui);
}
