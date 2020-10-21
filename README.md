# forkphorus

[forkphorus.github.io](https://forkphorus.github.io)

A JavaScript/TypeScript compiler for Scratch 3, 2, and 1 projects. forkphorus is a *fork* of [phos*phorus*](https://phosphorus.github.io/).

## Build Steps

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

Unless stated otherwise (there are exceptions), files in this repository are [MIT Licensed](LICENSE).
