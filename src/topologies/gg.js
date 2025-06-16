import { 
  ggThreshold, 
  setGGThreshold, 
  bumpVersion, 
  nodes, 
  edges, 
  animation 
} from '../core/state.js';
import { enqueueRemoveEdgeTask, enqueueEdgeTask } from '../core/tasks.js';
import { startLoop } from '../renderers/p5Renderer.js';

/**
 * Hilfsfunktion: berechnet alle Kanten im Geometric Graph (Distanz ≤ ggThreshold)
 * für ein ganzes Node-Array.
 * @param {Array<{x:number,y:number}>} nodesArr
 * @returns {Array<{from:{x:number,y:number},to:{x:number,y:number}}>}
 */
function computeAllEdges(nodesArr) {
  const edges = [];
  const r2 = ggThreshold * ggThreshold;
  const N = nodesArr.length;
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const a = nodesArr[i], b = nodesArr[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      if (dx*dx + dy*dy <= r2) {
        edges.push({ from: a, to: b });
      }
    }
  }
  return edges;
}

/**
 * Δ-Add: berechnet die Kantenänderungen beim Hinzufügen von newNode.
 * Entfernt keine Kanten, fügt nur jene hinzu, die newNode betreffen.
 * @param {Array<{x:number,y:number}>} oldNodes 
 * @param {{x:number,y:number}} newNode 
 * @returns {{removes:Array, adds:Array}}
 */
export function diffAdd(oldNodes, newNode) {
  // nur neue Kanten zwischen jedem alten Knoten und newNode
  const adds = [];
  const r2 = ggThreshold * ggThreshold;
  for (const a of oldNodes) {
    const dx = a.x - newNode.x, dy = a.y - newNode.y;
    if (dx*dx + dy*dy <= r2) {
      adds.push({ from: a, to: newNode });
    }
  }
  return { removes: [], adds };
}

/**
 * Δ-Undo: berechnet die Kantenänderungen beim Entfernen von removedNode.
 * Entfernt alle Kanten, die removedNode betreffen.
 * @param {Array<{x:number,y:number}>} oldNodes   Zustand nach dem Entfernen
 * @param {{x:number,y:number}} removedNode      der entfernte Knoten
 * @returns {{removes:Array, adds:Array}}
 */
export function diffUndo(oldNodes, removedNode) {
  // alle ehemaligen Kanten zwischen removedNode und jedem alten Knoten
  const removes = [];
  const r2 = ggThreshold * ggThreshold;
  for (const a of oldNodes) {
    const dx = a.x - removedNode.x, dy = a.y - removedNode.y;
    if (dx*dx + dy*dy <= r2) {
      removes.push({ from: a, to: removedNode });
    }
  }
  return { removes, adds: [] };
}

/**
 * Δ-Full: berechnet alle Kanten für alle vorhandenen Knoten
 * beim vollständigen Neuaufbau (Topologie-Wechsel).
 * @param {Array<{x:number,y:number}>} allNodes
 * @returns {{removes:Array, adds:Array}}
 */
export function diffFull(allNodes) {
  return {
    removes: [],          // extern bereits entfernt
    adds:    computeAllEdges(allNodes)
  };
}

/**
 * Snap-Funktion für Geometric Graph (GG): Klick-Koordinaten unverändert übernehmen.
 * @param {number} mx - Maus-X
 * @param {number} my - Maus-Y
 * @returns {{x:number,y:number,occupiedKey:null}}
 */
export function snap(mx, my) {
  return { x: mx, y: my, occupiedKey: null };
}

/**
 * Setup für die Bottom-Controls bei dieser Topologie.
 * @param {HTMLElement} container
 * @param {Function} requestRedraw
 */
export function setupBottomControls(container, requestRedraw) {
  container.innerHTML = `
    <label for="ggThreshold">Threshold r:</label>
    <input type="range" id="ggThreshold" min="10" max="1000" step="10" value="${ggThreshold}">
    <span id="ggThresholdVal">${ggThreshold}</span>
  `;
  const slider = container.querySelector('#ggThreshold');
  const label  = container.querySelector('#ggThresholdVal');

  slider.addEventListener('input', e => {
    label.textContent = e.target.value;
  });

  slider.addEventListener('change', () => {
    const newVal = +slider.value;
    setGGThreshold(newVal);
    bumpVersion();

    // 1) alle aktuellen Kanten animiert entfernen
    edges.forEach(({ from, to }) =>
      enqueueRemoveEdgeTask(from, to, /* speed= */ 1)
    );

    // 2) alle neuen Kanten hinzufügen
    const { adds } = diffFull(nodes);
    adds.forEach(({ from, to }) =>
      enqueueEdgeTask(from, to, /* speed= */ 1)
    );

    // 3) Animation starten
    animation.running = true;
    startLoop();
  });
}