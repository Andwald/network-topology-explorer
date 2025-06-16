/**
 * Snap-Funktion für Path-Topologie: Klick-Koordinaten unverändert übernehmen.
 * @param {number} mx - Maus-X
 * @param {number} my - Maus-Y
 * @returns {{x:number, y:number, occupiedKey:null}}
 */
export function snap(mx, my) {
  return { x: mx, y: my, occupiedKey: null };
}

/**
 * Δ-Add: Beim Hinzufügen eines Knotens wird genau eine neue Kante
 * vom vorherigen letzten Knoten zum newNode erzeugt.
 * @param {Array<{x:number,y:number}>} oldNodes - bestehende Knoten vor Einfügen
 * @param {{x:number,y:number}} newNode - neu hinzugefügter Knoten
 * @returns {{removes:Array, adds:Array}}
 */
export function diffAdd(oldNodes, newNode) {
  const n = oldNodes.length;
  if (n === 0) {
    return { removes: [], adds: [] };
  }
  const last = oldNodes[n - 1];
  return {
    removes: [],
    adds: [{ from: last, to: newNode }]
  };
}

/**
 * Δ-Undo: Beim Entfernen des letzten Knotens wird die einzige Kante
 * vom vorherigen letzten Knoten zum removedNode entfernt.
 * @param {Array<{x:number,y:number}>} oldNodes - Zustand nach pop()
 * @param {{x:number,y:number}} removedNode - der entfernte Knoten
 * @returns {{removes:Array, adds:Array}}
 */
export function diffUndo(oldNodes, removedNode) {
  const n = oldNodes.length;
  if (n === 0) {
    return { removes: [], adds: [] };
  }
  const last = oldNodes[n - 1];
  return {
    removes: [{ from: last, to: removedNode }],
    adds: []
  };
}

/**
 * Δ-Full: Beim Topologie-Wechsel wird der gesamte Pfad
 * komplett neu aufgebaut, d.h. für jede aufeinanderfolgende Knot
 * paarweise eine Kante erstellt.
 * @param {Array<{x:number,y:number}>} allNodes - alle existierenden Knoten
 * @returns {{removes:Array, adds:Array}}
 */
export function diffFull(allNodes) {
  const adds = [];
  for (let i = 1; i < allNodes.length; i++) {
    adds.push({ from: allNodes[i - 1], to: allNodes[i] });
  }
  return { removes: [], adds };
}

/**
 * Setup für die Bottom-Controls bei dieser Topologie.
 * Da Path-Topologie keine Parameter hat, wird das Panel ausgeblendet.
 * @param {HTMLElement} container
 * @param {Function} requestRedraw
 */
export function setupBottomControls(container, requestRedraw) {
  container.innerHTML = '';
  container.style.display = 'none';
}
