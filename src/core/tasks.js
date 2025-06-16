import { animation, nodes, edges, topologyVersion } from './state.js';

const BASE_DURATION = 10; // Frames bei Speed=1

function calcDuration(speed) {
  return speed > 0
    ? Math.max(1, Math.round(BASE_DURATION / speed))
    : 1;
}

/**
 * Fügt einen neuen "Node"-Task hinzu und aktualisiert das Modell sofort.
 */
export function enqueueNodeTask(x, y, speed) {
  const duration = calcDuration(speed);
  animation.queue.push({ type: 'node', node: { x, y }, progress: 0, duration });
  nodes.push({ x, y });
}

/**
 * Fügt einen neuen Kanten-Aufbau-Task hinzu.
 */
export function enqueueEdgeTask(from, to, speed) {
  const duration = calcDuration(speed);
  animation.queue.push({
    type: 'edge', from, to,
    progress: 0,
    duration,
    version: topologyVersion
  });
}

/**
 * Fügt einen Kanten-Abbau-Task hinzu.
 */
export function enqueueRemoveEdgeTask(from, to, speed) {
  const duration = calcDuration(speed);
  animation.queue.push({
    type: 'remove-edge', from, to,
    progress: 0,
    duration,
    version: topologyVersion
  });
}