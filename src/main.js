import * as state from './core/state.js';
import {
  enqueueNodeTask,
  enqueueEdgeTask,
  enqueueRemoveEdgeTask
} from './core/tasks.js';
import { topologies } from './topologies/index.js';
import { applyAlgorithm } from './algorithms/index.js';
import { startRenderer, startLoop, requestRedraw } from './renderers/p5Renderer.js';
import { setupControls } from './ui/controls.js';
import { showTopologyInfo } from './ui/info.js';
import { drawHint } from './ui/hint.js';
import { drawNodes } from './ui/nodes.js';
import { snapToGrid, updateGridNodePositions } from './utils/grid.js';
import { exportToJSON, importFromJSON } from './utils/jsonIO.js';
import { computeBoundingBox, downloadPNG, downloadSVG } from './utils/exporters.js';

// Animation Speed State und UI
let speedValue = 1;
const currentSpeed = { get: () => speedValue };
const speedSlider = document.getElementById('speedRange');
if (speedSlider) {
  speedSlider.addEventListener('input', e => {
    speedValue = parseFloat(e.target.value);
  });
}

// Renderer starten
startRenderer({ speed: currentSpeed });

// Dynamisches Bottom-Controls-Update
function updateBottomControls() {
  const panel = document.getElementById('bottom-controls');
  const topo  = topologies[state.topology];
  if (topo && typeof topo.setupBottomControls === 'function') {
    panel.style.display = 'block';
    topo.setupBottomControls(panel, requestRedraw);
  } else {
    panel.innerHTML = '';
    panel.style.display = 'none';
  }
}

