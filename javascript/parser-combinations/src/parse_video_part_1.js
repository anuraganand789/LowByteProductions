const A = require('arcsecond');

const helloParser = A.str("hello");
const worldParser = A.str("world");

const choiceParser = A.choice([helloParser, worldParser]);
const manyParser = A.many(choiceParser);

// console.log(manyParser.run('hellohellohelloworldworldhello'))

// capturing objects

const manyHelloParser = A.many(A.str("hello")).map(hellos => hellos.map(hello => hello.toUpperCase()).join(""));
console.log(manyHelloParser.run("hellohellohellohello"));

// chekcing sequence of 

const sequenceParser = A.sequenceOf([
    A.letters,
    A.digits,
    A.str("hello"),
    A.many(A.char(' ')),
    A.str("world"),
    A.endOfInput
]);

// console.log(sequenceParser.run("adadflkj234324hello   world"));

// make tree structure

const tag = type => value => ({type, value});

const sequenceParser2 = A.sequenceOf([
    A.sequenceOf([ A.letters, A.digits, ]).map(tag("letterDigits")),
    A.str("hello").map(tag("string")),
    A.many(A.str(" ")).map(tag("whitespace")),
    A.str("world").map(tag("string")),
    A.endOfInput.map(tag("endOfInput")),
]).map(tag("tree"));

console.log(
    // sequenceParser2.run("dkadajf12334hello   world")
);

// map individual datatypes

const sequenceParser3 = A.sequenceOf([
    A.sequenceOf([ A.letters, A.digits, ]).map(tag("letterDigits")),
    A.str("hello").map(tag("string")),
    A.many(A.str(" ").map("whitespace")).map(tag("space")),
    A.str("world").map(tag("string")),
    A.endOfInput.map(tag("endOfInput")),
])
// .map(tag("tree"));

console.log(
    sequenceParser3.run("dkadajf12334hello   world")
);