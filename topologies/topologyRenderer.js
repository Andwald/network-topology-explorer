const threshold = 100; // Distanz-Schwellenwert in Pixeln für RGG
const gridSize = 100; // Pixel-Abstand der Grid-Slots
let occupied = {};     // Map "gx,gy" → true

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
    case "gg": drawGeometricGraph(); break;
    case "k-nn graph": drawKNearestGraph(3); break;
    case "chordal ring": drawChordalRing(); break;
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
  stroke(100);

  // Knoten sind schon richtig gecached in nodes[i].gx/.gy und .x/.y
  // Wir können optional erst sortieren, muss aber nicht.
  // Jetzt für jeden Knoten die 4 möglichen Nachbarn überprüfen:
  for (let { gx, gy, x, y } of nodes) {
    // rechts
    let key = `${gx+1},${gy}`;
    if (occupied[key]) {
      const n = nodes.find(n => n.gx === gx+1 && n.gy === gy);
      line(x, y, n.x, n.y);
    }
    // unten
    key = `${gx},${gy+1}`;
    if (occupied[key]) {
      const n = nodes.find(n => n.gx === gx && n.gy === gy+1);
      line(x, y, n.x, n.y);
    }
    // (optional) links/oben, wenn Du jede Kante doppelt oder in spezifischer Reihenfolge willst
  }
}


function drawGeometricGraph() {
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

function drawKNearestGraph() {
  stroke(100);
  for (let i = 0; i < nodes.length; i++) {
    // Distanzen sammeln
    const dists = [];
    for (let j = 0; j < nodes.length; j++) {
      if (j === i) continue;
      dists.push({ idx: j, d: dist(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y) });
    }
    // sortieren und Top-k auswählen
    dists.sort((a, b) => a.d - b.d);
    const neighbours = dists.slice(0, knnK);
    // Kanten zeichnen
    neighbours.forEach(n => {
      line(nodes[i].x, nodes[i].y, nodes[n.idx].x, nodes[n.idx].y);
    });
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
