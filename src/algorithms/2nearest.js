import { enqueueEdgeTask } from '../core/tasks.js';
/**
 * Verbindet jeden Knoten i>0 mit seinen 2 nächsten Vorgängern.
 */
export function run2Nearest(state, params) {
  const { nodes } = state;
  for (let i = 1; i < nodes.length; i++) {
    const dists = nodes
      .slice(0, i)
      .map((n, j) => ({ idx: j, d: Math.hypot(nodes[i].x - n.x, nodes[i].y - n.y) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    dists.forEach(({ idx }) => {
      enqueueEdgeTask(nodes[idx], nodes[i], params.speed);
    });
  }
}