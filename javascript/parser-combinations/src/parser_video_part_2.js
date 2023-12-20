const updateParserState = (state, index, result) => ({
        ...state,
        index,
        result
    });

const updateParserResult = (state, result) => ({...state, result});

const updateParserError = (state, errorMsg) => ({...state, isError : true, error : errorMsg});

const str = s => parserState => {
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
};

// parser = ParserState => ParserState
const run = (parser, targetString) => {
    const parserState = {
        targetString,
        index : 0,
        result : null,
        isError : false,
        error : null,
    };
    return parser(parserState);
}

const strParser = str("darr ke aage jeet");

const targetString = "darr ke aage jeet";
const index = 0;

console.log(    
    run(strParser, targetString)
);


// implementing sequenceOf
const sequenceOf = parsers => parserState => {
    const results = [];
    
    if(parserState.isError) {
        return parserState;
    }

    let nextState = parserState;

    for(let parser of parsers) {
        nextState = parser(nextState);
        results.push(nextState.result);
    }

    return updateParserResult(nextState,results);
};


const sequenceParser = sequenceOf([
    str("hello there!"),
    str("goodby there!"),
])


const seqResult = run(sequenceParser, "");

console.log(seqResult);