/**
 * Berechnet die Kanten-Deltas beim Hinzufügen eines neuen Knotens im Binary-Tree.
 * Verbindet newNode mit seinem Parent-Knoten (floor((i-1)/2)).
 * @param {Array<{x:number,y:number}>} oldNodes - vorhandene Knoten vor dem Hinzufügen
 * @param {{x:number,y:number}} newNode - neu hinzugefügter Knoten
 * @returns {{removes:Array, adds:Array<{from:{x:number,y:number},to:{x:number,y:number}}>}}
 */
export function diffAdd(oldNodes, newNode) {
  const i = oldNodes.length; // neuer Index
  if (i === 0) {
    return { removes: [], adds: [] };
  }
  const parentIdx = Math.floor((i - 1) / 2);
  return {
    removes: [],
    adds: [ { from: oldNodes[parentIdx], to: newNode } ]
  };
}

/**
 * Berechnet die Kanten-Deltas beim Rückgängig-Machen (Undo) im Binary-Tree.
 * Entfernt die Kante zwischen Parent und removedNode.
 * @param {Array<{x:number,y:number}>} oldNodes - verbleibende Knoten nach dem Entfernen
 * @param {{x:number,y:number}} removedNode - entfernte Knoteninstanz
 * @returns {{removes:Array<{from:{x:number,y:number},to:{x:number,y:number}}>, adds:Array}}
 */
export function diffUndo(oldNodes, removedNode) {
  const removedIndex = oldNodes.length;
  if (removedIndex === 0) {
    return { removes: [], adds: [] };
  }
  const parentIdx = Math.floor((removedIndex - 1) / 2);
  return {
    removes: [ { from: oldNodes[parentIdx], to: removedNode } ],
    adds: []
  };
}

/**
 * Berechnet alle Kanten für einen vollständigen Binary-Tree (Full-Rebuild).
 * Für jeden Knoten i>0 wird eine Kante zu floor((i-1)/2) erzeugt.
 * @param {Array<{x:number,y:number}>} allNodes - alle aktuellen Knoten
 * @returns {{removes:Array, adds:Array<{from:{x:number,y:number},to:{x:number,y:number}}>}}
 */
export function diffFull(allNodes) {
  const adds = [];
  for (let i = 1; i < allNodes.length; i++) {
    const parentIdx = Math.floor((i - 1) / 2);
    adds.push({ from: allNodes[parentIdx], to: allNodes[i] });
  }
  return { removes: [], adds };
}

/**
 * Snap-Funktion für Binary Tree: Klick-Koordinaten unverändert übernehmen.
 * @param {number} mx - Maus-X
 * @param {number} my - Maus-Y
 * @returns {{x:number,y:number,occupiedKey:null}}
 */
export function snap(mx, my) {
  return { x: mx, y: my, occupiedKey: null };
}

/**
 * Deaktiviert das Bottom-Controls-Panel für Binary-Tree-Topologie.
 * @param {HTMLElement} container - Container-Element der Bottom-Controls
 * @param {Function} requestRedraw - Callback zum Neuzeichnen des Canvas
 */
export function setupBottomControls(container, requestRedraw) {
  container.innerHTML = '';
  container.style.display = 'none';
}