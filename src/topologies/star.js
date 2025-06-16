/**
 * Snap-Funktion für Star-Topologie: Klick-Koordinaten unverändert übernehmen.
 * @param {number} mx - Maus-X
 * @param {number} my - Maus-Y
 * @returns {{x:number,y:number,occupiedKey:null}}
 */
export function snap(mx, my) {
  return { x: mx, y: my, occupiedKey: null };
}

/**
 * Δ-Add: Beim Hinzufügen eines newNode wird genau eine Kante vom Hub (erstes Element) zu newNode erzeugt.
 * @param {Array<{x:number,y:number}>} oldNodes - bestehende Knoten vor dem Einfügen
 * @param {{x:number,y:number}} newNode - gerade hinzugefügter Knoten
 * @returns {{removes:Array, adds:Array}}
 */
export function diffAdd(oldNodes, newNode) {
  if (oldNodes.length === 0) {
    // Erster Knoten wird Hub, keine Kante
    return { removes: [], adds: [] };
  }
  const hub = oldNodes[0];
  return {
    removes: [],
    adds: [{ from: hub, to: newNode }]
  };
}

/**
 * Δ-Undo: Entfernt beim Rückgängigmachen exakt die Kante Hub→removedNode.
 * @param {Array<{x:number,y:number}>} oldNodes - Zustand nach nodes.pop(), also ohne removedNode
 * @param {{x:number,y:number}} removedNode - gerade entfernter Knoten
 * @returns {{removes:Array, adds:Array}}
 */
export function diffUndo(oldNodes, removedNode) {
  if (oldNodes.length === 0) {
    return { removes: [], adds: [] };
  }
  const hub = oldNodes[0];
  return {
    removes: [{ from: hub, to: removedNode }],
    adds: []
  };
}

/**
 * Δ-Full: Beim Topologie-Wechsel wird der komplette Star neu aufgebaut:
 * Hub (erstes Element) verbindet sich mit allen anderen Knoten.
 * @param {Array<{x:number,y:number}>} allNodes - alle aktuellen Knoten
 * @returns {{removes:Array, adds:Array}}
 */
export function diffFull(allNodes) {
  const adds = [];
  if (allNodes.length < 2) {
    return { removes: [], adds };
  }
  const hub = allNodes[0];
  for (let i = 1; i < allNodes.length; i++) {
    adds.push({ from: hub, to: allNodes[i] });
  }
  return { removes: [], adds };
}

/**
 * Setup für die Bottom-Controls bei dieser Topologie.
 * Da Star-Topologie keine Parameter hat, wird das Panel ausgeblendet.
 * @param {HTMLElement} container
 * @param {Function} requestRedraw
 */
export function setupBottomControls(container, requestRedraw) {
  container.innerHTML = '';
  container.style.display = 'none';
}
