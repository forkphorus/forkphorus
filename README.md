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

 * [Install node.js and npm](https://nodejs.org/en/) (npm is usually included with node)
 * **Easy way:**
   * Run `npm run dev` in your terminal when in the repository's root.
   * Open any of the links output in the console
 * **Manual way:** (only if the first method didn't work)
   * Install dependencies by running `npm install` in the root of the repository
   * Run `tsc -w` to automatically 
   * Open index.html in your browser with a local HTTP server or a file:// URL.
 * Edit TypeScript source in the phosphorus folder, and changes to the .ts files will automatically retrigger a build.
 * Refresh to observe changes.

If for some reason you don't want to or can't do that, then you could edit phosphorus.dist.js directly instead.
