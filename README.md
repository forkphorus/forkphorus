# forkphorus

[forkphorus.github.io](https://forkphorus.github.io)

A JavaScript/TypeScript compiler for Scratch 2 and Scratch 3 projects. forkphorus is a *fork* of [phos*phorus*](https://phosphorus.github.io/).

## Performance

Projects should, in general, run faster in forkphorus than in Scratch 3 and much faster than Scratch 2. Here's a (rather unscientific) benchmark of running [quicksort](https://scratch.mit.edu/projects/142449228) on 200000 random items:

| Environment | Time (seconds) |
| ----------- | ---- |
| Forkphorus (Scratch 3 compiler) | 0.29 |
| Scratch 3 | 11.05 |
| Scratch 2 | 17.55 |

## Build Steps

Forkphorus is written in mostly TypeScript, which must be compiled to JavaScript to run in a browser.

 * [Install node.js](https://nodejs.org/en/) (and npm, if it's not included)
 * [Install TypeScript](https://www.typescriptlang.org/index.html#download-links)
 * Open a terminal in the root of the repository and run `tsc` (to build once) or `tsc -w` (to automatically rebuild when you make changes)
 * Edit TypeScript source in the phosphorus folder
 * Open index.html in your browser (even a file:// URL should work just fine)

If for some reason you don't want to or can't do that, then you could edit phosphorus.dist.js directly instead.
