
import { runNearest } from './nearest.js';
import { run2Nearest } from './2nearest.js';
import { runRandom } from './random.js';

/**
 * Wählt basierend auf dem Schlüssel 'algorithm' die passende Run-Funktion.
 */
const algorithmMap = {
  'nearest': runNearest,
  '2-nearest': run2Nearest,
  'random': runRandom
  // Weitere Algorithmen hier ergänzen
};

/**
 * Führt den ausgewählten Algorithmus auf dem aktuellen State aus.
 * @param {{nodes:Array, edges:Array, algorithm:string}} state
 * @param {{k?:number, speed:number}} params
 */
export function applyAlgorithm(state, params) {
  const fn = algorithmMap[state.algorithm];
  if (!fn) {
    console.warn(`Unbekannter Algorithmus: ${state.algorithm}`);
    return;
  }
  fn(state, params);
}
