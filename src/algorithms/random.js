import { enqueueEdgeTask } from '../core/tasks.js';

/**
 * Verbindet jeden Knoten i>0 mit einem zufälligen Vorgänger.
 */
export function runRandom(state, params) {
  const { nodes } = state;
  for (let i = 1; i < nodes.length; i++) {
    const pIdx = Math.floor(Math.random() * i);
    enqueueEdgeTask(nodes[pIdx], nodes[i], params.speed);
  }
}