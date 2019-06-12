# forkphorus

[forkphorus.github.io](https://forkphorus.github.io)

A JavaScript/TypeScript compiler for Scratch 2 and Scratch 3 projects. forkphorus is a *fork* of [phos*phorus*](https://phosphorus.github.io/).

## Performance

Projects should, in general, run faster in forkphorus than in Scratch 3 and much faster than Scratch 2. Here's an unscientific benchmark of running [quicksort](https://scratch.mit.edu/projects/310372816/) on 200000 random items:

| Environment | Min | Avg | Max |
| ----------- | --- | --- | --- |
| Forkphorus (sb3 compiler) | 0.261 | 0.2848 | 0.316 |
| Scratch 3 | 11.545 | 12.066 | 13.653 |
| Scratch 2 |  | 17.55 |  |

## Build Steps

Forkphorus is written in mostly TypeScript, which must be compiled to JavaScript to run in a browser.

 * [Install node.js and npm](https://nodejs.org/en/) (npm is usually included with node)
 * **Automated way:**
   * Run `npm run watch` in your terminal when in the repository.
   * Open any of the links output in the console.
   * **VS Code Users:** You can do this using Tasks: Command Pallet (Ctrl+Shift+P) -> "Run Build Task" -> "npm: watch" -> "TypeScript problems (Watch mode)". Other editors may have something similar.
 * **Manual way:** (only if the first method didn't work)
   * Install dependencies by running `npm install` in the repository.
   * Run `tsc -w` to start the TypeScript compiler in watch mode.
   * Open index.html in your browser with a local HTTP server or a file:// URL.
 * Edit TypeScript files in the `phosphorus` folder, and the compiler will automatically rebuild the output.
 * Refresh to observe changes.

If for some reason you don't want to or can't do that, then you could edit phosphorus.dist.js directly instead.
