# forkphorus

[forkphorus.github.io](https://forkphorus.github.io)

A JavaScript/TypeScript compiler for Scratch 2 and Scratch 3 projects. forkphorus is a *fork* of [phos*phorus*](https://phosphorus.github.io/).

## Performance

Projects should, in general, run faster in forkphorus than in Scratch 3 and much faster than Scratch 2. Here's an unscientific benchmark of running [quicksort](https://scratch.mit.edu/projects/310372816/) on 200000 random items:

| Environment | Min | Avg | Max |
| ----------- | --- | --- | --- |
| Forkphorus (sb3 compiler) | 0.19 | 0.198 | 0.221 |
| Scratch 3 | 11.043 | 11.2131 | 11.599 |
| Scratch 2 |  | 17.55 |  |

(September 2019, Chrome 76)

## Building Forkphorus

You will need Git and Node.js.

```
git clone https://github.com/forkphorus/forkphorus.git
cd forkphorus
npm install
```

Start the development server with:

```
npm start
```

View the development server at http://localhost:8080/

Forkphorus is written in a mix of "vanilla" JavaScript and TypeScript. Most interface code is JavaScript, but the forkphorus runtime, compiler, and project player are written in TypeScript. The TypeScript files are in the `src` folder and changes automatically trigger rebuilds while the development server is running.

## License

Unless stated otherwise, files in this repository are [MIT Licensed](https://github.com/forkphorus/forkphorus/blob/master/LICENSE).
