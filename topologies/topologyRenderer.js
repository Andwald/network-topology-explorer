

// Berechnet den EMST per Prim (O(N²)), gibt Liste von {from, to}-Edges zurück.
function computeEMSTEdges(nodesArr) {
  const N = nodesArr.length;
  if (N < 2) return [];
  const visited = new Array(N).fill(false);
  const bestDist = new Array(N).fill(Infinity);
  const bestParent = new Array(N).fill(null);
  const edges = [];

  visited[0] = true;
  // Initialisiere Distanzen vom Startknoten 0
  for (let i = 1; i < N; i++) {
    const dx = nodesArr[i].x - nodesArr[0].x;
    const dy = nodesArr[i].y - nodesArr[0].y;
    bestDist[i] = Math.hypot(dx, dy);
    bestParent[i] = 0;
  }

  // N-1 Mal das nächste Minimal-Edge hinzufügen
  for (let k = 1; k < N; k++) {
    // Finde unvisited mit minimaler Distanz
    let minD = Infinity, minIdx = -1;
    for (let i = 0; i < N; i++) {
      if (!visited[i] && bestDist[i] < minD) {
        minD = bestDist[i];
        minIdx = i;
      }
    }
    // Kante parent→minIdx aufnehmen
    edges.push({
      from: nodesArr[bestParent[minIdx]],
      to:   nodesArr[minIdx]
    });
    visited[minIdx] = true;
    // Distanzen aktualisieren
    for (let j = 0; j < N; j++) {
      if (!visited[j]) {
        const dx = nodesArr[j].x - nodesArr[minIdx].x;
        const dy = nodesArr[j].y - nodesArr[minIdx].y;
        const d  = Math.hypot(dx, dy);
        if (d < bestDist[j]) {
          bestDist[j] = d;
          bestParent[j] = minIdx;
        }
      }
    }
  }

  return edges;
}

// Hilfsfunktion: berechnet alle Kanten der Delaunay-Triangulation
function computeDelaunayEdges(nodesArr) {
  if (nodesArr.length < 3) return [];
  const delaunay = Delaunator.from(nodesArr.map(n => [n.x, n.y]));
  const edges = new Set();
  for (let e = 0; e < delaunay.triangles.length; e += 3) {
    const [i0, i1, i2] = [
      delaunay.triangles[e+0],
      delaunay.triangles[e+1],
      delaunay.triangles[e+2]
    ];
    [[i0,i1],[i1,i2],[i2,i0]].forEach(([a,b]) => {
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      edges.add(key);
    });
  }
  return Array.from(edges).map(key => {
    const [a,b] = key.split(",").map(Number);
    return { from: nodesArr[a], to: nodesArr[b] };
  });
}

// Berechnet alle Gabriel-Kanten für ein Node-Array
function computeGabrielEdges(nodesArr) {
  const N = nodesArr.length;
  const edges = [];
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const a = nodesArr[i], b = nodesArr[j];
      // Kreis-Mittelpunkt & Radius²
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const r2 = ((a.x - b.x)**2 + (a.y - b.y)**2) / 4;
      // Prüfe, ob ein dritter Knoten im Innern liegt
      let ok = true;
      for (let k = 0; k < N; k++) {
        if (k === i || k === j) continue;
        const c = nodesArr[k];
        const dx = c.x - mx, dy = c.y - my;
        if (dx*dx + dy*dy < r2) { ok = false; break; }
      }
      if (ok) {
        edges.push({ from: a, to: b });
        // nur eine Richtung nötig, static draw ist symmetrisch
      }
    }
  }
  return edges;
}

