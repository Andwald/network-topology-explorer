import { randomParents } from '../core/state.js';

/**
 * Snap-Funktion für Random Tree: Klick-Koordinaten unverändert übernehmen.
 * @param {number} mx - Maus-X
 * @param {number} my - Maus-Y
 * @returns {{x:number,y:number,occupiedKey:null}}
 */
export function snap(mx, my) {
  return { x: mx, y: my, occupiedKey: null };
}

/**
 * Δ-Add: Beim Hinzufügen wähle einen zufälligen Parent < oldNodes.length
 * und speichere dessen Index in randomParents.
 * @param {Array} oldNodes
 * @param {object} newNode
 * @returns {{removes:Array, adds:Array}}
 */
export function diffAdd(oldNodes, newNode) {
  const i = oldNodes.length;
  if (i === 0) {
    randomParents.push(null);
    return { removes: [], adds: [] };
  }
  const pIdx = Math.floor(Math.random() * i);
  randomParents.push(pIdx);
  return {
    removes: [], 
    adds: [{ from: oldNodes[pIdx], to: newNode }]
  };
}

/**
 * Δ-Undo: Entfernt beim Zurücknehmen genau diejenige Kante,
 * die beim diffAdd erzeugt wurde.
 * @param {Array} oldNodes - Zustand nach nodes.pop(), also ohne removedNode
 * @param {object} removedNode
 * @returns {{removes:Array, adds:Array}}
 */
export function diffUndo(oldNodes, removedNode) {
  // hole und entferne den letzten Parent-Index
  const pIdx = randomParents.pop();
  if (pIdx == null) {
    return { removes: [], adds: [] };
  }
  return {
    removes: [{ from: oldNodes[pIdx], to: removedNode }],
    adds: []
  };
}

/**
 * Δ-Full: Beim Topologie-Wechsel baue den gesamten Random-Tree neu auf.
 * Für jeden Knoten i>0 wähle einen neuen zufälligen Parent < i.
 * @param {Array} allNodes
 * @returns {{removes:Array, adds:Array}}
 */
export function diffFull(allNodes) {
  // lösche vorher extern alle Kanten
  const adds = [];
  // reset randomParents komplett
  randomParents.length = 0;
  allNodes.forEach((_, i) => {
    if (i === 0) {
      randomParents.push(null);
    } else {
      const pIdx = Math.floor(Math.random() * i);
      randomParents.push(pIdx);
      adds.push({ from: allNodes[pIdx], to: allNodes[i] });
    }
  });
  return { removes: [], adds };
}

/**
 * Kein Bottom-Panel nötig.
 */
export function setupBottomControls(container, requestRedraw) {
  container.innerHTML = '';
  container.style.display = 'none';
}
