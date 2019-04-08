### Scratch 3 Projects

| Project | Description |
|---------|-------------|
| `sb3/sb3-template.sb3` | Tests the test suite itself. Acts as a template for other test projects. |
| `sb3/quicksort.sb3` | Implements quicksort and insertion sort. Based on https://scratch.mit.edu/projects/142449228/ |
| `sb3/befunge-eratosthenes.sb3` | A Befunge 93 interpreter running the Sieve of Eratosthenes. Based on https://scratch.mit.edu/projects/237437817/ using the code from https://esolangs.org/wiki/Befunge#Sieve_of_Eratosthenes |
| `sb3/string-functions.sb3` | Tests some algorithms related to strings. Based on https://scratch.mit.edu/projects/167183861/ |
| `sb3/operators.sb3` | Tests Scratch operator blocks and their behavior in certain edge cases. Currently expected to fail. |

### Writing Scratch 3 Tests

The easiest way to write a new test is by copying `sb3/sb3-template.sb3`. When the green flag is clicked, you should do some operations and then check that they worked correctly.

If the operation did not work as expected, then call the `FAIL` block, optionally with a string explaining why it failed. Forkphorus will its definition with some custom JavaScript when it is being tested.

If the operation did work as expected, then call the `OKAY` or `OK` block, optionally providing some extra information. These custom blocks will, like `FAIL`, be replaced during tests.

All projects must run `FAIL` or `OK` once. The test will end when either of these is run.

### Scratch 2 Tests

Eventually
