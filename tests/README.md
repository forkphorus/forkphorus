# Test Suite

Test suite for forkphorus. Automatically runs a few Scratch projects and validates they function correctly.

To visit the test suite: [https://forkphorus.github.io/tests/suite.html](https://forkphorus.github.io/tests/suite.html)

To visit the test suite in benchmark mode: [https://forkphorus.github.io/tests/suite.html?benchmark](https://forkphorus.github.io/tests/suite.html?benchmark) (runs each test 50 times)

## Tests

| Test | Description |
| ---- | ----------- |
| `sb2/sb2-template.sb2` | Example sb2 test |
| `sb3/sb3-template.sb3` | Example sb3 test |
| `sb3/operators.sb3` (disabled) | Tests some operators. |
| `sb2/operators.sb2` (disabled) | Tests some operators. |
| `sb2/pen-colors.sb2` (disabled) | Tests the color of pen. |
| `sb3/quicksort.sb3` | Implements quicksort and insertion sort. Based on https://scratch.mit.edu/projects/142449228/ |
| `sb3/befunge-eratosthenes.sb3` | A Befunge 93 interpreter running the Sieve of Eratosthenes. Based on https://scratch.mit.edu/projects/237437817/ using the code from https://esolangs.org/wiki/Befunge#Sieve_of_Eratosthenes |
| `sb3/string-functions.sb3` | Tests some algorithms related to strings. Based on https://scratch.mit.edu/projects/167183861/ |
| `regressions/*` | Tests fixes for bugs. The filename is the GitHub issue it is a test for. |

All project files are [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) licensed because that's what Scratch uses.

## Writing Tests

Tests are written as Scratch projects and executed by the compiler.

The easiest way to write a new test is by copying the template file, `sb3/sb3-template.sb3`. You write the behavior you want to test in a `When green flag clicked` block, and you check that they function correctly. For example, you might move a Sprite, then check that the coordinates match what you expect.

The template project provides some custom blocks. The custom blocks `OK` (or `OKAY`) and `FAIL` are treated specially during the tests; their definition is replaced with a special JavaScript implementation during the test (whatever you write in them is ignored and is only a development convenience).

When `FAIL` is used (with an optional message), the project will stop execution and the test is marked as failed. When `OK`/`OKAY` is used (with an optional message), the project will stop execution and the test is marked as passed. Either `OK` or `FAIL` must be executed exactly once.

`assertTrue` is a utility function that calls `FAIL` with a supplied message when the given boolean is false. `assertFalse` is the opposite.

Try to remove all unused costumes and sounds to keep the files small.

### Writing Scratch 2 Tests

The same process as writing Scratch 3 tests (described above), but just save them as .sb2 instead of .sb3. The template file is `sb2/sb2-template.sb2`.

### Adding it to the tests

Open tests.js and add the path to your test to `const tests = [...`.
