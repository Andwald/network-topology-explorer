import {
  gridSize,
  setGridSize,
  bumpVersion,
  nodes,
  edges,
  animation
} from '../core/state.js';
import {
  enqueueRemoveEdgeTask,
  enqueueEdgeTask
} from '../core/tasks.js';
import { startLoop } from '../renderers/p5Renderer.js';
import { snapToGrid, updateGridNodePositions } from '../utils/grid.js';

/**
 * Δ-Add: berechnet die neuen Kanten, wenn newNode hinzugefügt wird.
 * Verbindet newNode nur mit seinen direkten 4-Nachbarn im Raster.
 * @param {Array<{x:number,y:number}>} oldNodes  bestehende Knoten
 * @param {{x:number,y:number}} newNode         neu hinzugefügter Knoten
 * @returns {{removes:Array, adds:Array}}
 */
export function diffAdd(oldNodes, newNode) {
  const adds = [];
  const col = Math.round(newNode.x / gridSize);
  const row = Math.round(newNode.y / gridSize);
  const nbrs = [
    { x: (col+1)*gridSize, y: row*gridSize },
    { x: (col-1)*gridSize, y: row*gridSize },
    { x: col*gridSize,     y: (row+1)*gridSize },
    { x: col*gridSize,     y: (row-1)*gridSize }
  ];
  for (const n of oldNodes) {
    for (const nb of nbrs) {
      if (n.x === nb.x && n.y === nb.y) {
        adds.push({ from: n, to: newNode });
      }
    }
  }
  return { removes: [], adds };
}

/**
 * Δ-Undo: berechnet die zu entfernenden Kanten, wenn removedNode gelöscht wird.
 * Entfernt alle Kanten zwischen removedNode und seinen 4-Nachbarn.
 * @param {Array<{x:number,y:number}>} oldNodes   Zustand nach dem Entfernen
 * @param {{x:number,y:number}} removedNode      der entfernte Knoten
 * @returns {{removes:Array, adds:Array}}
 */
export function diffUndo(oldNodes, removedNode) {
  // Logik wie diffAdd, aber als removes
  const { adds } = diffAdd(oldNodes, removedNode);
  return { removes: adds, adds: [] };
}

/**
 * Δ-Full: berechnet alle Kanten für einen kompletten Neuaufbau
 * beim Topologie-Wechsel. Baut alle Gitter-Nachbarschaften neu auf.
 * @param {Array<{x:number,y:number}>} allNodes
 * @returns {{removes:Array, adds:Array}}
 */
export function diffFull(allNodes) {
  const adds = [];
  const seen = [];
  for (const node of allNodes) {
    const { adds: newAdds } = diffAdd(seen, node);
    adds.push(...newAdds);
    seen.push(node);
  }
  return { removes: [], adds };
}

/**
 * Snap-Funktion für Grid-Graph: Rundet Klick-Koordinaten auf Raster.
 * @param {number} mx Maus-X
 * @param {number} my Maus-Y
 * @returns {{x:number,y:number,occupiedKey:string}}
 */
export function snap(mx, my) {
  return snapToGrid(mx, my, gridSize);
}

/**
 * Setup für die Bottom-Controls bei dieser Topologie.
 * Stellt einen Slider für die Grid-Zellgröße bereit und
 * aktualisiert beim Loslassen automatisch alle Kanten.
 * @param {HTMLElement} container
 * @param {Function} requestRedraw
 */
export function setupBottomControls(container, requestRedraw) {
  container.innerHTML = `
    <label for="gridSize">Grid-Zelle (px):</label>
    <input type="range" id="gridSize" min="10" max="200" step="5" value="${gridSize}">
    <span id="gridSizeVal">${gridSize}</span>
  `;
  const slider = container.querySelector('#gridSize');
  const label  = container.querySelector('#gridSizeVal');

  slider.addEventListener('input', e => {
    label.textContent = e.target.value;
  });

  slider.addEventListener('change', () => {
    const newSize = +slider.value;
    setGridSize(newSize);
    bumpVersion();

    // 1) Raster-Align aller Knoten
    updateGridNodePositions(nodes, gridSize);

    // 2) Alle bestehenden Kanten animiert entfernen
    edges.forEach(({ from, to }) =>
      enqueueRemoveEdgeTask(from, to, /* speed */ 1)
    );

    // 3) Alle neuen Gitter-Kanten aufbauen
    const { adds } = diffFull(nodes);
    adds.forEach(({ from, to }) =>
      enqueueEdgeTask(from, to, /* speed */ 1)
    );

    // 4) Animation starten
    animation.running = true;
    startLoop();
  });
}
