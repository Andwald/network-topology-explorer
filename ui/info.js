// ui/info.js
const topologyData = {
  "ring": {
    title: "Ring",
    desc: "Connects all nodes in a loop. Good for simple closed networks with uniform degree.",
    pros: ["Simple", "Uniform degree", "Closed path"],
    cons: ["High diameter", "No redundancy beyond the ring"]
  },
  "star": {
    title: "Star",
    desc: "One central hub node connects to all others. Ideal for hub-and-spoke models.",
    pros: ["Minimal diameter", "Easy central control"],
    cons: ["Single point of failure", "Hub bottleneck"]
  },
  "binary-tree": {
    title: "Binary Tree",
    desc: "Heap-style tree: node i’s parent is at ⌊(i–1)/2⌋. Good for hierarchical structures.",
    pros: ["Log₂(N) depth", "Simple parent calculation"],
    cons: ["Branching increases", "Root is critical"]
  },
  "random-tree": {
    title: "Random Tree",
    desc: "Each new node attaches to a random existing node. Useful for prototype testing.",
    pros: ["Easy", "Stochastic topology"],
    cons: ["Unpredictable path lengths", "Load spikes possible"]
  },
  nnt: {
    title: "Nearest Neighbor Tree",
    desc: "Greedy: each new node connects to the closest existing node.",
    pros: ["Locally efficient", "Often short total edge length"],
    cons: ["Can branch poorly", "No global optimum"]
  },
  complete: {
    title: "Complete Graph",
    desc: "Every node connects to every other. Only sensible for very small N.",
    pros: ["Fully connected"],
    cons: ["O(N²) edges", "Not scalable"]
  },
  path: {
    title: "Path",
    desc: "Connects nodes sequentially without closing the loop.",
    pros: ["Simple sequence", "Open chain"],
    cons: ["High diameter", "No cycle"]
  },
  emst: {
    title: "Euclidean Minimum Spanning Tree",
    desc: "Minimum spanning tree via Kruskal or Prim—minimizes total edge length.",
    pros: ["Globally optimal tree"],
    cons: ["O(N²) comparisons", "Batch computation"]
  },
  "delaunay": {
    title: "Delaunay Triangulation",
    desc: "Maximizes minimum angles in triangles; dual of Voronoi diagram.",
    pros: ["Well-shaped triangles", "Basis for many algorithms"],
    cons: ["Computationally heavy", "Not a tree"]
  },
  "gabriel": {
    title: "Gabriel Graph",
    desc: "Connects A–B only if no other node lies inside the circle with AB as diameter.",
    pros: ["Limits edge density", "Useful for proximity queries"],
    cons: ["O(N³) in naive check", "May be disconnected"]
  },
  "rng": {
    title: "Relative Neighborhood Graph",
    desc: "Connects A–B only if no other node is closer to both A and B than they are to each other.",
    pros: ["Sparser than Gabriel", "Preserves nearest relations"],
    cons: ["Computationally expensive"]
  },
  "gg": {
    title: "Geometric Graph",
    desc: "Connects pairs whose Euclidean distance ≤ threshold r.",
    pros: ["Models wireless/adhoc networks", "Intuitive radius parameter"],
    cons: ["Edge count sensitive to r", "Requires O(N²) distance tests", "Not always connected"]
  },
  "chordal-ring": {
    title: "Dynamic Chordal Ring",
    desc: "Ring plus fixed-step chords based on node count.",
    pros: ["Improves diameter over simple ring", "Regular topology"],
    cons: ["Assumes circular ordering", "Chaotic on arbitrary layouts"]
  },
  "knn": {
    title: "k-Nearest Neighbors Graph",
    desc: "Each node connects to its k closest neighbors.",
    pros: ["Controls local connectivity", "Reflects clustering structure"],
    cons: ["Needs sorting distances", "May be asymmetric"]
  },
  "grid": {
    title: "Grid Graph",
    desc: "Snaps nodes to a fixed grid and connects 4-neighbors (up/down/left/right).",
    pros: ["Structured layout", "Simple neighbor logic"],
    cons: ["Depends on grid size", "May distort true distances"]
  }
};

function showTopologyInfo(topoKey) {
  const info = select('#topo-info');
  if (!info) {
    console.error('showTopologyInfo: #topo-info Element nicht gefunden');
    return;
  }
  const data = topologyData[topoKey] || {};

  // Baue neuen HTML-Block
  const html = `
    <div class="info-header">
      <h2 id="topo-name">${data.title || topoKey}</h2>
    </div>
    <div class="info-desc">
      <p>${data.desc || ''}</p>
    </div>
    <div class="info-features">
      <div class="feature pros">
        <h3>Pros</h3>
        <ul>
          ${(data.pros || []).map(p => `<li>${p}</li>`).join('')}
        </ul>
      </div>
      <div class="feature cons">
        <h3>Cons</h3>
        <ul>
          ${(data.cons || []).map(c => `<li>${c}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;

  info.html(html);
}