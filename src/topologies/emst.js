/**
 * Hilfsfunktion: berechnet alle Kanten des Minimum Spanning Tree mittels Prim-Algorithmus.
 * @param {Array<{x:number,y:number}>} nodesArr - Array aller Knoten
 * @returns {Array<{from:{x:number,y:number},to:{x:number,y:number}}>}
 */
function computeEMSTEdges(nodesArr) {
  const N = nodesArr.length;
  if (N < 2) return [];

  const visited   = new Array(N).fill(false);
  const bestDist  = new Array(N).fill(Infinity);
  const bestParent= new Array(N).fill(null);
  const mstEdges  = [];

  visited[0] = true;
  for (let i = 1; i < N; i++) {
    const dx = nodesArr[i].x - nodesArr[0].x;
    const dy = nodesArr[i].y - nodesArr[0].y;
    bestDist[i]   = Math.hypot(dx, dy);
    bestParent[i] = 0;
  }

  for (let k = 1; k < N; k++) {
    let minD = Infinity, minIdx = -1;
    for (let i = 0; i < N; i++) {
      if (!visited[i] && bestDist[i] < minD) {
        minD = bestDist[i];
        minIdx = i;
      }
    }
    mstEdges.push({
      from: nodesArr[bestParent[minIdx]],
      to:   nodesArr[minIdx]
    });
    visited[minIdx] = true;

    for (let j = 0; j < N; j++) {
      if (!visited[j]) {
        const dx = nodesArr[j].x - nodesArr[minIdx].x;
        const dy = nodesArr[j].y - nodesArr[minIdx].y;
        const d  = Math.hypot(dx, dy);
        if (d < bestDist[j]) {
          bestDist[j]   = d;
          bestParent[j] = minIdx;
        }
      }
    }
  }

  return mstEdges;
}

/**
 * Δ-Add: beim Hinzufügen eines Knotens
 * - Entfernt alle Kanten des alten MST
 * - Fügt alle Kanten des neuen MST (oldNodes + newNode) hinzu
 * @param {Array<{x:number,y:number}>} oldNodes 
 * @param {{x:number,y:number}} newNode 
 * @returns {{removes:Array, adds:Array}}
 */
export function diffAdd(oldNodes, newNode) {
  const oldMST = computeEMSTEdges(oldNodes);
  const newMST = computeEMSTEdges([...oldNodes, newNode]);
  return {
    removes: oldMST,
    adds:    newMST
  };
}

/**
 * Δ-Undo: beim Entfernen eines Knotens
 * - Entfernt alle Kanten des MST mit removedNode
 * - Fügt alle Kanten des MST für oldNodes wieder hinzu
 * @param {Array<{x:number,y:number}>} oldNodes     Zustand nach dem Pop
 * @param {{x:number,y:number}} removedNode        der entfernte Knoten
 * @returns {{removes:Array, adds:Array}}
 */
export function diffUndo(oldNodes, removedNode) {
  const fullMST = computeEMSTEdges([...oldNodes, removedNode]);
  const prevMST = computeEMSTEdges(oldNodes);
  return {
    removes: fullMST,
    adds:    prevMST
  };
}

/**
 * Δ-Full: beim Topologie-Wechsel
 * - Fügt alle Kanten des MST für alle vorhandenen Knoten hinzu
 * (removes wird extern bereits erledigt)
 * @param {Array<{x:number,y:number}>} allNodes 
 * @returns {{removes:Array, adds:Array}}
 */
export function diffFull(allNodes) {
  return {
    removes: [],
    adds:    computeEMSTEdges(allNodes)
  };
}

/**
 * Snap-Funktion für EMST: Klick-Koordinaten unverändert übernehmen.
 * @param {number} mx - Maus-X
 * @param {number} my - Maus-Y
 * @returns {{x:number,y:number,occupiedKey:null}}
 */
export function snap(mx, my) {
  return { x: mx, y: my, occupiedKey: null };
}

/**
 * Setup für die Bottom-Controls bei dieser Topologie.
 * Da EMST keine Parameter hat, wird das Panel ausgeblendet.
 * @param {HTMLElement} container
 * @param {Function} requestRedraw
 */
export function setupBottomControls(container, requestRedraw) {
  container.innerHTML = '';
  container.style.display = 'none';
}
