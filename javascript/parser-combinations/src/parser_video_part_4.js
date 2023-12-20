class Parser {
    constructor(parserStateTransformerFunction) {
        this.parserStateTransformerFunction = parserStateTransformerFunction;
    }

    run(targetString) {
        const initialState = {
            targetString,
            index : 0,
            result : null,
            isError : false,
            error : null,
        };

        return this.parserStateTransformerFunction(initialState);
    }

    parse(parserState) {
        return this.parserStateTransformerFunction(parserState);
    }

    map(fn) {
        return new Parser(
            parserState => {
                const nextState = this.parse(parserState);

                if(nextState.isError) return nextState;

                return updateParserResult(nextState, fn(nextState.result));
            }
        );
    }

    errorMap(fn) {
        return new Parser(parserState => {
            const nextState = this.parse(parserState);
            if(!nextState.isError) return nextState;

            return updateParserError(nextState, fn(nextState.error, nextState.index));
        });
    }

    chain(nextParserGenerator) {
        const newTransformationFunction = parserState => {
            const newParserState = this.parserStateTransformerFunction(parserState);

            if(newParserState.isError) return newParserState;

            const nextParser = nextParserGenerator(newParserState.result);

            return nextParser.parserStateTransformerFunction(newParserState);
        };

        return new Parser(newTransformationFunction);
    }

}

const updateParserState = (state, index, result) => ({
        ...state,
        index,
        result
    });

const updateParserResult = (state, result) => ({...state, result});

const updateParserError = (state, errorMsg) => ({...state, isError : true, error : errorMsg});

const str = s => new Parser(parserState => {
    const {
        targetString,
        index,
        isError
    } = parserState;

    if(isError){
        return parserState;
    }

    const slicedTarget = targetString.slice(index);
    if(slicedTarget.length === 0) {
        return updateParserError(parserState, `str : Tried to match ${s}, but got unexpected end of input`);
    }

    if(slicedTarget.startsWith(s)){
        return updateParserState(parserState, (index + s.length), s)
    }

    return updateParserError(parserState, `Tried to match ${s}, but got ${targetString}`)
});

const strParser = str("darr ke aage jeet");

const targetString = "darr ke aage jee";

// console.log(
//     strParser
//     .map(result => result.toUpperCase())
//     .errorMap((msg, index) => `Expected correct sentece @ ${index}`)
//     .run(targetString)
//     );


// implementing sequenceOf
const sequenceOf = parsers => new Parser(parserState => {
    const results = [];
    
    if(parserState.isError) {
        return parserState;
    }

    let nextState = parserState;

    for(let parser of parsers) {
        nextState = parser.parse(nextState);
        results.push(nextState.result);
    }

    if(nextState.isError) return nextState;
    
    return updateParserResult(nextState,results);
});

const choice = parsers => new Parser(parserState => {   
    if(parserState.isError) {
        return parserState;
    }

    for(let parser of parsers) {
        const nextState = parser.parse(parserState);
        if(!nextState.isError) return nextState;
    }

    return updateParserError(parserState, `choice : Unable to match with any choice at index ${parserState.index}`);
});

const many = parser => new Parser(parserState => {
    if(parserState.isError) {
        return parserState;
    }

    let nextState = parserState;
    const results = [];

    let notDone = true;

    while(notDone) {
        let testState = parser.parse(nextState);
        if(!testState.isError) {
            results.push(testState.result);
            nextState = testState;
        } else {
            notDone = false;
        }
    }

    return updateParserResult(nextState, results);
});

const sequenceParser = sequenceOf([
    str("hello there!"),
    str("goodby there!"),
])


const seqResult = sequenceParser.run("hello there!goodby there!");

// console.log(seqResult);

const lettersRegex = /^[A-Za-z]+/;

function lettersParsingFunction(parserState){
    const { targetString, index, isError } = parserState;

    if(isError) return parserState;

    const slicedTarget = targetString.slice(index);

    if(slicedTarget.length == 0) return updateParserError(parserState, `letters : Unexpected end of input`);

    const matches = slicedTarget.match(lettersRegex);

    if(matches) {
        return updateParserState(parserState, (index + matches[0].length), matches[0]);
    }

    return updateParserError(parserState, `letters : Coulnd't match letters @ index ${index}`);
}

const letters = new Parser(lettersParsingFunction)
// console.log(letters.run("run"));

const digitRegex = /^[0-9]+/;

function digitsParsingFunction(parserState){
    // console.log("digitsParsingFunction", parserState);
    const { targetString, index, isError } = parserState;
    
    if(isError) return parserState;
    
    const slicedTarget = targetString.slice(index);
    
    if(slicedTarget.length == 0) return updateParserError(parserState, `digits : Unexpected end of input`);
    
    const matches = slicedTarget.match(digitRegex);
    
    if(matches) {
        return updateParserState(parserState, (index + matches[0].length), matches[0]);
    }
    
    return updateParserError(parserState, `digits : No match found at index ${index}`);
}

const digits = new Parser(digitsParsingFunction)
// console.log(digits.run("234"));

