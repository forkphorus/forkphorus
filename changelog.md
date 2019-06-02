# forkphorus changelog

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
