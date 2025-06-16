// src/topologies/rng.js

/**
 * Snap-Funktion für Relative Neighborhood Graph (RNG): Klick-Koordinaten unverändert übernehmen.
 * @param {number} mx - Maus-X
 * @param {number} my - Maus-Y
 * @returns {{x:number,y:number,occupiedKey:null}}
 */
export function snap(mx, my) {
  return { x: mx, y: my, occupiedKey: null };
}

/**
 * Hilfsfunktion: erzeugt alle RNG-Kanten für ein gegebenes Punkt-Array.
 * @param {Array<{x:number,y:number}>} nodesArr
 * @returns {Array<{from:{x:number,y:number},to:{x:number,y:number}}>}}
 */
function computeAllEdges(nodesArr) {
  const edges = [];
  const N = nodesArr.length;
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const a = nodesArr[i], b = nodesArr[j];
      const ab2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
      // Prüfe, ob ein dritter Knoten C existiert, der näher an A und an B ist
      let blocked = false;
      for (let k = 0; k < N; k++) {
        if (k === i || k === j) continue;
        const c = nodesArr[k];
        const ac2 = (a.x - c.x) ** 2 + (a.y - c.y) ** 2;
        const bc2 = (b.x - c.x) ** 2 + (b.y - c.y) ** 2;
        if (ac2 < ab2 && bc2 < ab2) {
          blocked = true;
          break;
        }
      }
      if (!blocked) edges.push({ from: a, to: b });
    }
  }
  return edges;
}

/** Normalisiert eine Kante auf einen String-Key für Set-Vergleiche */
function edgeKey(e) {
  return `${e.from.x},${e.from.y}:${e.to.x},${e.to.y}`;
}

/**
 * Δ-Full für Topologie-Wechsel: einfach alle aktuellen RNG-Kanten als Adds.
 * (Removals werden bereits zentral beim Topologie-Switch animiert.)
 * @param {Array<{x:number,y:number}>} allNodes
 */
export function diffFull(allNodes) {
  return {
    removes: [],
    adds: computeAllEdges(allNodes)
  };
}

/**
 * Δ-Add beim neuen Knoten: diff zwischen computeAllEdges(oldNodes) und computeAllEdges(oldNodes∪newNode)
 * @param {Array<{x:number,y:number}>} oldNodes
 * @param {{x:number,y:number}} newNode
 */
export function diffAdd(oldNodes, newNode) {
  const before = computeAllEdges(oldNodes);
  const after  = computeAllEdges([...oldNodes, newNode]);
  const beforeSet = new Set(before.map(edgeKey));
  const afterSet  = new Set(after.map(edgeKey));
  const removes = before.filter(e => !afterSet.has(edgeKey(e)));
  const adds    = after.filter(e => !beforeSet.has(edgeKey(e)));
  return { removes, adds };
}

/**
 * Δ-Undo beim Entfernen des letzten Knotens: diff zwischen computeAllEdges(old∪removed) und computeAllEdges(old)
 * @param {Array<{x:number,y:number}>} oldNodes     // Zustand nach dem Pop
 * @param {{x:number,y:number}} removedNode
 */
export function diffUndo(oldNodes, removedNode) {
  const full     = computeAllEdges([...oldNodes, removedNode]);
  const current  = computeAllEdges(oldNodes);
  const fullSet  = new Set(full.map(edgeKey));
  const currSet  = new Set(current.map(edgeKey));
  const removes  = full.filter(e => !currSet.has(edgeKey(e)));
  const adds     = current.filter(e => !fullSet.has(edgeKey(e)));
  return { removes, adds };
}

/**
 * Setup für die Bottom-Controls bei dieser Topologie.
 * Da RNG keine Parameter hat, wird das Panel ausgeblendet.
 * @param {HTMLElement} container
 * @param {Function} requestRedraw
 */
export function setupBottomControls(container, requestRedraw) {
  container.innerHTML = '';
  container.style.display = 'none';
}
