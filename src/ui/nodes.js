import { nodes } from '../core/state.js';

/**
 * Zeichnet alle Knoten im Canvas.
 * @param {object} p - p5-Instanz
 */
export function drawNodes(p) {
  nodes.forEach((n, i) => {
    p.fill(n.color || '#6495ED');
    p.stroke(0);
    p.ellipse(n.x, n.y, 20, 20);
    if (n.label) {
      p.noStroke();
      p.fill(0);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(n.label, n.x, n.y);
    }
  });
}
