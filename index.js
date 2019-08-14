const updateParserResult = (state, result) => ({
  ...state,
  result,
});
const updateParserState = (state, index, result) => ({
  ...state,
  index,
  result,
});

const updateParserError = (state, error) => ({
  ...state,
  error,
  isError: true,
});

class Parser {
  constructor(parserStateTransformerFn) {
    this.parserStateTransformerFn = parserStateTransformerFn;
  }

  run(targetString) {
    const intialState = {
      targetString,
      index: 0,
      result: null,
      error: null,
      isError: false,
    };
    return this.parserStateTransformerFn(intialState);
  }
}

// parser = parserState in  => parserState out
const str = s =>
  new Parser(parserState => {
    const { targetString, index, isError } = parserState;
    if (isError) return parserState;
    // success!

    const slicedTarget = targetString.slice(index);
    if (slicedTarget.length === 0)
      return updateParserState(
        parserState,
        `str: Tried to match "${s}" but got Unexpected end of input.`
      );
    if (slicedTarget.startsWith(s)) {
      return updateParserState(parserState, index + s.length, s);
    }

    return updateParserError(
      parserState,
      `Tried to match "${s}", but got "${targetString.slice(
        index,
        index + 10
      )}"`
    );
  });

const sequenceOf = parsers =>
  new Parser(parserState => {
    if (parserState.isError) return parserState;
    const results = [];

    let nextState = parserState;

    // loop through each parser and get next state
    for (const p of parsers) {
      // next state is running the parser on the old state
      nextState = p.parserStateTransformerFn(nextState);
      results.push(nextState.result);
    }

    return updateParserResult(nextState, results);
  });

const p = sequenceOf([str('hello there!'), str('goodbye there!')]);

console.log(p.run('hello there!goodbye there!'));
