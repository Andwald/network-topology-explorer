import { bumpVersion } from '../core/state.js';

// Erzeugt Ring + alle spokes zum ersten Knoten als Hub
function dynamicWheelEdges(nodesArr) {
  const edges = [];
  const n = nodesArr.length;
  if (n < 2) return edges;
  const hub = nodesArr[0];
  const ring = nodesArr.slice(1);

  // Für <2 Außenknoten nur spokes (kein Ring)
  if (ring.length < 2) {
    ring.forEach(node => {
      edges.push({ from: hub, to: node });
    });
    return edges;
  }

  // 1) Ring auf den Außenknoten
  for (let i = 0; i < ring.length; i++) {
    edges.push({ from: ring[i], to: ring[(i + 1) % ring.length] });
  }

  // 2) Spokes vom Hub zu allen Außenknoten
  ring.forEach(node => {
    edges.push({ from: hub, to: node });
  });

  return edges;
}

export function snap(mx, my) {
  return { x: mx, y: my, occupiedKey: null };
}

export function diffAdd(oldNodes, newNode) {
  const n = oldNodes.length;
  // Für 0 oder 1 alten Knoten einfach komplette Rebuild nutzen
  if (n < 2) {
    return {
      removes: [],
      adds: dynamicWheelEdges(oldNodes.concat(newNode))
    };
  }

  const hub = oldNodes[0];
  const ring = oldNodes.slice(1);
  const first = ring[0];
  const last  = ring[ring.length - 1];

  // 1) Alte Abschlusskante im Ring entfernen
  const removes = [{ from: last, to: first }];

  // 2) Neue Kanten:
  //    a) Neuer Ringabschluß: last->newNode, newNode->first
  //    b) Neuer Spoke:      hub->newNode
  const adds = [
    { from: last,    to: newNode },
    { from: newNode, to: first   },
    { from: hub,     to: newNode }
  ];

  return { removes, adds };
}

export function diffUndo(oldNodes, removedNode) {
  const n = oldNodes.length;
  // Keine Knoten übrig: nichts zu tun
  if (n < 1) {
    return { removes: [], adds: [] };
  }
  // Bei nur einem verbleibenden Knoten: entferne den Spoke
  if (n < 2) {
    const hub = oldNodes[0];
    return {
      removes: dynamicWheelEdges(oldNodes.concat(removedNode)),
      adds: []
    };
  }

  const hub = oldNodes[0];
  const ring = oldNodes.slice(1);
  const first = ring[0];
  const last  = ring[ring.length - 1];

  // 1) Kanten entfernen, die beim Add hinzugefügt wurden
  const removes = [
    { from: last,        to: removedNode },
    { from: removedNode, to: first       },
    { from: hub,         to: removedNode }
  ];

  // 2) Abschlusskante im Ring wiederherstellen
  const adds = [{ from: last, to: first }];

  return { removes, adds };
}

export function diffFull(allNodes) {
  return {
    removes: [],
    adds: dynamicWheelEdges(allNodes)
  };
}

export function setupBottomControls(container /*, requestRedraw*/) {
  container.innerHTML = '';
}
