import {
  nodes,
  edges,
  animation,
  topology as currentTopology,
  gridSize,
  topologyVersion
} from '../core/state.js';
import {
  enqueueNodeTask,
  enqueueEdgeTask,
  enqueueRemoveEdgeTask
} from '../core/tasks.js';
import { topologies } from '../topologies/index.js';
import { drawHint } from '../ui/hint.js';
import { drawNodes } from '../ui/nodes.js';
import { snapToGrid as globalSnapToGrid } from '../utils/grid.js';

// Gitter-Zeichnen (Grid-Overlay)
function drawGridOverlay(p) {
  p.stroke(255, 255, 255, 50);
  p.strokeWeight(1);
  for (let x = 0; x <= p.width; x += gridSize) p.line(x, 0, x, p.height);
  for (let y = 0; y <= p.height; y += gridSize) p.line(0, y, p.width, y);
}

// Statisch gezeichnete Kanten
function drawTopologyStatic(p) {
  p.stroke(100);
  p.strokeWeight(1);
  for (const e of edges) {
    p.line(e.from.x, e.from.y, e.to.x, e.to.y);
  }
}

// Ein Animationsschritt
function animateStep(p) {
  let task = animation.current || animation.queue.shift();
  if (!task) {
    animation.running = false;
    p.noLoop();
    return;
  }
  animation.current = task;
  task.progress++;
  const t = task.progress / task.duration;

  if (task.type === 'node') {
    p.push();
      p.translate(task.node.x, task.node.y);
      const r = p.lerp(0, 10, t);
      p.noStroke();
      p.fill('#6495ED');
      p.ellipse(0, 0, r * 2);
    p.pop();
    if (t >= 1) animation.current = null;

  } else if (task.type === 'edge') {
    const ix = p.lerp(task.from.x, task.to.x, t);
    const iy = p.lerp(task.from.y, task.to.y, t);
    p.stroke(0, 200, 0);
    p.line(task.from.x, task.from.y, ix, iy);
    if (t >= 1) {
      if (task.version === topologyVersion) {
        edges.push({ from: task.from, to: task.to });
      }
      animation.current = null;
    }

  } else if (task.type === 'remove-edge') {
    const ix = p.lerp(task.from.x, task.to.x, t);
    const iy = p.lerp(task.from.y, task.to.y, t);
    p.push();
    p.stroke(200, 0, 0);
    p.strokeWeight(2);
    p.line(task.from.x, task.from.y, ix, iy);
    p.pop();
    if (task.progress >= task.duration) {
      if (task.version === topologyVersion) {
        // remove that edge
        const i = edges.findIndex(e =>
          e.from === task.from && e.to === task.to
        );
        if (i !== -1) edges.splice(i, 1);
      }
      animation.current = null;
    }
  }
}

let sketchInstance;
export function startRenderer({ speed }) {
  const sketch = (p) => {
    p.setup = () => {
      const container = document.getElementById('canvas-container');
      p.createCanvas(container.offsetWidth, container.offsetHeight)
       .parent('canvas-container');
      p.noLoop();  // wir steuern den Loop manuell
    };

    p.draw = () => {
      p.background(240); 
      if (currentTopology === 'grid') drawGridOverlay(p);
      drawHint(p);
      drawTopologyStatic(p);
      drawNodes(p);
      if (animation.running) animateStep(p);
    };

    p.mousePressed = () => {
      if (
        p.mouseX < 0 || p.mouseY < 0 ||
        p.mouseX > p.width || p.mouseY > p.height
      ) return;

      const cfg = topologies[currentTopology];

      // 1) Place node immediately
      const { x, y } = cfg.snap(p.mouseX, p.mouseY);
      enqueueNodeTask(x, y, speed.get());

      // 2) Compute edge‐deltas
      const newNode = nodes[nodes.length - 1];
      const oldList = nodes.slice(0, -1);

      // Δ‐add for this click
      const { removes, adds } = cfg.diffAdd(oldList, newNode);
      removes.forEach(({ from, to }) =>
        enqueueRemoveEdgeTask(from, to, speed.get())
      );
      adds.forEach(({ from, to }) =>
        enqueueEdgeTask(from, to, speed.get())
      );

      // 3) Fire the animation loop
      animation.running = true;
      p.loop();
    };

    p.windowResized = () => {
      const container = document.getElementById('canvas-container');
      p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    };
  };

  sketchInstance = new window.p5(sketch);
}

export function startLoop() {
  if (sketchInstance) sketchInstance.loop();
}

export function requestRedraw() {
  if (sketchInstance) sketchInstance.redraw();
}
