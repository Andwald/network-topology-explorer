/**
 * Zeichnet einen einfachen Hinweis im Canvas.
 * @param {object} p - p5-Instanz
 */
export function drawHint(p) {
  p.noStroke();
  p.fill(0);
  p.textAlign(p.LEFT, p.TOP);
  p.text('Click on the canvas to add nodes.', 10, 10);
}