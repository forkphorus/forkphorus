# forkphorus

[forkphorus.github.io](https://forkphorus.github.io)

A JavaScript/TypeScript compiler for Scratch 2 and Scratch 3 projects. forkphorus is a *fork* of phos*phorus*.

## Build Steps

Forkphorus is written in mostly TypeScript, which must be compiled to JavaScript to run in a browser.

 * [Install node.js](https://nodejs.org/en/) (and npm, if it's not included)
 * [Install TypeScript](https://www.typescriptlang.org/index.html#download-links)
 * Open a terminal in the root of the repository and run `tsc` (to build once) or `tsc -w` (to automatically rebuild when you make changes)
 * Edit TypeScript source in the phosphorus folder
 * Open index.html in your browser (even a file:// URL should work just fine)

If for some reason you don't want to or can't do that, then you could edit phosphorus.dist.js directly instead.
