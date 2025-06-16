import * as ring        from './ring.js';
import * as star        from './star.js';
import * as binaryTree  from './binary-tree.js';
import * as randomTree  from './random-tree.js';
import * as nnt         from './nnt.js';
import * as complete    from './complete.js';
import * as path        from './path.js';
import * as emst        from './emst.js';
import * as delaunay    from './delaunay.js';
import * as gabriel     from './gabriel.js';
import * as rng         from './rng.js';
import * as gg          from './gg.js';
import * as chordalRing from './chordal-ring.js';
import * as knn         from './knn.js';
import * as grid        from './grid.js';

export const topologies = {
  ring: {
    snap: ring.snap,
    diffAdd: ring.diffAdd,
    diffUndo: ring.diffUndo,
    diffFull: ring.diffFull,
    setupBottomControls: ring.setupBottomControls
  },
  star: {
    snap: star.snap,
    diffAdd: star.diffAdd,
    diffUndo: star.diffUndo,
    diffFull: star.diffFull,
    setupBottomControls: star.setupBottomControls
  },
  'binary-tree': {
    snap: binaryTree.snap,
    diffAdd: binaryTree.diffAdd,
    diffUndo: binaryTree.diffUndo,
    diffFull: binaryTree.diffFull,
    setupBottomControls: binaryTree.setupBottomControls
  },
  'random-tree': {
    snap: randomTree.snap,
    diffAdd: randomTree.diffAdd,
    diffUndo: randomTree.diffUndo,
    diffFull: randomTree.diffFull,
    setupBottomControls: randomTree.setupBottomControls
  },
  nnt: {
    snap: nnt.snap,
    diffAdd: nnt.diffAdd,
    diffUndo: nnt.diffUndo,
    diffFull: nnt.diffFull,
    setupBottomControls: nnt.setupBottomControls
  },
  complete: {
    snap: complete.snap,
    diffAdd: complete.diffAdd,
    diffUndo: complete.diffUndo,
    diffFull: complete.diffFull,
    setupBottomControls: complete.setupBottomControls
  },
  path: {
    snap: path.snap,
    diffAdd: path.diffAdd,
    diffUndo: path.diffUndo,
    diffFull: path.diffFull,
    setupBottomControls: path.setupBottomControls
  },
  emst: {
    snap: emst.snap,
    diffAdd: emst.diffAdd,
    diffUndo: emst.diffUndo,
    diffFull: emst.diffFull,
    setupBottomControls: emst.setupBottomControls
  },
  delaunay: {
    snap: delaunay.snap,
    diffAdd: delaunay.diffAdd,
    diffUndo: delaunay.diffUndo,
    diffFull: delaunay.diffFull,
    setupBottomControls: delaunay.setupBottomControls
  },
  gabriel: {
    snap: gabriel.snap,
    diffAdd: gabriel.diffAdd,
    diffUndo: gabriel.diffUndo,
    diffFull: gabriel.diffFull,
    setupBottomControls: gabriel.setupBottomControls
  },
  rng: {
    snap: rng.snap,
    diffAdd: rng.diffAdd,
    diffUndo: rng.diffUndo,
    diffFull: rng.diffFull,
    setupBottomControls: rng.setupBottomControls
  },
  gg: {
    snap: gg.snap,
    diffAdd: gg.diffAdd,
    diffUndo: gg.diffUndo,
    diffFull: gg.diffFull,
    setupBottomControls: gg.setupBottomControls
  },
  'chordal-ring': {
    snap: chordalRing.snap,
    diffAdd: chordalRing.diffAdd,
    diffUndo: chordalRing.diffUndo,
    diffFull: chordalRing.diffFull,
    setupBottomControls: chordalRing.setupBottomControls
  },
  knn: {
    snap: knn.snap,
    diffAdd: knn.diffAdd,
    diffUndo: knn.diffUndo,
    diffFull: knn.diffFull,
    setupBottomControls: knn.setupBottomControls
  },
  grid: {
    snap: grid.snap,
    diffAdd: grid.diffAdd,
    diffUndo: grid.diffUndo,
    diffFull: grid.diffFull,
    setupBottomControls: grid.setupBottomControls
  }
};
