import { enqueueEdgeTask } from '../core/tasks.js';

/**
 * Verbindet jeden Knoten i>0 mit seinem nächsten Vorgänger (greedy).
 * @param {{nodes:Array, edges:Array, animation:Object}} state
 * @param {{k?:number}} params
 */
export function runNearest(state, params) {
  const { nodes } = state;
  for (let i = 1; i < nodes.length; i++) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let j = 0; j < i; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const d = Math.hypot(dx, dy);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = j;
      }
    }
    enqueueEdgeTask(nodes[bestIdx], nodes[i], params.speed);
  }
}