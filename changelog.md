# forkphorus changelog

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
