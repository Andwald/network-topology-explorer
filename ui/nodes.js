const MAX_RANDOM_NODES = 100;     
const MIN_DIST = 30;     

function drawNodes() {
  for (let i = 0; i < nodes.length; i++) {
    let n = nodes[i];
    const isStarCenter = (topology === "star" && i === 0);
    fill(isStarCenter ? "#FFD700" : (n.color ?? "#6495ED"));
    stroke(0);
    ellipse(n.x, n.y, 20, 20);

    if (n.label) {
      noStroke();
      fill(0);
      textAlign(CENTER, CENTER);
      text(n.label, n.x, n.y);
    }
  }
}

function addNode(x, y) {
  nodes.push({ x, y });
  if (topology === "random tree" && nodes.length > 1) {
    const parentIndex = Math.floor(Math.random() * (nodes.length - 1));
    randomParents.push(parentIndex);
  } else {
    randomParents.push(null);
  }
}
