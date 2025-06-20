import { kAryK, setKAryK, bumpVersion, nodes as stateNodes, edges as stateEdges, animation } from '../core/state.js';
import { enqueueEdgeTask, enqueueRemoveEdgeTask } from '../core/tasks.js';
import { startLoop } from '../renderers/p5Renderer.js';

/**
 * Snap-Funktion für k-ary Tree: Klick-Koordinaten unverändert übernehmen.
 */
export function snap(mx, my) {
  return { x: mx, y: my, occupiedKey: null };
}

/**
 * Δ-Add: Verbindet newNode mit seinem Parent floor((i-1)/k)
 */
export function diffAdd(oldNodes, newNode) {
  const i = oldNodes.length;
  if (i === 0) return { removes: [], adds: [] };
  const parentIdx = Math.floor((i - 1) / kAryK);
  return { removes: [], adds: [{ from: oldNodes[parentIdx], to: newNode }] };
}

/**
 * Δ-Undo: Entfernt die Kante zwischen Parent und removedNode
 */
export function diffUndo(oldNodes, removedNode) {
  const i = oldNodes.length;
  if (i === 0) return { removes: [], adds: [] };
  const parentIdx = Math.floor((i - 1) / kAryK);
  return { removes: [{ from: oldNodes[parentIdx], to: removedNode }], adds: [] };
}

/**
 * Δ-Full: Kompletter Rebuild aller k-ary Tree Kanten
 */
export function diffFull(allNodes) {
  const adds = [];
  for (let i = 1; i < allNodes.length; i++) {
    const parentIdx = Math.floor((i - 1) / kAryK);
    adds.push({ from: allNodes[parentIdx], to: allNodes[i] });
  }
  return { removes: [], adds };
}

/**
 * Setup Bottom-Controls: Slider für k (2–10) mit Rebuild on Change
 */
export function setupBottomControls(container, requestRedraw) {
  container.innerHTML = `
    <label for="kAryK">Children per Parent (k):</label>
    <input
      type="range"
      id="kAryK"
      min="3"
      max="10"
      step="1"
      value="${kAryK}"
    >
    <span id="kAryKVal">${kAryK}</span>
  `;
  const slider = container.querySelector('#kAryK');
  const label  = container.querySelector('#kAryKVal');

  slider.addEventListener('input', () => {
    label.textContent = slider.value;
  });

  slider.addEventListener('change', () => {
    setKAryK(+slider.value);
    bumpVersion();

    // Rebuild edges for existing nodes
    const speed = 1;
    stateEdges.forEach(({ from, to }) =>
      enqueueRemoveEdgeTask(from, to, speed)
    );

    const { adds } = diffFull(stateNodes);
    adds.forEach(({ from, to }) =>
      enqueueEdgeTask(from, to, speed)
    );

    // Restart animation for edge rebuild
    animation.running = true;
    startLoop();

    requestRedraw();
  });
}
