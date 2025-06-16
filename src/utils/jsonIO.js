import { nodes, topology, algorithm } from '../core/state.js';

/**
 * Exportiert den aktuellen Netzwerk-Zustand als JSON-File.
 */
export function exportToJSON() {
  const data = {
    nodes: nodes.map((n, i) => ({
      id: n.id ?? i,
      label: n.label ?? '',
      x: n.x,
      y: n.y,
      color: n.color ?? '#6495ED'
    })),
    topology,
    algorithm
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'network_export.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Importiert Netzwerk-Zustand aus einer JSON-Datei.
 * @param {File} file
 * @param {Function} applyState - Callback, um den importierten State anzuwenden
 */
export function importFromJSON(file, applyState) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      applyState(data);
    } catch (err) {
      console.error('Fehler beim Parsen der Datei.', err);
      alert('Ungültige JSON-Datei!');
    }
  };
  reader.readAsText(file);
}