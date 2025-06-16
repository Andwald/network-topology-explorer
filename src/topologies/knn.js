import {
  knnK,
  setKnnK,
  bumpVersion,
  nodes,
  edges,
  animation
} from '../core/state.js';
import {
  enqueueEdgeTask,
  enqueueRemoveEdgeTask
} from '../core/tasks.js';
import { startLoop } from '../renderers/p5Renderer.js';

/**
 * Δ-Add: Berechnet die Kanten, die beim Hinzufügen von newNode
 * zu seinen k nächsten Nachbarn hinzukommen.
 * @param {Array<{x:number,y:number}>} oldNodes - bestehende Knoten
 * @param {{x:number,y:number}} newNode - neu hinzugefügter Knoten
 * @returns {{removes:Array, adds:Array}}
 */
export function diffAdd(oldNodes, newNode) {
  const k = knnK;
  if (oldNodes.length === 0 || k < 1) {
    return { removes: [], adds: [] };
  }
  // Abstände berechnen
  const nearest = oldNodes
    .map(n => ({ node: n, d: Math.hypot(n.x - newNode.x, n.y - newNode.y) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, Math.min(k, oldNodes.length))
    .map(o => o.node);

  const adds = nearest.map(node => ({ from: node, to: newNode }));
  return { removes: [], adds };
}

/**
 * Δ-Undo: Berechnet genau die Kanten, die beim Entfernen von removedNode
 * wieder gelöscht werden müssen.
 * @param {Array<{x:number,y:number}>} oldNodes - Zustand nach dem Entfernen
 * @param {{x:number,y:number}} removedNode - der entfernte Knoten
 * @returns {{removes:Array, adds:Array}}
 */
export function diffUndo(oldNodes, removedNode) {
  const { adds } = diffAdd(oldNodes, removedNode);
  return { removes: adds, adds: [] };
}

/**
 * Δ-Full: Für kompletten Neuaufbau (Topologie-Wechsel) alle k-NN-Kanten
 * iterativ berechnen, um Dopplungen zu vermeiden.
 * @param {Array<{x:number,y:number}>} allNodes - alle existierenden Knoten
 * @returns {{removes:Array, adds:Array}}
 */
export function diffFull(allNodes) {
  const adds = [];
  const seen = [];
  for (const n of allNodes) {
    const { adds: newAdds } = diffAdd(seen, n);
    adds.push(...newAdds);
    seen.push(n);
  }
  return { removes: [], adds };
}

/**
 * Klick-Snap für k-NN: Koordinaten unverändert übernehmen.
 * @param {number} mx - Maus-X
 * @param {number} my - Maus-Y
 * @returns {{x:number,y:number,occupiedKey:null}}
 */
export function snap(mx, my) {
  return { x: mx, y: my, occupiedKey: null };
}

/**
 * Initialisierung des Bottom-Control-Panels für k-NN.
 * @param {HTMLElement} container
 * @param {Function} requestRedraw
 */
export function setupBottomControls(container, requestRedraw) {
  container.innerHTML = `
    <label for="knnK">k (neighbors):</label>
    <input type="range" id="knnK" min="1" max="10" step="1" value="${knnK}">
    <span id="knnKVal">${knnK}</span>
  `;
  const slider = container.querySelector('#knnK');
  const label  = container.querySelector('#knnKVal');

  slider.addEventListener('input', () => {
    label.textContent = slider.value;
  });

  slider.addEventListener('change', () => {
    setKnnK(+slider.value);
    bumpVersion();

    // 1) Alte Kanten animiert entfernen
    edges.forEach(({ from, to }) =>
      enqueueRemoveEdgeTask(from, to, /* speed */ 1)
    );

    // 2) Alle neuen k-NN-Kanten aufbauen
    const { adds } = diffFull(nodes);
    adds.forEach(({ from, to }) =>
      enqueueEdgeTask(from, to, /* speed */ 1)
    );

    // 3) Animation starten
    animation.running = true;
    startLoop();
    requestRedraw();
  });
}
