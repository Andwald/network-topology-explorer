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
  ["Ring", "Path", "Star", "Binary Tree", "Random Tree", "NNT", "Complete",
   "EMST", "Gabriel", "RNG", "Delaunay", "Grid", "RGG", "k-NN Graph",
   "Convex Hull", "Chordal Ring", "Layered"]
    .forEach(opt => topologySel.option(opt));
  topologySel.selected("Ring");
  topologySel.changed(() => {
    topology = topologySel.value().toLowerCase();

    // Slider nur für k-NN Graph einblenden
    if (topology === "k-nn graph") {
      kLabel.show();
      kSlider.show();
    } else {
      kLabel.hide();
      kSlider.hide();
    }

    // Reset der Daten
    nodes = [];
    randomParents = [];
    randEdges = [];
    occupied = {};
    showTopologyInfo(topology);
    redraw();
  });
  topologySel.parent(ui);

  // 4) Random Button
  const randBtn = createButton("🎲 Random Node");
  randBtn.mousePressed(() => {
    placeRandomNode();
    redraw();
  });
  randBtn.parent(ui);

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
  stepBackBtn.mousePressed(() => { nodes.pop(); randomParents.pop(); redraw(); });
  resetBtn.mousePressed(() =>   { nodes = []; randomParents = []; randEdges = []; occupied = {}; redraw(); });
  exportBtn.mousePressed(exportToJSON);
  importBtn.mousePressed(() => fileInput.elt.click());

  // 7) File-Input verstecken
  fileInput = createFileInput(importFromJSON);
  fileInput.attribute("accept", ".json");
  fileInput.hide();

  // 8) Info-Text initial anzeigen
  showTopologyInfo(topologySel.value().toLowerCase());
}
