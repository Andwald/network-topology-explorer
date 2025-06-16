/**
 * Snap-Funktion für Complete Graph: Klick-Koordinaten unverändert übernehmen.
 * @param {number} mx - Maus-X
 * @param {number} my - Maus-Y
 * @returns {{x:number,y:number,occupiedKey:null}}
 */
export function snap(mx, my) {
  return { x: mx, y: my, occupiedKey: null };
}

/**
 * Δ-Add: beim Hinzufügen eines Knotens; verbindet newNode mit allen bestehenden Knoten.
 * @param {Array<{x:number,y:number}>} oldNodes - bestehende Knoten vor Hinzufügen
 * @param {{x:number,y:number}} newNode - neu hinzugefügter Knoten
 * @returns {{removes:Array, adds:Array}} Deltas: keine Removes, nur Adds
 */
export function diffAdd(oldNodes, newNode) {
  const adds = oldNodes.map(n => ({ from: n, to: newNode }));
  return { removes: [], adds };
}

/**
 * Δ-Undo: beim Entfernen des zuletzt hinzugefügten Knotens; entfernt alle Kanten zwischen removedNode und jedem Vorgänger.
 * @param {Array<{x:number,y:number}>} oldNodes - bestehende Knoten nach Entfernen
 * @param {{x:number,y:number}} removedNode - der entfernte Knoten
 * @returns {{removes:Array, adds:Array}} Deltas: nur Removes
 */
export function diffUndo(oldNodes, removedNode) {
  const removes = oldNodes.map(n => ({ from: n, to: removedNode }));
  return { removes, adds: [] };
}

/**
 * Δ-Full: beim Topologie-Wechsel; baut den kompletten Complete Graph neu auf.
 * Externe Logik entfernt vorab alle alten Kanten.
 * @param {Array<{x:number,y:number}>} allNodes - alle aktuellen Knoten
 * @returns {{removes:Array, adds:Array}} Deltas: keine Removes, nur Adds
 */
export function diffFull(allNodes) {
  const adds = [];
  for (let i = 0; i < allNodes.length; i++) {
    for (let j = 0; j < i; j++) {
      adds.push({ from: allNodes[j], to: allNodes[i] });
    }
  }
  return { removes: [], adds };
}

/**
 * Initialisierung des Bottom-Controls-Panels für Complete Graph.
 * Da Complete Graph keine Parameter hat, wird das Panel ausgeblendet.
 * @param {HTMLElement} container
 * @param {Function} requestRedraw
 */
export function setupBottomControls(container, requestRedraw) {
  container.innerHTML = '';
  container.style.display = 'none';
}
