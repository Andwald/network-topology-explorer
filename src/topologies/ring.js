/**
 * Berechnet die Kanten-Deltas beim Hinzufügen eines neuen Knotens im Ring.
 * Entfernt die Verbindung zwischen letztem und erstem Knoten,
 * fügt die Kanten last→newNode und newNode→first hinzu.
 * @param {Array<{x:number,y:number}>} oldNodes - vorhandene Knoten vor dem Hinzufügen
 * @param {{x:number,y:number}} newNode - neu hinzugefügter Knoten
 * @returns {{removes:Array<{from:{x:number,y:number},to:{x:number,y:number}}>, adds:Array<{from:{x:number,y:number},to:{x:number,y:number}}>}>}
 */
export function diffAdd(oldNodes, newNode) {
  const n = oldNodes.length;
  if (n < 1) {
    return { removes: [], adds: [] };
  }
  const first = oldNodes[0];
  const last  = oldNodes[n - 1];
  return {
    removes: [
      { from: last, to: first }
    ],
    adds: [
      { from: last,    to: newNode },
      { from: newNode, to: first   }
    ]
  };
}

/**
 * Berechnet die Kanten-Deltas beim Rückgängig-Machen (Undo) im Ring.
 * Entfernt die Verbindungen last→removedNode und removedNode→first,
 * fügt anschließend wieder die Verbindung last→first hinzu.
 * @param {Array<{x:number,y:number}>} oldNodes - verbleibende Knoten nach dem Entfernen
 * @param {{x:number,y:number}} removedNode - entfernte Knoteninstanz
 * @returns {{removes:Array<{from:{x:number,y:number},to:{x:number,y:number}}>, adds:Array<{from:{x:number,y:number},to:{x:number,y:number}}>}>}
 */
export function diffUndo(oldNodes, removedNode) {
  const n = oldNodes.length;
  if (n < 1) {
    return { removes: [], adds: [] };
  }
  const first = oldNodes[0];
  const last  = oldNodes[n - 1];
  return {
    removes: [
      { from: last,        to: removedNode },
      { from: removedNode, to: first       }
    ],
    adds: [
      { from: last, to: first }
    ]
  };
}

/**
 * Berechnet alle Kanten für einen vollständigen Ring.
 * Wird beim Topologie-Wechsel für einen Neustart verwendet.
 * Da das zentrale Entfernen aller Kanten schon erfolgt ist, werden hier
 * nur die Adds zurückgegeben.
 * @param {Array<{x:number,y:number}>} allNodes - alle aktuellen Knoten
 * @returns {{removes:Array, adds:Array<{from:{x:number,y:number},to:{x:number,y:number}}>}>}
 */
export function diffFull(allNodes) {
  const adds = [];
  const n = allNodes.length;
  for (let i = 0; i < n; i++) {
    adds.push({
      from: allNodes[i],
      to:   allNodes[(i + 1) % n]
    });
  }
  return {
    removes: [],
    adds
  };
}

/**
 * Snap-Funktion für Ring-Topologie: Klick-Koordinaten unverändert übernehmen.
 * @param {number} mx - Maus-X
 * @param {number} my - Maus-Y
 * @returns {{x:number,y:number,occupiedKey:null}}
 */
export function snap(mx, my) {
  return { x: mx, y: my, occupiedKey: null };
}

/**
 * Deaktiviert das Bottom-Controls-Panel für die Ring-Topologie.
 * @param {HTMLElement} container - Container-Element der Bottom-Controls
 * @param {Function} requestRedraw - Callback, um das Canvas neu zu zeichnen
 */
export function setupBottomControls(container, requestRedraw) {
  container.innerHTML = '';
  container.style.display = 'none';
}
