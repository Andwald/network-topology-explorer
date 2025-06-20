/**
 * Initialisiert die UI-Controls und bindet Callback-Funktionen.
 * @param {object} callbacks - Funktionen für UI-Interaktionen
 */
export function setupControls({
  onSelectTopology,
  onSelectAlgorithm,
  onStepBack,
  onReset,
  onExportJSON,
  onImportJSON,
  onExportPng,
  onExportSvg,
  onApplyAlgorithm
}) {
  // Verstecktes File-Input für Import
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) onImportJSON(file);
    e.target.value = '';
  });
  document.body.appendChild(fileInput);

  // Buttons
  document.getElementById('stepBackBtn').addEventListener('click', onStepBack);
  document.getElementById('resetBtn').addEventListener('click', onReset);
  document.getElementById('exportBtn').addEventListener('click', onExportJSON);
  document.getElementById('importBtn').addEventListener('click', () => fileInput.click());
  document.getElementById('exportPngBtn').addEventListener('click', onExportPng);
  document.getElementById('exportSvgBtn').addEventListener('click', onExportSvg);
  document.getElementById('applyAlgoBtn').addEventListener('click', onApplyAlgorithm);

    // ─── Topology-Icons ────────────────────────────────────────
  const topoItems = [
    { key: 'ring',          icon: 'icons/ring.svg',           label: 'Ring' },
    { key: 'wheel',         icon: 'icons/wheel.svg',          label: 'Wheel' },
    { key: 'path',          icon: 'icons/path.svg',           label: 'Path' },
    { key: 'star',          icon: 'icons/star.svg',           label: 'Star' },
    { key: 'ladder',        icon: 'icons/ladder.svg',         label: 'Ladder Graph' },
    { key: 'k-partite',     icon: 'icons/k-partite.svg',      label: 'k-Partite Graph' },
    { key: 'complete',      icon: 'icons/complete.svg',       label: 'Complete' },
    { key: 'binary-tree',   icon: 'icons/binary-tree.svg',    label: 'Binary Tree' },
    { key: 'k-ary-tree', icon: 'icons/k-ary-tree.svg', label: 'k-ary Tree' },
    { key: 'random-tree',   icon: 'icons/random-tree.svg',    label: 'Random Tree' },
    { key: 'nnt',           icon: 'icons/nnt.svg',            label: 'Nearest Neighbor Tree' },
    { key: 'emst',          icon: 'icons/emst.svg',           label: 'EMST' },
    { key: 'delaunay',      icon: 'icons/delaunay.svg',       label: 'Delaunay' },
    { key: 'gabriel',       icon: 'icons/gabriel.svg',        label: 'Gabriel' },
    { key: 'rng',           icon: 'icons/rng.svg',            label: 'RNG' },
    { key: 'gg',            icon: 'icons/gg.svg',             label: 'Geometric Graph' },
    { key: 'chordal-ring',  icon: 'icons/chordal-ring.svg',   label: 'Chordal Ring' },
    { key: 'grid',          icon: 'icons/grid.svg',           label: 'Grid Graph' }
  ];
  const topoGrid = document.getElementById('topo-grid');
  topoGrid.innerHTML = ''; // vorher leeren
  topoItems.forEach(item => {
    const img = document.createElement('img');
    img.src       = item.icon;
    img.alt       = item.label;
    img.title     = item.label;
    img.dataset.topo = item.key;
    img.addEventListener('click', () => {
      document.querySelectorAll('#topo-grid img').forEach(i => i.classList.remove('selected'));
      img.classList.add('selected');
      onSelectTopology(item.key);
    });
    topoGrid.appendChild(img);
  });
  // Erstselektion Ring
  document
    .querySelector('#topo-grid img[data-topo="ring"]')
    .classList.add('selected');

  // ─── Algorithm-Icons ───────────────────────────────────────
  const algoItems = [
    { key: 'nearest',   icon: 'icons/nearest.svg',   label: 'Nearest' },
    { key: '2-nearest', icon: 'icons/2nearest.svg',  label: '2-Nearest' },
    { key: 'random',    icon: 'icons/random.svg',    label: 'Random' }
  ];
  const algoGrid = document.getElementById('algo-grid');
  algoGrid.innerHTML = '';
  algoItems.forEach(item => {
    const img = document.createElement('img');
    img.src         = item.icon;
    img.alt         = item.label;
    img.title       = item.label;
    img.dataset.algo = item.key;
    img.addEventListener('click', () => {
      document.querySelectorAll('#algo-grid img').forEach(i => i.classList.remove('selected'));
      img.classList.add('selected');
      onSelectAlgorithm(item.key);
    });
    algoGrid.appendChild(img);
  });
  // Erstselektion Nearest
  document
    .querySelector('#algo-grid img[data-algo="nearest"]')
    .classList.add('selected');

}