// UI-Setup mit Callbacks
setupControls({
  onSelectTopology(key) {
    // 1) Topologie im State setzen
    state.setTopology(key);
    state.bumpVersion();
    
    // 2) Bestehende Kanten animiert entfernen
    state.edges.forEach(e => enqueueRemoveEdgeTask(e.from, e.to, currentSpeed.get()));
    
    // 3) Neue Kanten laut Topologie berechnen und animiert aufbauen
    //    Für initialen Rebuild alle bisherigen Nodes berücksichtigen
    const cfg = topologies[key];
    if (cfg.diffFull) {
      const { adds } = cfg.diffFull(state.nodes);
      adds.forEach(({ from, to }) =>
        enqueueEdgeTask(from, to, currentSpeed.get())
      );
    }

    // 4) UI + Canvas aktualisieren
    showTopologyInfo(key);
    updateBottomControls();
    // Loop starten, um animierte Tasks abzuspielen
    state.animation.running = true;
    startLoop();
  },
  onSelectAlgorithm(key) {
    state.algorithm = key;
  },
  onStepBack() {
    if (state.nodes.length === 0) return;

    // 1) Stoppe Animation & nimm den letzten Node aus dem Modell
    state.animation.running = false;
    const removedNode = state.nodes.pop();

    // 2) Verwerfe alte Tasks
    state.animation.queue.length = 0;
    state.animation.current = null;

    // 3) bumpVersion um Alt-Tasks zu ignorieren
    state.bumpVersion();

    // 4) Hole just jene Kanten, die remove/add sollen
    const { removes, adds } =
      topologies[state.topology].diffUndo(state.nodes, removedNode);

    // 5) Enqueue Removal-Tasks (rot)
    removes.forEach(({ from, to }) =>
        enqueueRemoveEdgeTask(from, to, currentSpeed.get())
    );
    // 6) Enqueue Add-Tasks (grün)
    adds.forEach(({ from, to }) =>
        enqueueEdgeTask(from, to, currentSpeed.get())
    );

    // 7) UI updaten
    updateBottomControls();

    // 8) Loop & Erst-Frame
    state.animation.running = true;
    startLoop();
    requestRedraw();
  },
  onReset() {
    state.animation.running = false;
    state.nodes.length = 0;
    state.edges.length = 0;
    state.randomParents && (state.randomParents.length = 0);
    state.animation.queue.length = 0;
    state.animation.current = null;
    state.bumpVersion();
    updateBottomControls();
    requestRedraw();
  },
  onExportJSON() {
    exportToJSON();
  },
  onImportJSON(file) {
    importFromJSON(file, data => {
      // 1) Alte Animation stoppen und alle aktuellen Kanten wegshinken
      state.animation.running = false;
      state.edges.forEach(e =>
        enqueueRemoveEdgeTask(e.from, e.to, currentSpeed.get())
      );

      // 2) Lokalen State komplett zurücksetzen
      state.nodes.length = 0;
      state.edges.length = 0;
      state.randomParents.length = 0;
      state.animation.queue.length = 0;
      state.animation.current = null;

      // 3) Topologie & Algorithmus aus der Datei übernehmen (mit Validierung)
      let fileTopo = data.topology;
      if (!topologies[fileTopo]) {
        console.warn(`Unknown topology "${fileTopo}", falling back to "${state.topology}"`);
        fileTopo = state.topology;
      }
      state.setTopology(fileTopo);

      let fileAlgo = data.algorithm;
      // wir prüfen, ob es ein entsprechendes Icon gibt
      if (!document.querySelector(`#algo-grid img[data-algo="${fileAlgo}"]`)) {
        console.warn(`Unknown algorithm "${fileAlgo}", falling back to "${state.algorithm}"`);
        fileAlgo = state.algorithm;
      }
      state.setAlgorithm(fileAlgo);

      state.bumpVersion();

      // 4) Nodes aus JSON laden
      data.nodes.forEach(n => {
        state.nodes.push({
          x: n.x,
          y: n.y,
          color: n.color,
          label: n.label
        });
        state.randomParents.push(null);
      });

      // 5) Vollständiges Kanten-Rebuild via diffFull
      const cfg = topologies[state.topology];
      if (typeof cfg.diffFull === 'function') {
        const { adds } = cfg.diffFull(state.nodes);
        adds.forEach(({ from, to }) =>
          enqueueEdgeTask(from, to, currentSpeed.get())
        );
      } else {
        // Fallback: inkrementell über diffAdd
        const oldList = [];
        state.nodes.forEach(n => {
          const { adds } = cfg.diffAdd
            ? cfg.diffAdd(oldList, n)
            : { adds: cfg.computeEdges(oldList, n) };
          adds.forEach(({ from, to }) =>
            enqueueEdgeTask(from, to, currentSpeed.get())
          );
          oldList.push(n);
        });
      }

      // 6) Sidebar-Icons updaten
      document.querySelectorAll('#topo-grid img.selected')
        .forEach(i => i.classList.remove('selected'));
      document.querySelectorAll('#algo-grid img.selected')
        .forEach(i => i.classList.remove('selected'));

      const topoImg = document.querySelector(
        `#topo-grid img[data-topo="${state.topology}"]`
      );
      if (topoImg) topoImg.classList.add('selected');

      const algoImg = document.querySelector(
        `#algo-grid img[data-algo="${state.algorithm}"]`
      );
      if (algoImg) algoImg.classList.add('selected');

      // 7) UI neu zeichnen & Animation starten
      showTopologyInfo(state.topology);
      updateBottomControls();
      state.animation.running = true;
      startLoop();
    });
  },
  onExportPng() {
    const canvas = document.querySelector('#canvas-container canvas');
    if (!canvas) return;
    const { minX, minY, width, height } =
      computeBoundingBox(state.nodes, state.edges, 10);
    downloadPNG(canvas, minX, minY, width, height);
  },
  onExportSvg() {
    downloadSVG(state.nodes, state.edges, 10);
  },
  onApplyAlgorithm() {
    applyAlgorithm(state, { k: state.knnK, speed: currentSpeed.get() });
    // Animation starten, damit die enqueuten Kantenanims ablaufen
    state.animation.running = true;
    startLoop();
    requestRedraw();
  }  
});

// Initialisierung
showTopologyInfo(state.topology);
updateBottomControls();
requestRedraw();
