import { knnK, setKnnK, bumpVersion, nodes, edges, animation } from '../core/state.js';
import { enqueueEdgeTask, enqueueRemoveEdgeTask } from '../core/tasks.js';
import { startLoop } from '../renderers/p5Renderer.js';

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Löscht alle aktuellen Kanten und baut dann
 * für jeden Knoten seine k nächstgelegenen Nachbarn auf.
 */
export function runKnn(state, { k = knnK, speed }) {
  // 1) Alten Graph abreißen
  edges.forEach(({ from, to }) => enqueueRemoveEdgeTask(from, to, speed));

  // 2) Neue K-NN-Kanten berechnen
  const all = state.nodes;
  for (let i = 0; i < all.length; i++) {
    const u = all[i];
    // sortiere alle anderen nach Distanz
    const nearest = all
      .filter((_, j) => j !== i)
      .map(v => ({ v, d: dist(u, v) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, Math.min(k, all.length - 1))
      .map(o => o.v);

    nearest.forEach(v => enqueueEdgeTask(u, v, speed));
  }

  // 3) Animation starten
  animation.running = true;
  startLoop();
  bumpVersion();      // falls du Versioning nutzt
}