const seqParser2 = sequenceOf([letters, digits, letters]);

// console.log(seqParser2.run("h2o"))

const choiceParser = choice([digits, letters]);

// console.log("string", choiceParser.run("string"));
// console.log("digits", choiceParser.run("13443"));
// console.log("digits", choiceParser.run("13443abcd1234"));

const manyParser = many(choice([digits, letters]));
// console.log(manyParser.run("h2o"))

const between = (leftParser, rightParser) => contentParser => sequenceOf([leftParser, contentParser, rightParser]).map(results => results[1]);

const betweenParens = between(str("("), str(")"));
const betweenParensParser = betweenParens(letters);

// console.log(betweenParensParser.run("(abc)"));

// trying to parser data types like this
// string:hello
// number:42
// diceroll:2d8

const stringResult = { type : "string", value : "hello"};
const numberResult = {type : "number", value : 42};
const dicerollResult = { type : "diceroll", value : [2, 8]};

const colonParser = str(":");

const stringParser = letters.map(result => ({
    type : "string",
    value : result,
}));

const numberParser = digits.map(result => ({
    type : "number",
    value : Number(result),
}));

const dicerollParser = sequenceOf([digits, str("d"), digits]).map(([times, _, typeOfDice]) => ({ type : "diceroll", value : [Number(times), Number(typeOfDice)]}));

const colonDataParser = sequenceOf([letters, colonParser])
.map(results => results[0])
.chain(type => {
    if(type == 'string') return stringParser;
    if(type == 'number') return numberParser;

    return dicerollParser;
});

// console.log(
//     colonDataParser.run("diceroll:2d8")
// );


// recursive parsing
const sepBy = separatorParser => valueParser => new Parser(parserState => {
    const results = [];
    let nextState = parserState;

    while(true){
        const currentValueState = valueParser.parserStateTransformerFunction(nextState);
        if(currentValueState.isError) break;

        results.push(currentValueState.result);
        
        nextState = currentValueState;

        const currentSeparatorState = separatorParser.parserStateTransformerFunction(nextState);
        if(currentSeparatorState.isError) break;

        nextState = currentSeparatorState;
    }

    return updateParserResult(nextState, results);
});

const sepBy1 = separatorParser => valueParser => new Parser(parserState => {
    const results = [];
    let nextState = parserState;

    while(true){
        const currentValueState = valueParser.parserStateTransformerFunction(nextState);
        if(currentValueState.isError) break;

        results.push(currentValueState.result);
        
        nextState = currentValueState;

        const currentSeparatorState = separatorParser.parserStateTransformerFunction(nextState);
        if(currentSeparatorState.isError) break;

        nextState = currentSeparatorState;
    }

    if(results.length === 0) {
        return updateParserError(parserState, `sepBy1 : Unable to capture any results at indes ${parserState.index}`);
    }

    return updateParserResult(nextState, results);
});


const lazy = parserThunk => new Parser(parserState => {
    const parser = parserThunk();
    return parser.parse(parserState);
});

const betweenSquareBrackets = between(str("["), str("]"));
const commaSeparated = sepBy(str(","));

const terminalParser = choice([digits.map(num => Number(num)), lazy(() => integerArrayParser)])
const integerArrayParser = betweenSquareBrackets(commaSeparated(terminalParser));

// console.log(
//     integerArrayParser.run("[1,2,[3,4],6]")
// );

// micro language 

const langNumberParser = digits.map(x => ({type : 'number', value : Number(x)}));
const langOperatorParsers = choice([
    str("*"),
    str("+"),
    str("-"),
    str("/"),
]);

const expr = lazy(() => choice([langNumberParser, langOperationParser]));

const langOperationParser = betweenParens(sequenceOf([
    langOperatorParsers,
    str(" "),
    expr,
    str(" "),
    expr
])).map(results => ({
    type: "operation",
    value : {
        op : results[0],
        a : results[2],
        b : results[4],
    }
}));

const testExpression1 = "(+ (* 10 2) (- (/ 50 3) 2))";

// console.log("expr", expr.run("(- (/ 50 3))"));
const ast = langOperationParser.run(testExpression1);
// console.log("langOperationParser", langOperationParser.run(testExpression1));

const evaluate = node => {
    if(node.type === 'number') {
        return node.value;
    }

    if(node.type === "operation") {
        if(node.value.op === "+"){
            return evaluate(node.value.a) + evaluate(node.value.b);
        }
        if(node.value.op === "-"){
            return evaluate(node.value.a) - evaluate(node.value.b);
        }
        if(node.value.op === "*"){
            return evaluate(node.value.a) * evaluate(node.value.b);
        }
        if(node.value.op === "/"){
            return evaluate(node.value.a) / evaluate(node.value.b);
        }
    }
}

const interpreter = program => {
    const codeStructure = expr.run(program);

    if(codeStructure.isError) throw new Error("Invalid program");

    return evaluate(codeStructure.result);
}

console.log("testExpression1", interpreter(testExpression1));