// Berechnet alle RNG-Kanten für ein Node-Array
function computeRNGEdges(nodesArr) {
  const N = nodesArr.length;
  const edges = [];
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const a = nodesArr[i], b = nodesArr[j];
      // Abstand A–B
      const ab2 = (a.x - b.x)**2 + (a.y - b.y)**2;
      let ok = true;
      // Prüfe, ob es ein C gibt, so dass dist(C,A) < dist(A,B) && dist(C,B) < dist(A,B)
      for (let k = 0; k < N; k++) {
        if (k === i || k === j) continue;
        const c = nodesArr[k];
        const ac2 = (a.x - c.x)**2 + (a.y - c.y)**2;
        const bc2 = (b.x - c.x)**2 + (b.y - c.y)**2;
        if (ac2 < ab2 && bc2 < ab2) {
          ok = false;
          break;
        }
      }
      if (ok) edges.push({ from: a, to: b });
    }
  }
  return edges;
}

// GG: global alle Kanten mit dist ≤ threshold
function computeGGEdges(nodesArr, r) {
  const r2 = r*r;
  const edges = [];
  const N = nodesArr.length;
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const a = nodesArr[i], b = nodesArr[j];
      const d2 = (a.x - b.x)**2 + (a.y - b.y)**2;
      if (d2 <= r2) edges.push({ from: a, to: b });
    }
  }
  return edges;
}

// Berechnet Ring + einen Chord-Abstand d so, dass
// im Worst-Case höchstens `chordThreshold` Hops nötig sind.
function computeDynamicChordalRingEdges(nodesArr) {
  const n = nodesArr.length;
  if (n < 2) return [];

  const edges = [];
  // 1) Standard-Ring-Kanten
  for (let i = 0; i < n; i++) {
    edges.push({ from: nodesArr[i], to: nodesArr[(i + 1) % n] });
  }

  // 2) Dynamische Chord-Länge: d = ceil(n / chordThreshold), mindestens 2
  const d = Math.max(2, Math.ceil(n / chordThreshold));

  // 3) Chords: für jeden Knoten i eine Kante zu (i + d) mod n (inkl. Wrap-around)
  for (let i = 0; i < n; i++) {
    const j = (i + d) % n;
    edges.push({ from: nodesArr[i], to: nodesArr[j] });
  }

  return edges;
}




