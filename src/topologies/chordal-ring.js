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
 * - Wenn sich c nicht ändert: nur lokale Ring- und Chord-Deltas
 * - Sonst: kompletter Rebuild (alle alten Kanten entfernen + alle neu berechnen)
 *
 * @param {Array<object>} oldNodes   Bestehende Knoten (Länge = n)
 * @param {object}        newNode    Neu hinzugefügter Knoten (Index n)
 * @returns {{removes:Array, adds:Array}}
 */
export function diffAdd(oldNodes, newNode) {
  const n = oldNodes.length;
  if (n < 1) {
    // erster Knoten → nichts zu tun
    return { removes: [], adds: [] };
  }

  // alter und neuer chord-Schritt
  const oldC = Math.max(2, Math.ceil(n     / chordThreshold));
  const newC = Math.max(2, Math.ceil((n+1) / chordThreshold));

  // === FALL A: Schritt bleibt gleich → nur lokale Updates ===
  if (oldC === newC) {
    const first     = oldNodes[0];
    const last      = oldNodes[n - 1];
    const M         = n + 1;      // neue Gesamtzahl
    const c         = oldC;
    const removes   = [];
    const adds      = [];

    // 1) Ring: letzte Ring-Kante löschen, und Ring um den neuen Knoten erweitern
    removes.push({ from: last, to: first });
    adds.push(
      { from: last,    to: newNode },
      { from: newNode, to: first   }
    );

    // 2) Alte Chord-Kanten von ‚last‘ entfernen (maximal n Stück)
    const chordCount = Math.min(c, n);
    for (let i = 1; i <= chordCount; i++) {
      const uIdx = n - i;                         // immer 0 ≤ uIdx < n
      const vIdx = (uIdx + c + 1) % (n + 1);      // im Ring mit neuem Knoten
      const u = oldNodes[uIdx];
      const v = (vIdx < n ? oldNodes[vIdx] : newNode);
      removes.push({ from: u, to: v });
    }

    // 3) Neue Chord-Kanten, die ‚newNode‘ betreffen:
    // for i=1..c: Kante (n-(i-1)) → (n-(i-1) + c) % M hinzufügen
    for (let i = 1; i <= c; i++) {
      const uIdx = n - (i - 1);
      const vIdx = (uIdx + c) % M;
      const u = (uIdx < n ? oldNodes[uIdx] : newNode);
      const v = (vIdx < n ? oldNodes[vIdx] : newNode);
      adds.push({ from: u, to: v });
    }

    // 4) Chord-Kante zur newNode einzeln
    const u = (c < n ? oldNodes[n-c] : first);
    adds.push({from:u, to:newNode})

    return { removes, adds };
  }

  // === FALL B: Schritt ändert sich → kompletter Rebuild ===
  return {
    removes: dynamicChordalEdges(oldNodes),
    adds:    dynamicChordalEdges(oldNodes.concat(newNode))
  };
}

/**
 * Δ-Undo: berechnet die Kanten-Deltas beim Rückgängigmachen
 * des zuletzt hinzugefügten Knotens (removedNode).
 * - Wenn sich c nicht ändert: nur lokale Ring- und Chord-Deltas
 * - Sonst: kompletter Rebuild (alle alten Kanten entfernen + alle neu berechnen)
 *
 * @param {Array<object>} oldNodes     Knoten **nach** dem Entfernen (Länge = n)
 * @param {object}        removedNode  der entfernte Knoten (ursprünglich an Index n)
 * @returns {{removes:Array, adds:Array}}
 */
export function diffUndo(oldNodes, removedNode) {
  const n = oldNodes.length;
  const m = n + 1;             // Zustand vor dem Entfernen
  if (m < 2) {
    // nur 0 oder 1 Knoten insgesamt → nix zu tun
    return { removes: [], adds: [] };
  }

  // alter und neuer Chord-Schritt
  const oldC = Math.max(2, Math.ceil(m     / chordThreshold));
  const newC = Math.max(2, Math.ceil(n     / chordThreshold));

  // === FALL A: Schritt bleibt gleich → nur lokale Updates ===
  if (oldC === newC) {
    const first   = oldNodes[0];
    const last    = oldNodes[n - 1];
    const c       = oldC;
    const removes = [];
    const adds    = [];

    // 1) Ring-Delta: alte Ring-Kanten via removedNode löschen, neuen Ring schließen
    removes.push(
      { from: last,        to: removedNode },
      { from: removedNode, to: first       }
    );
    adds.push({ from: last, to: first });

    // 2) Alte Chord-Kanten, die removedNode betreffen, löschen
    //    (im Graph mit m Knoten)
    {
      const full = oldNodes.concat(removedNode);
      dynamicChordalEdges(full)
        .filter(e => e.from === removedNode || e.to === removedNode)
        .forEach(e => removes.push(e));
    }

    // 3) Neue Chord-Kanten, die first oder last betreffen,
    //    im Graph mit n Knoten (ohne removedNode) nach dem Pop
    {
      dynamicChordalEdges(oldNodes)
        .filter(e =>
          e.from === first  || e.to === first ||
          e.from === last   || e.to === last
        )
        .forEach(e => adds.push(e));
    }

    return { removes, adds };
  }

  // === FALL B: Schritt hat sich geändert → kompletter Rebuild ===
  return {
    removes: dynamicChordalEdges(oldNodes.concat(removedNode)),
    adds:    dynamicChordalEdges(oldNodes)
  };
}

/**
 * Δ-Full: kompletter Neuaufbau beim Topologie-Wechsel.
 * Externe Logik entfernt vorab alle alten Kanten, hier nur Adds.
 * @param {Array<{x:number,y:number}>} allNodes Alle aktuellen Knoten
 * @returns {{removes:Array, adds:Array}}
 */
export function diffFull(allNodes) {
  return { removes: [], adds: dynamicChordalEdges(allNodes) };
}

/**
 * Initialisierung des Bottom-Control-Panels für Chordal Ring.
 * @param {HTMLElement} container
 * @param {Function} requestRedraw
 */
export function setupBottomControls(container, requestRedraw) {
  container.innerHTML = `
    <label for="chordThreshold">Max Hops:</label>
    <input
      type="range"
      id="chordThreshold"
      min="2"
      max="50"
      step="1"
      value="${chordThreshold}"
    >
    <span id="chordThresholdVal">${chordThreshold}</span>
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
