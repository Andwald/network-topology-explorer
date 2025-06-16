/**
 * Snap-Funktion für Nearest Neighbor Tree (NNT):
 * Klick-Koordinaten unverändert übernehmen.
 * @param {number} mx - Maus-X
 * @param {number} my - Maus-Y
 * @returns {{x:number, y:number, occupiedKey:null}}
 */
export function snap(mx, my) {
  return { x: mx, y: my, occupiedKey: null };
}

/**
 * Δ-Add: Berechnet die eine neue Kante, die entsteht,
 * wenn newNode dem nächsten Vorgänger aus oldNodes angehängt wird.
 * @param {Array<{x:number,y:number}>} oldNodes - bestehende Knoten
 * @param {{x:number,y:number}} newNode - neu hinzugefügter Knoten
 * @returns {{removes:Array, adds:Array}}
 */
export function diffAdd(oldNodes, newNode) {
  const n = oldNodes.length;
  if (n === 0) {
    return { removes: [], adds: [] };
  }
  // Finde den nächsten Vorgänger
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < n; i++) {
    const dx = newNode.x - oldNodes[i].x;
    const dy = newNode.y - oldNodes[i].y;
    const d = Math.hypot(dx, dy);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return {
    removes: [],
    adds: [ { from: oldNodes[bestIdx], to: newNode } ]
  };
}

/**
 * Δ-Undo: Berechnet die eine Kante, die entfernt wird,
 * wenn removedNode zurückgenommen wird.
 * @param {Array<{x:number,y:number}>} oldNodes - Zustand nach dem Entfernen
 * @param {{x:number,y:number}} removedNode - der entfernte Knoten
 * @returns {{removes:Array, adds:Array}}
 */
export function diffUndo(oldNodes, removedNode) {
  // Dieselbe Logik wie diffAdd, aber zur Removal-Liste
  const { adds } = diffAdd(oldNodes, removedNode);
  return { removes: adds, adds: [] };
}

/**
 * Δ-Full: Beim Topologie-Wechsel alle Kanten des gesamten Baums
 * neu berechnen (jeweils greedy nearest).
 * @param {Array<{x:number,y:number}>} allNodes - alle existierenden Knoten
 * @returns {{removes:Array, adds:Array}}
 */
export function diffFull(allNodes) {
  const adds = [];
  const built = [];
  for (const node of allNodes) {
    const { adds: newAdds } = diffAdd(built, node);
    adds.push(...newAdds);
    built.push(node);
  }
  return { removes: [], adds };
}

/**
 * Setup für die Bottom-Controls bei dieser Topologie.
 * Da NNT keine Parameter hat, wird das Panel ausgeblendet.
 * @param {HTMLElement} container
 * @param {Function} requestRedraw
 */
export function setupBottomControls(container, requestRedraw) {
  container.innerHTML = '';
  container.style.display = 'none';
}
