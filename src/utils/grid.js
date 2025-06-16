
/**
 * Rundet eine Position auf den nächsten Grid-Slot.
 * @param {number} x - Pixel-X
 * @param {number} y - Pixel-Y
 * @param {number} gridSize - Zellgröße in Pixeln
 * @returns {{x:number,y:number,key:string}}
 */
export function snapToGrid(x, y, gridSize) {
  const col = Math.round(x / gridSize);
  const row = Math.round(y / gridSize);
  return {
    x: col * gridSize,
    y: row * gridSize,
    key: `${col},${row}`
  };
}

/**
 * Setzt alle Knoten auf ihre Grid-Positionen zurück.
 * @param {Array<object>} nodes - Array von Knoten-Objekten ({x,y})
 * @param {number} gridSize
 */
export function updateGridNodePositions(nodes, gridSize) {
  const occupied = {};
  for (let n of nodes) {
    const { x, y, key } = snapToGrid(n.x, n.y, gridSize);
    if (!occupied[key]) {
      n.x = x;
      n.y = y;
      occupied[key] = true;
    } else {
      // Bei Kollision einfach überlappen lassen
      n.x = x;
      n.y = y;
    }
  }
}

