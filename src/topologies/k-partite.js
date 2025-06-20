import {
  kPartiteK,
  kPartiteMode,
  setKPartiteK,
  setKPartiteMode,
  bumpVersion
} from '../core/state.js';

/**
 * Bestimmt die Gruppe für einen Knoten-Index basierend auf Modus:
 * - ‚alternating‘: index % kPartiteK
 * - ‚onlyX‘: immer Gruppe X
 */
function getGroup(index) {
  if (kPartiteMode !== 'alternating') {
    const only = parseInt(kPartiteMode.replace('only', ''), 10);
    return isNaN(only) ? 0 : only;
  }
  return index % kPartiteK;
}

/**
 * Holt die Gruppe entweder aus node.group (bei Import) oder anhand des Index/Modus
 */
function getGroupForNode(node, index) {
  return node.group != null ? node.group : getGroup(index);
}

export function diffAdd(oldNodes, newNode) {
  const removes = [];
  const adds = [];
  const newIndex = oldNodes.length;
  const newGroup = getGroup(newIndex);
  newNode.group = newGroup;
  oldNodes.forEach((oldNode, idx) => {
    const oldGroup = getGroupForNode(oldNode, idx);
    if (oldGroup !== newGroup) {
      adds.push({ from: oldNode, to: newNode });
    }
  });
  return { removes, adds };
}

export function diffUndo(oldNodes, removedNode) {
  const removes = [];
  const adds = [];
  const remGroup = removedNode.group;
  oldNodes.forEach((oldNode, idx) => {
    const oldGroup = getGroupForNode(oldNode, idx);
    if (oldGroup !== remGroup) {
      removes.push({ from: oldNode, to: removedNode });
    }
  });
  return { removes, adds };
}

export function diffFull(allNodes) {
  const removes = [];
  const adds = [];
  allNodes.forEach((u, i) => {
    const gU = getGroupForNode(u, i);
    allNodes.forEach((v, j) => {
      if (j <= i) return;
      const gV = getGroupForNode(v, j);
      if (gU !== gV) adds.push({ from: u, to: v });
    });
  });
  return { removes, adds };
}

export function snap(mx, my) {
  return { x: mx, y: my, occupiedKey: null };
}

export function setupBottomControls(container, requestRedraw) {
  // Slider für k und Auswahl für Mode
  container.innerHTML = `
    <label for="kPartiteK"># of Parts (k):</label>
    <input type="range" id="kPartiteK" min="2" max="10" step="1" value="${kPartiteK}">
    <span id="kPartiteKVal">${kPartiteK}</span>
    <label for="kPartiteMode">Mode:</label>
    <select id="kPartiteMode"></select>
  `;
  const kSlider = container.querySelector('#kPartiteK');
  const kLabel  = container.querySelector('#kPartiteKVal');
  const modeSel = container.querySelector('#kPartiteMode');

  // Populate mode options dynamically based on k
  function buildModes() {
    modeSel.innerHTML = '';
    const alt = document.createElement('option');
    alt.value = 'alternating';
    alt.textContent = 'Alternating';
    modeSel.appendChild(alt);
    for (let i = 0; i < kPartiteK; i++) {
      const opt = document.createElement('option');
      opt.value = 'only' + i;
      opt.textContent = 'Only Group ' + String.fromCharCode(65 + i);
      modeSel.appendChild(opt);
    }
    modeSel.value = kPartiteMode;
  }
  buildModes();

  // Handlers
  kSlider.addEventListener('input', () => {
    kLabel.textContent = kSlider.value;
  });
  kSlider.addEventListener('change', () => {
    setKPartiteK(+kSlider.value);
    bumpVersion();
    buildModes();
    requestRedraw();
  });

  modeSel.addEventListener('change', () => {
    setKPartiteMode(modeSel.value);
    bumpVersion();
    requestRedraw();
  });
}
