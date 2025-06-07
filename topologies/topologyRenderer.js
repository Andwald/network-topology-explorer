const gridSize = 200; // Pixel-Abstand der Gitterpunkte
const threshold = 100; // Distanz-Schwellenwert in Pixeln für RGG

function drawTopology(name) {
  switch (name) {
    case "ring": drawRingTopology(); break;
    case "star": drawStarTopology(); break;
    case "binary tree": drawBinaryTree(); break;
    case "random tree": drawRandomTree(); break;
    case "nnt": drawNearestTree(); break;
    case "complete": drawCompleteGraph(); break;
    case "path": drawPathTopology(); break;
    case "emst": drawEMST(); break;
    case "gabriel": drawGabrielGraph(); break;
    case "rng": drawRelativeNeighborhoodGraph(); break;
    case "delaunay": drawDelaunay(); break;
    case "grid": drawGridGraph(); break;
    case "rgg": drawRandomGeometricGraph(); break;
    case "k-nn graph": drawKNearestGraph(3); break;
    case "convex hull": drawConvexHull(); break;
    case "chordal ring": drawChordalRing(); break;
    case "layered": drawLayeredGraph(3); break;
    case "random weighted": drawRandomWeightedGraph(); break;
  }
}


function drawRingTopology() {
  stroke(100);
  for (let i = 1; i < nodes.length; i++) {
    line(nodes[i - 1].x, nodes[i - 1].y, nodes[i].x, nodes[i].y);
  }
  if (nodes.length > 2) {
    line(nodes[nodes.length - 1].x, nodes[nodes.length - 1].y, nodes[0].x, nodes[0].y);
  }
}

function drawStarTopology() {
  if (nodes.length < 2) return;
  stroke(100);
  const center = nodes[0];
  for (let i = 1; i < nodes.length; i++) {
    line(center.x, center.y, nodes[i].x, nodes[i].y);
  }
}

function drawBinaryTree() {
  stroke(100);
  for (let i = 1; i < nodes.length; i++) {
    const parentIndex = Math.floor((i - 1) / 2);
    line(nodes[i].x, nodes[i].y, nodes[parentIndex].x, nodes[parentIndex].y);
  }
}

function drawRandomTree() {
  stroke(100);
  for (let i = 1; i < nodes.length; i++) {
    const parentIndex = randomParents[i];
    if (parentIndex !== null) {
      line(nodes[i].x, nodes[i].y, nodes[parentIndex].x, nodes[parentIndex].y);
    }
  }
}

function drawNearestTree() {
  stroke(100);
  for (let i = 1; i < nodes.length; i++) {
    let closest = null;
    let minDist = Infinity;
    for (let j = 0; j < i; j++) {
      const d = dist(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
      if (d < minDist) {
        minDist = d;
        closest = j;
      }
    }
    if (closest !== null) {
      line(nodes[i].x, nodes[i].y, nodes[closest].x, nodes[closest].y);
    }
  }
}

function drawCompleteGraph() {
  stroke(100);
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      line(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
    }
  }
}

function drawPathTopology() {
  stroke(100);
  for (let i = 1; i < nodes.length; i++) {
    line(nodes[i - 1].x, nodes[i - 1].y, nodes[i].x, nodes[i].y);
  }
}

function drawEMST() {
  if (nodes.length < 2) return;
  const edges = [];
  // 1) Alle Paar-Kanten sammeln
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = dist(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
      edges.push({ i, j, w: d });
    }
  }
  // 2) Sortieren
  edges.sort((a, b) => a.w - b.w);
  // 3) Union-Find initialisieren
  const parent = Array(nodes.length).fill().map((_, idx) => idx);
  function find(u) {
    return parent[u] === u ? u : (parent[u] = find(parent[u]));
  }
  function union(u, v) {
    const ru = find(u), rv = find(v);
    if (ru !== rv) parent[rv] = ru;
  }
  // 4) Kruskal’s Auswahl
  const mst = [];
  for (let e of edges) {
    if (find(e.i) !== find(e.j)) {
      mst.push(e);
      union(e.i, e.j);
    }
    if (mst.length === nodes.length - 1) break;
  }
  // 5) Zeichnen
  stroke(100);
  for (let e of mst) {
    const a = nodes[e.i], b = nodes[e.j];
    line(a.x, a.y, b.x, b.y);
  }
}

function drawGabrielGraph() {
  stroke(100);
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const ax = nodes[i].x, ay = nodes[i].y;
      const bx = nodes[j].x, by = nodes[j].y;
      const midX = (ax + bx) / 2;
      const midY = (ay + by) / 2;
      const radiusSq = sq(dist(ax, ay, bx, by) / 2);
      let empty = true;
      for (let k = 0; k < nodes.length; k++) {
        if (k === i || k === j) continue;
        const dx = nodes[k].x - midX;
        const dy = nodes[k].y - midY;
        if (dx*dx + dy*dy < radiusSq) {
          empty = false;
          break;
        }
      }
      if (empty) {
        line(ax, ay, bx, by);
      }
    }
  }
}

function drawRelativeNeighborhoodGraph() {
  stroke(100);
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const ax = nodes[i].x, ay = nodes[i].y;
      const bx = nodes[j].x, by = nodes[j].y;
      const dAB = dist(ax, ay, bx, by);
      let allowed = true;
      for (let k = 0; k < nodes.length; k++) {
        if (k === i || k === j) continue;
        const cx = nodes[k].x, cy = nodes[k].y;
        if (dist(cx, cy, ax, ay) < dAB && dist(cx, cy, bx, by) < dAB) {
          allowed = false;
          break;
        }
      }
      if (allowed) {
        line(ax, ay, bx, by);
      }
    }
  }
}

