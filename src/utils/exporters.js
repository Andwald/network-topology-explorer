/**
 * Berechnet die Bounding-Box aller Knoten und Kanten.
 * @param {Array<{x:number,y:number}>} nodesArr
 * @param {Array<{from:{x:number,y:number},to:{x:number,y:number}}>}>} edgesArr
 * @param {number} [padding=10]
 * @returns {{minX:number, minY:number, width:number, height:number}}
 */
export function computeBoundingBox(nodesArr, edgesArr, padding = 10) {
  const xs = nodesArr.map(n => n.x)
               .concat(edgesArr.flatMap(e => [e.from.x, e.to.x]));
  const ys = nodesArr.map(n => n.y)
               .concat(edgesArr.flatMap(e => [e.from.y, e.to.y]));
  const minX = Math.min(...xs) - padding;
  const minY = Math.min(...ys) - padding;
  const maxX = Math.max(...xs) + padding;
  const maxY = Math.max(...ys) + padding;
  return { minX, minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Exportiert den PNG-Auschnitt eines Canvas basierend auf Bounding-Box.
 * @param {HTMLCanvasElement} canvas - Original-Canvas
 * @param {number} minX
 * @param {number} minY
 * @param {number} width
 * @param {number} height
 */
export function downloadPNG(canvas, minX, minY, width, height) {
  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  const ctx = off.getContext('2d');
  ctx.drawImage(
    canvas,
    minX,
    minY,
    width,
    height,
    0,
    0,
    width,
    height
  );
  off.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'topology.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

/**
 * Exportiert den aktuellen Graphen als SVG.
 * @param {Array<{x:number,y:number}>} nodesArr
 * @param {Array<{from:{x:number,y:number},to:{x:number,y:number}}>}>} edgesArr
 * @param {number} [padding=10]
 */
export function downloadSVG(nodesArr, edgesArr, padding = 10) {
  const { minX, minY, width, height } = computeBoundingBox(nodesArr, edgesArr, padding);
  const w = width + 2 * padding;
  const h = height + 2 * padding;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${minX - padding} ${minY - padding} ${w} ${h}">`;
  // Kanten
  edgesArr.forEach(e => {
    svg += `<line x1="${e.from.x}" y1="${e.from.y}" x2="${e.to.x}" y2="${e.to.y}" stroke="#646464" stroke-width="1"/>`;
  });
  // Knoten
  nodesArr.forEach(n => {
    svg += `<circle cx="${n.x}" cy="${n.y}" r="10" fill="#6495ED" stroke="#000" stroke-width="1"/>`;
  });
  svg += `</svg>`;
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'topology.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
