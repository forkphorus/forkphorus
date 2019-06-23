# forkphorus changelog

*Dates reflect when the changes were developed, and recent changes may not yet be deployed to forkphorus.github.io.*

## June 22

- **New project player**: less broken than before
  - Translations are now possible.
    - A couple spanish translations have been added, hopefully more can be added soon.
  - When you close a project at any time (by pressing the back button in your browser), it will be properly unloaded, even while it is loading.
    - (The project may still be downloaded and compiled, but it will not run, and the progress bar will reflect this)
  - Other minor changes and bug fixes
  - It should be easier to maintain.
- **New project examples**: it's now powered by a (studio)[https://scratch.mit.edu/studios/15926401/] instead of a boring dropdown

## June 19

- fix #49: fix loading of some Scratch 2 projects (I believe it is projects uploaded from the offline editor)

## June 13

- fix #44: fix "when backdrop changes to" block

## June 11

- SVG graphics actually scale
- Fix stages not being destroyed after you start a new one
- Add message to try to get people to use forkphorus.github.io instead of forkphorus.github.io/forkphorus/
- sb3: Fix support for that one trick people use to change the pen's transparency:
  - ![set pen color block](https://user-images.githubusercontent.com/17209175/59324756-e3bfc880-8ca5-11e9-9ec4-cf0871255709.png)

## June 10

- sb2 and sb3: Fix `play sound until done` not respecting `stop all sounds`
  - The sound would indeed stop, but the wait for the sound to finish would remain.
  - This probably fixes issues with sounds not playing until after a duration of time.
- Finishing up things related to the [HTML Packager](https://forkphorus.github.io/packager/)

## June 9

- Scratch 3 compiler optimizations: some scripts can run significantly faster than before!
  - Loops inside "Run without screen refresh" blocks can be optimized down to pure JS loops (significantly faster than continuations)
    - Quicksort on 200,000 went from ~.34 to ~.28
    - Insertion sort on 10,000 items went from ~2 to ~1.6
    - An empty "repeat 1,000,000" went from 0.013 to 0.002
    - Optimization might be disabled depending on the contents of the loop.
    - Each block must be independently marked as running without screen refresh to get these optimizations. (calling a block with screen refresh from a block without screen refresh is not enough)
  - Does not apply to Scratch 2 projects for now

## June 6

- Fix pen canvas to properly resize itself when possible

## June 4

- [New packager](https://forkphorus.github.io/packager/) includes fonts.

## June 3

- sb3: fix long-standing SVG issues resulting in parts being cut-off or white borders
- Various updates to the [new packager](https://forkphorus.github.io/packager/)
- Disable pixel smoothing
  - Makes a lot of pixel-art projects look **a lot** better
- Fix some issues with the `touching <sprite>` block.

## June 2

- Fix `wait until` in "Run without screen refresh" blocks

## June 1

- Experimental .html packaging support (can be converted to .exe with NW.js): https://forkphorus.github.io/packager/
- Refactored asset downloading; it should be more resilient to failure
- Fix issues with the settings menu showing input placeholders when in fullscreen
- Fix errors with numbers that start with leading zeroes

## May 28

- Fix giving focus to loaded projects

## May 25

- Changing framerate should cause less issues

## May 22

- Fix title in app.html

## May 16

- Optimize runtime: up to 15% performance improvement
- Add precise timers feature flag: https://forkphorus.github.io/?preciseTimers (should eventually become default) Fixes:
  - https://forkphorus.github.io/?preciseTimers#31903442
  - https://forkphorus.github.io/?preciseTimers#34791164

## May 13

- WebGL rendering prototype: https://forkphorus.github.io/?webgl
  - Very unfinished
- Add settings menu
  - Configurable framerate
  - Configurable username
