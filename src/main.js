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


// Animationsspeed abhängig von Queue Länge einstellen
export function adjustQueueDurations() {
  const queue        = state.animation.queue;
  const K            = queue.length;
  const KEEP_LAST    = 5;
  const FPS          = 60;
  const TOTAL_FRAMES = 15 * FPS;      // Budget: 15 Sekunden
  const BASE_DUR     = 10;            // wie in core/tasks.js
  const sliderSpeed  = currentSpeed.get();

  // Wie viele Frames würden alle Tasks in Slider-Speed benötigen?
  const framesNeeded = Math.round(K * (BASE_DUR / sliderSpeed));
  if (framesNeeded <= TOTAL_FRAMES) {
    // Kein Verkürzen nötig: alle auf Slider-Speed
    queue.forEach(task => {
      task.duration = Math.max(1, Math.round(BASE_DUR / sliderSpeed));
    });
    return;
  }

  // Wir müssen verkürzen:
  // Anzahl alter Tasks (ohne die letzten KEEP_LAST)
  const M = Math.max(0, K - KEEP_LAST);

  // Frames, die die letzten KEEP_LAST in Slider-Speed verbrauchen
  const framesLast   = Math.round(KEEP_LAST * (BASE_DUR / sliderSpeed));
  const remainFrames = TOTAL_FRAMES - framesLast;

  // Auto-Speed so, dass M * (BASE_DUR/autoSpeed) == remainFrames
  const autoSpeed = (M > 0 && remainFrames > 0)
    ? (BASE_DUR * M) / remainFrames
    : sliderSpeed;

  // Dauer jedes Tasks neu setzen
  queue.forEach((task, idx) => {
    const sp = idx < M ? autoSpeed : sliderSpeed;
    task.duration = Math.max(1, Math.round(BASE_DUR / sp));
  });
}

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
    adjustQueueDurations()
    state.animation.running = true;
    startLoop();
  },
  onSelectAlgorithm(key) {
    state.algorithm = key;
  },
  onStepBack() {
    if (state.nodes.length === 0) return;

    // letzten Knoten aus dem Modell nehmen
    const removedNode = state.nodes.pop();

    // Δ-Undo berechnen
    const { removes, adds } = topologies[state.topology].diffUndo(state.nodes, removedNode);

    // alle Remove- und Add-Tasks hinten an die Queue hängen
    removes.forEach(({ from, to }) =>
      enqueueRemoveEdgeTask(from, to, currentSpeed.get())
    );
    adds.forEach(({ from, to }) =>
      enqueueEdgeTask(from, to, currentSpeed.get())
    );

    // UI aktualisieren und Animation weitermachen
    adjustQueueDurations()
    updateBottomControls();
    state.animation.running = true;
    startLoop();
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
      adjustQueueDurations()
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
  onAddRandomNode() {
    const count = state.nodes.length;
    const container = document.getElementById('canvas-container');
    const W = container.offsetWidth;
    const H = container.offsetHeight;

    // Bereichs-Faktor: 0–20 ⇒ 0.5, 20–50 ⇒ 0.5→1, ab 50 ⇒ 1
    let frac;
    if (count <= 20) frac = 0.5;
    else if (count >= 50) frac = 1;
    else frac = 0.5 + ((count - 20) / 30) * 0.5;

    // Zufällige Koordinaten im oberen linken Bereich
    const rawX = Math.random() * W * frac;
    const rawY = Math.random() * H * frac;

    // Auf Topologie-Grid o.ä. runden
    const cfg = topologies[state.topology];
    const { x, y } = cfg.snap(rawX, rawY);

    // Knoten anlegen (push & Animation)
    enqueueNodeTask(x, y, currentSpeed.get());

    // Kanten-Deltas berechnen wie beim Klick
    const newNode = state.nodes[state.nodes.length - 1];
    const oldList = state.nodes.slice(0, -1);
    const { removes, adds } = cfg.diffAdd(oldList, newNode);
    removes.forEach(({ from, to }) => enqueueRemoveEdgeTask(from, to, currentSpeed.get()));
    adds   .forEach(({ from, to }) => enqueueEdgeTask(from, to, currentSpeed.get()));

    // Animation starten
    adjustQueueDurations()
    state.animation.running = true;
    startLoop();
    requestRedraw();
  },
  onApplyAlgorithm() {
    applyAlgorithm(state, { k: state.knnK, speed: currentSpeed.get() });
    // Animation starten, damit die enqueuten Kantenanims ablaufen
    adjustQueueDurations()
    state.animation.running = true;
    startLoop();
    requestRedraw();
  }  
});

// Initialisierung
showTopologyInfo(state.topology);
adjustQueueDurations()
updateBottomControls();
requestRedraw();
