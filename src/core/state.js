/**
 * Globaler State für das Netzwerk-Explorer-Projekt
 */

// Knoten- und Kanten-Arrays
export const nodes = [];
export const edges = [];

// Speichert für Random-Tree den Parent-Index jedes Knotens
export const randomParents = [];

// Aktuelle Topologie- und Algorithmus-Auswahl
export let topology = 'ring';
export let algorithm = 'nearest';

// Parameter für bestimmte Topologien
export let knnK = 3;                // k-Wert für k-NN
export let gridSize = 50;           // Zellgröße für Grid-Graph
export let chordThreshold = 6;      // Max Hops für Chordal-Ring
export let ggThreshold = 100;       // Distanz-Schwelle für Geometric Graph

// Animations-Queue und Status
export const animation = {
  running: false,
  queue: [],
  current: null
};

// Version, um veraltete Animationen zu ignorieren
export let topologyVersion = 0;
export function bumpVersion() {
  topologyVersion++;
}
export function getVersion() {
  return topologyVersion;
}

// Setter-Funktionen für mutable Exports
export function setTopology(val) {
  topology = val;
}
export function setAlgorithm(val) {
  algorithm = val;
}

// Setter für dynamische Parameter
export function setChordThreshold(val) {
  chordThreshold = val;
}
export function setGGThreshold(val) {
  ggThreshold = val;
}
export function setGridSize(val) {
  gridSize = val;
}
export function setKnnK(val) {
  knnK = val;
}