function drawDelaunay() {
  if (nodes.length < 3) return;
  // 1) Erstelle ein Array von [x, y]
  const coords = [];
  for (let n of nodes) {
    coords.push([n.x, n.y]);
  }
  // 2) Baue Delaunator auf (global verfügbar durch <script src="…delaunator.min.js">)
  const delaunay = Delaunator.from(coords);
  const triangles = delaunay.triangles; // Array von Punkt-Indizes [i0, i1, i2, i3, …]
  // 3) Sammle Kanten in einem Set (damit keine Duplikate entstehen)
  const edges = new Set();
  for (let i = 0; i < triangles.length; i += 3) {
    const a = triangles[i], b = triangles[i + 1], c = triangles[i + 2];
    [ [a, b], [b, c], [c, a] ].forEach(pair => {
      const u = pair[0], v = pair[1];
      const key = u < v ? `${u}-${v}` : `${v}-${u}`;
      edges.add(key);
    });
  }
  // 4) Zeichne alle Kanten des Delaunay-Graphen
  stroke(100);
  edges.forEach(key => {
    const [u, v] = key.split('-').map(Number);
    const p = nodes[u], q = nodes[v];
    line(p.x, p.y, q.x, q.y);
  });
}

function drawGridGraph() {
  // 1) Knoten im Checker-Raster „snappen“:
  const snapped = nodes.map(n => ({
    gx: Math.round(n.x / gridSize),
    gy: Math.round(n.y / gridSize),
    orig: n
  }));
  // 2) Nachbarn finden (4‐Nachbarschaft):
  stroke(100);
  for (let i = 0; i < snapped.length; i++) {
    for (let j = i + 1; j < snapped.length; j++) {
      const a = snapped[i], b = snapped[j];
      // Nur verbinden, wenn (gx,gy) sich um genau 1 in einer Achse unterscheidet
      if (
        ((a.gx === b.gx) && (Math.abs(a.gy - b.gy) === 1)) ||
        ((a.gy === b.gy) && (Math.abs(a.gx - b.gx) === 1))
      ) {
        // Zeichne Linie zwischen den Original-Koordinaten beider Knoten
        line(a.orig.x, a.orig.y, b.orig.x, b.orig.y);
      }
    }
  }
}


function drawRandomGeometricGraph() {
  stroke(100);
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = dist(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
      if (d <= threshold) {
        line(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
      }
    }
  }
}

function drawKNearestGraph(k = 3) {
  stroke(100);
  for (let i = 0; i < nodes.length; i++) {
    // 1) Array aller anderen Knoten indizieren mit Distanz
    const dists = [];
    for (let j = 0; j < nodes.length; j++) {
      if (j === i) continue;
      const d = dist(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
      dists.push({ idx: j, d });
    }
    // 2) Sortieren und Top-k auswählen
    dists.sort((a, b) => a.d - b.d);
    const neighbours = dists.slice(0, k);
    // 3) Kanten zeichnen
    for (let n of neighbours) {
      line(nodes[i].x, nodes[i].y, nodes[n.idx].x, nodes[n.idx].y);
    }
  }
}

function drawConvexHull() {
  if (nodes.length < 3) return;
  // 1) Punkteliste nach x (und y) sortieren
  const pts = nodes.map((n, i) => ({ x: n.x, y: n.y, idx: i }));
  pts.sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);
  const cross = (o, a, b) => (a.x - o.x)*(b.y - o.y) - (a.y - o.y)*(b.x - o.x);

  const lower = [];
  for (let p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length-2], lower[lower.length-1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length-2], upper[upper.length-1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  // Zusammensetzen (letzten Punkt jeder Liste entfernen, um Duplikat zu vermeiden)
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  // 2) Zeichnen
  stroke(100);
  for (let i = 0; i < hull.length; i++) {
    const a = nodes[hull[i].idx];
    const b = nodes[hull[(i+1) % hull.length].idx];
    line(a.x, a.y, b.x, b.y);
  }
}

function drawChordalRing() {
  const n = nodes.length;
  if (n < 3) return;
  const step = Math.floor(n / 2);
  stroke(100);
  for (let i = 0; i < n; i++) {
    // immer den Ring zeichnen
    const next = (i + 1) % n;
    line(nodes[i].x, nodes[i].y, nodes[next].x, nodes[next].y);

    // den Chord nur einmal pro Paar zeichnen
    const chord = (i + step) % n;
    if (n % 2 === 1 || i < chord) {
      // bei ungeradem n immer, bei geradem n nur, wenn i < chord
      line(nodes[i].x, nodes[i].y, nodes[chord].x, nodes[chord].y);
    }
  }
}


function drawLayeredGraph(numLayers = 3) {
  stroke(100);
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].layer === nodes[j].layer) {
        // Innerhalb derselben Schicht verbinden
        line(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
      } else if (nodes[i].layer + 1 === nodes[j].layer || nodes[j].layer + 1 === nodes[i].layer) {
        // Zwischen benachbarten Schichten verbinden
        line(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
      }
    }
  }
}

function drawRandomWeightedGraph() {
  stroke(100);
  randEdges.forEach(({ i, j }) => {
    line(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
  });
}