/**
 * Hilfsfunktion: berechnet alle Kanten des Gabriel-Graphen für ein Node-Array.
 * Ein Paar (i,j) ist verbunden, wenn kein anderer Knoten im Kreis mit Durchmesser ij liegt.
 * @param {Array<{x:number,y:number}>} nodesArr
 * @returns {Array<{from:{x:number,y:number},to:{x:number,y:number}}>}
 */
function computeGabrielEdges(nodesArr) {
  const edges = [];
  const N = nodesArr.length;
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const a = nodesArr[i];
      const b = nodesArr[j];
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const r2 = ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) / 4;
      let ok = true;
      for (let k = 0; k < N; k++) {
        if (k === i || k === j) continue;
        const c = nodesArr[k];
        const dx = c.x - mx;
        const dy = c.y - my;
        if (dx * dx + dy * dy < r2) {
          ok = false;
          break;
        }
      }
      if (ok) edges.push({ from: a, to: b });
    }
  }
  return edges;
}

/**
 * Δ-Add: beim Hinzufügen eines Knotens
 * - Entfernt alle Kanten des Gabriel-Graphen ohne newNode
 * - Fügt alle Kanten des Gabriel-Graphen mit newNode hinzu
 * @param {Array<{x:number,y:number}>} oldNodes 
 * @param {{x:number,y:number}} newNode 
 * @returns {{removes:Array, adds:Array}}
 */
export function diffAdd(oldNodes, newNode) {
  const prev = computeGabrielEdges(oldNodes);
  const next = computeGabrielEdges([...oldNodes, newNode]);
  return {
    removes: prev,
    adds:    next
  };
}

/**
 * Δ-Undo: beim Entfernen des zuletzt hinzugefügten Knotens
 * - Entfernt alle Kanten des Gabriel-Graphen inkl. removedNode
 * - Fügt alle Kanten des Gabriel-Graphen ohne removedNode wieder hinzu
 * @param {Array<{x:number,y:number}>} oldNodes     Zustand nach dem Entfernen
 * @param {{x:number,y:number}} removedNode        der entfernte Knoten
 * @returns {{removes:Array, adds:Array}}
 */
export function diffUndo(oldNodes, removedNode) {
  const full = computeGabrielEdges([...oldNodes, removedNode]);
  const prev = computeGabrielEdges(oldNodes);
  return {
    removes: full,
    adds:    prev
  };
}

/**
 * Δ-Full: beim Topologie-Wechsel
 * - Fügt alle Kanten des Gabriel-Graphen für alle vorhandenen Knoten hinzu
 * (removes wird extern bereits vollzogen)
 * @param {Array<{x:number,y:number}>} allNodes 
 * @returns {{removes:Array, adds:Array}}
 */
export function diffFull(allNodes) {
  return {
    removes: [],
    adds:    computeGabrielEdges(allNodes)
  };
}

/**
 * Snap-Funktion für Gabriel-Graph: Klick-Koordinaten unverändert übernehmen.
 * @param {number} mx - Maus-X
 * @param {number} my - Maus-Y
 * @returns {{x:number,y:number,occupiedKey:null}}
 */
export function snap(mx, my) {
  return { x: mx, y: my, occupiedKey: null };
}

/**
 * Setup für die Bottom-Controls bei dieser Topologie.
 * Da Gabriel-Graph keine Parameter hat, wird das Panel ausgeblendet.
 * @param {HTMLElement} container
 * @param {Function} requestRedraw
 */
export function setupBottomControls(container, requestRedraw) {
  container.innerHTML = '';
  container.style.display = 'none';
}