const topologyHandlers = {
  ring: {
    // snap ist wie gehabt: Klick-Koordinaten zurückgeben
    snap: (mx, my) => ({ x: mx, y: my, occupiedKey: null }),

    // computeEdges jetzt nur noch incremental:
    computeEdges: (oldNodes, newNode) => {
      // Wenn es vorher noch keinen Knoten gab, gibt’s auch keine Kanten
      if (oldNodes.length === 0) return [];

      const last = oldNodes[oldNodes.length - 1];
      const first = oldNodes[0];
      // genau zwei neue Kanten: last→newNode und newNode→first
      return [
        { from: last,    to: newNode },
        { from: newNode, to: first   }
      ];
    }
  },
  star: {
    // Klick-Verhalten: wie bei Ring, kein Snap-Grid
    snap: (mx, my) => ({ x: mx, y: my, occupiedKey: null }),

    // Incremental: Immer eine neue Kante von Hub (erstes Element) zum neuen Knoten
    computeEdges: (oldNodes, newNode) => {
      if (oldNodes.length === 0) {
        // Erster Knoten wird Hub, keine Kante
        return [];
      }
      const hub = oldNodes[0];
      return [
        { from: hub, to: newNode }
      ];
    }
  },
  "binary-tree": {
    // Klick-Koordinaten unverändert übernehmen
    snap: (mx, my) => ({ x: mx, y: my, occupiedKey: null }),

    // Beim Hinzufügen eines Knotens i: verknüpfe ihn mit parent floor((i–1)/2)
    computeEdges: (oldNodes, newNode) => {
      const i = oldNodes.length;       // neuer Index = Länge vor dem Push
      if (i === 0) return [];          // erster Knoten = Root, keine Kante
      const parentIdx = Math.floor((i - 1) / 2);
      return [{ from: oldNodes[parentIdx], to: newNode }];
    }
  },
  nnt: {
    snap: (mx, my) => ({ x: mx, y: my, occupiedKey: null }),
    computeEdges: (oldNodes, newNode) => {
      const i = oldNodes.length;
      if (i === 0) return [];
      // neuen Knoten newNode mit nächstem alten Knoten verbinden
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let j = 0; j < i; j++) {
        const dx = newNode.x - oldNodes[j].x;
        const dy = newNode.y - oldNodes[j].y;
        const d  = Math.hypot(dx, dy);
        if (d < bestDist) {
          bestDist = d;
          bestIdx  = j;
        }
      }
      return [{ from: oldNodes[bestIdx], to: newNode }];
    }
  },
  "complete": {
    snap: (mx, my) => ({ x: mx, y: my, occupiedKey: null }),
    computeEdges: (oldNodes, newNode) => {
      // für jeden alten Knoten eine Kante
      return oldNodes.map(n => ({ from: n, to: newNode }));
    }
  },
  "path": {
    snap: (mx, my) => ({ x: mx, y: my, occupiedKey: null }),
    computeEdges: (oldNodes, newNode) => {
      // Wenn schon mindestens ein Knoten da, ziehe eine Kante vom letzten
      if (oldNodes.length === 0) return [];
      const last = oldNodes[oldNodes.length - 1];
      return [{ from: last, to: newNode }];
    }
  },
  "emst": {
    snap: (mx, my) => ({ x: mx, y: my, occupiedKey: null }),
    computeEdges: (oldNodes, newNode) => {
      // full set = oldNodes plus newNode
      return computeEMSTEdges([...oldNodes, newNode]);
    }
  },
  "delaunay": {
    snap: (mx, my) => ({ x: mx, y: my, occupiedKey: null }),
    computeEdges: (oldNodes, newNode) => {
      // global neu triangulieren
      return computeDelaunayEdges([...oldNodes, newNode]);
    }
  },
  "gabriel": {
    snap: (mx, my) => ({ x: mx, y: my, occupiedKey: null }),
    computeEdges: (oldNodes, newNode) => {
      // baue nur die Kanten, die das neue Node betreffen
      const prev = [...oldNodes, newNode];
      const all = computeGabrielEdges(prev);
      // filtere diejenigen, die newNode als Endpunkt haben
      return all.filter(e => e.to === newNode);
    }
  },
  "rng": {
    snap: (mx, my) => ({ x: mx, y: my, occupiedKey: null }),
    computeEdges: (oldNodes, newNode) => {
      // global neu berechnen inkl. newNode
      return computeRNGEdges([...oldNodes, newNode]);
    }
  },
  "gg": {
    snap:    (mx, my) => ({ x: mx, y: my, occupiedKey: null }),
    computeEdges: (oldNodes, newNode) => {
      // threshold r – hier Beispiel 100, passe bei Bedarf an oder
      // binde eine UI-Komponente ein
      const r = 100;
      const valid = computeGGEdges([...oldNodes, newNode], r);
      return valid.filter(e => e.to === newNode);
    }
  },
  "chordal-ring": {
    snap:    (mx, my) => ({ x: mx, y: my, occupiedKey: null }),
    computeEdges: (oldNodes, newNode) => {
      // full rebuild für oldNodes + newNode
      return computeDynamicChordalRingEdges([...oldNodes, newNode]);
    }
  }

};

// Hilfsfunktionen, die main.js später aufruft:
function snapNode(mx, my) {
  const h = topologyHandlers[topology];
  return h ? h.snap(mx, my) : { x: mx, y: my, occupiedKey: null };
}

function computeEdges(oldNodes, newNode) {
  const h = topologyHandlers[topology];
  return h ? h.computeEdges(oldNodes, newNode) : [];
}

// Exponieren ins globale Namespace:
window.snapNode = snapNode;
window.computeEdges = computeEdges;