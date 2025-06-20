import { bumpVersion } from '../core/state.js';

/**
 * Generiert alle Kanten eines Ladder Graph für ein Node-Array:
 * - Rungs zwischen Paaren (0-1,2-3,...)
 * - Rails auf jeder Seite
 */
function dynamicLadderEdges(nodesArr) {
  const edges = [];
  const n = nodesArr.length;
  // Rungs
  for (let i = 0; i + 1 < n; i += 2) {
    edges.push({ from: nodesArr[i], to: nodesArr[i + 1] });
  }
  // Rails: linke Seite
  for (let i = 0; i + 2 < n; i += 2) {
    edges.push({ from: nodesArr[i], to: nodesArr[i + 2] });
  }
  // Rails: rechte Seite
  for (let i = 1; i + 2 < n; i += 2) {
    edges.push({ from: nodesArr[i], to: nodesArr[i + 2] });
  }
  return edges;
}

export function snap(mx, my) {
  return { x: mx, y: my, occupiedKey: null };
}

/**
 * Δ-Add: Berechnet Rung/Rail-Deltas, mutiert nicht nodes
 */
export function diffAdd(oldNodes, newNode) {
  const removes = [];
  const adds = [];
  const i = oldNodes.length;
  // i == 0: kein Edge
  if (i === 0) {
    return { removes, adds };
  }
  // i odd -> newNode ist Right-Knoten
  if (i % 2 === 1) {
    // Rung
    const left = oldNodes[i - 1];
    adds.push({ from: left, to: newNode });
    // Rail (rechte Seite)
    if (i > 1) {
      const prevRight = oldNodes[i - 2];
      adds.push({ from: prevRight, to: newNode });
    }
  } else {
    // i even (>0) -> newNode ist Left-Knoten
    if (i > 1) {
      const prevLeft = oldNodes[i - 2];
      adds.push({ from: prevLeft, to: newNode });
    }
  }
  return { removes, adds };
}

/**
 * Δ-Undo: invertiert diffAdd
 */
export function diffUndo(oldNodes, removedNode) {
  // oldNodes ist Zustand nach Entfernen
  const { removes, adds } = diffAdd(oldNodes, removedNode);
  return {
    removes: adds,
    adds: removes
  };
}

/**
 * Δ-Full: kompletter Rebuild
 */
export function diffFull(allNodes) {
  return { removes: [], adds: dynamicLadderEdges(allNodes) };
}

export function setupBottomControls(container /*, requestRedraw*/) {
  container.innerHTML = '';
}
