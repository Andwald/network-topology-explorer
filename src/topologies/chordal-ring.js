import {
  chordThreshold,
  setChordThreshold,
  bumpVersion
} from '../core/state.js';

/**
 * Snap-Funktion für Dynamic Chordal Ring: Klick-Koordinaten unverändert übernehmen.
 * @param {number} mx Maus-X
 * @param {number} my Maus-Y
 * @returns {{x:number,y:number,occupiedKey:null}}
 */
export function snap(mx, my) {
  return { x: mx, y: my, occupiedKey: null };
}

/**
 * Baut alle Ring- und Chord-Kanten für ein Node-Array.
 * @param {Array<{x:number,y:number}>} nodesArr
 * @returns {Array<{from:{x:number,y:number},to:{x:number,y:number}}>}
 */
function dynamicChordalEdges(nodesArr) {
  const edges = [];
  const n = nodesArr.length;
  if (n < 2) return edges;
  // Ring
  for (let i = 0; i < n; i++) {
    edges.push({ from: nodesArr[i], to: nodesArr[(i + 1) % n] });
  }
  // Chords
  const c = Math.max(2, Math.ceil(n / chordThreshold));
  for (let i = 0; i < n; i++) {
    edges.push({ from: nodesArr[i], to: nodesArr[(i + c) % n] });
  }
  return edges;
}

/**
 * Δ-Add: berechnet die Kanten-Deltas beim Hinzufügen von newNode.
 * - Wenn sich c nicht ändert: lokale Updates
 * - Sonst: kompletter Rebuild
 *
 * @param {Array<object>} oldNodes   Bestehende Knoten
 * @param {object}        newNode    Neu hinzugefügter Knoten
 * @returns {{removes:Array, adds:Array}}
 */
export function diffAdd(oldNodes, newNode) {
  const n = oldNodes.length;
  if (n < 1) {
    return { removes: [], adds: [] };
  }
  const oldC = Math.max(2, Math.ceil(n     / chordThreshold));
  const newC = Math.max(2, Math.ceil((n + 1) / chordThreshold));
  if (oldC === newC) {
    const first   = oldNodes[0];
    const last    = oldNodes[n - 1];
    const M       = n + 1;
    const c       = oldC;
    const removes = [];
    const adds    = [];

    // 1) Ring: Schließe den Ring um newNode
    removes.push({ from: last, to: first });
    adds.push(
      { from: last,    to: newNode },
      { from: newNode, to: first   }
    );

    // 2) Alte Chord-Kanten, die neue Schritt-Stellen betreffen
    const chordCount = Math.min(c, n);
    for (let i = 1; i <= chordCount; i++) {
      const uIdx = n - i;
      const vIdx = (uIdx + c + 1) % (n + 1);
      const u = oldNodes[uIdx];
      const v = (vIdx < n ? oldNodes[vIdx] : newNode);
      removes.push({ from: u, to: v });
    }

    // 3) Neue Chord-Kanten durch newNode und umliegende
    for (let i = 1; i <= c; i++) {
      const uIdx = n - (i - 1);
      const vIdx = (uIdx + c) % M;
      const u = (uIdx < n ? oldNodes[uIdx] : newNode);
      const v = (vIdx < n ? oldNodes[vIdx] : newNode);
      adds.push({ from: u, to: v });
    }

    // Zusätzliche Chord-Kante für newNode
    const u0 = (c < n ? oldNodes[n - c] : first);
    adds.push({ from: u0, to: newNode });

    return { removes, adds };
  }

  // vollständiger Rebuild bei c-Änderung
  return {
    removes: dynamicChordalEdges(oldNodes),
    adds:    dynamicChordalEdges(oldNodes.concat(newNode))
  };
}

/**
 * Δ-Undo: invertiert diffAdd, um beim Rückgängigmachen
 * genau die beim Add entfernten/ hinzugefügten Kanten umzukehren.
 *
 * @param {Array<object>} oldNodes    Knoten **nach** Entfernen
 * @param {object}        removedNode der entfernte Knoten
 * @returns {{removes:Array, adds:Array}}
 */
export function diffUndo(oldNodes, removedNode) {
  const { removes: wasRemoved, adds: wasAdded } = diffAdd(oldNodes, removedNode);
  return {
    // entferne alle Kanten, die beim Add hinzugefügt wurden
    removes: wasAdded,
    // füge alle Kanten wieder hinzu, die beim Add entfernt wurden
    adds: wasRemoved
  };
}

/**
 * Δ-Full: kompletter Neuaufbau beim Topologie-Wechsel.
 */
export function diffFull(allNodes) {
  return { removes: [], adds: dynamicChordalEdges(allNodes) };
}

/**
 * Initialisierung des Bottom-Control-Panels für Chordal Ring.
 */
export function setupBottomControls(container, requestRedraw) {
  container.innerHTML = `
    <label for=\"chordThreshold\">Max Hops:</label>
    <input
      type=\"range\" id=\"chordThreshold\" min=\"2\" max=\"50\" step=\"1\" value=\"${chordThreshold}\"
    >
    <span id=\"chordThresholdVal\">${chordThreshold}</span>
  `;
  const slider = container.querySelector('#chordThreshold');
  const label  = container.querySelector('#chordThresholdVal');
  slider.addEventListener('input', () => {
    label.textContent = slider.value;
  });
  slider.addEventListener('change', () => {
    setChordThreshold(+slider.value);
    bumpVersion();
    requestRedraw();
  });
}
