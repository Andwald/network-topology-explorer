// Import der Delaunator-Bibliothek als ES-Modul
import Delaunator from 'https://esm.sh/delaunator@5.0.0';

/**
 * Snap-Funktion für Delaunay-Topologie: passt Klick-Koordinaten nicht an.
 * @param {number} mx - Maus-X
 * @param {number} my - Maus-Y
 * @returns {{x:number,y:number,occupiedKey:null}}
 */
export function snap(mx, my) {
  return { x: mx, y: my, occupiedKey: null };
}

/**
 * Hilfsfunktion: berechnet Delaunay-Kanten für beliebiges Node-Array.
 * @param {Array<{x:number,y:number}>} nodesArr
 * @returns {Array<{from:{x:number,y:number},to:{x:number,y:number}}>}
 */
function computeAllEdges(nodesArr) {
  if (nodesArr.length < 3) return [];
  const points = nodesArr.map(n => [n.x, n.y]);
  const delaunay = Delaunator.from(points);

  const edgeKeys = new Set();
  const { triangles } = delaunay;
  for (let i = 0; i < triangles.length; i += 3) {
    const [i0, i1, i2] = [triangles[i], triangles[i+1], triangles[i+2]];
    [[i0, i1], [i1, i2], [i2, i0]].forEach(([a, b]) => {
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      edgeKeys.add(key);
    });
  }

  return Array.from(edgeKeys).map(key => {
    const [a, b] = key.split(',').map(Number);
    return { from: nodesArr[a], to: nodesArr[b] };
  });
}

/**
 * Δ-Full: beim Topologie-Wechsel oder initialem Aufbau alle Delaunay-Kanten neu berechnen.
 * @param {Array<{x:number,y:number}>} allNodes - aktuelles Node-Array
 * @returns {{removes:Array, adds:Array}}
 */
export function diffFull(allNodes) {
  const adds = computeAllEdges(allNodes);
  return { removes: [], adds };
}

/**
 * Δ-Add: beim Hinzufügen eines Knotens alle alten Kanten entfernen
 * und die neuen Delaunay-Kanten für oldNodes+newNode aufbauen.
 * @param {Array<{x:number,y:number}>} oldNodes - Knoten vor Einfügen
 * @param {{x:number,y:number}} newNode - neu hinzugefügter Knoten
 * @returns {{removes:Array, adds:Array}}
 */
export function diffAdd(oldNodes, newNode) {
  const fullOld = computeAllEdges(oldNodes);
  const withNew = computeAllEdges([...oldNodes, newNode]);
  return { removes: fullOld, adds: withNew };
}

/**
 * Δ-Undo: beim Entfernen eines Knotens alle Kanten des vollen Sets
 * entfernen und die Delaunay-Kanten für oldNodes neu aufbauen.
 * @param {Array<{x:number,y:number}>} oldNodes - Knoten nach Entfernen
 * @param {{x:number,y:number}} removedNode - der entfernte Knoten
 * @returns {{removes:Array, adds:Array}}
 */
export function diffUndo(oldNodes, removedNode) {
  const fullBefore = computeAllEdges([...oldNodes, removedNode]);
  const fullAfter  = computeAllEdges(oldNodes);
  return { removes: fullBefore, adds: fullAfter };
}

/**
 * Setup für die Bottom-Controls bei dieser Topologie.
 * Da Delaunay keine Parameter hat, wird das Panel ausgeblendet.
 * @param {HTMLElement} container
 * @param {Function} requestRedraw
 */
export function setupBottomControls(container, requestRedraw) {
  container.innerHTML = '';
  container.style.display = 'none';
}
