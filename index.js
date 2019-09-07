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

  // get the new state
  // pass the new state and new result with the function being called on nextState.result
  // parser that can parse with any normal methodology but transforms it
  map(fn) {
    return new Parser(parserState => {
      const nextState = this.parserStateTransformerFn(parserState);
      // don't modify anything if there's an error
      if (nextState.error) return nextState;

      return updateParserResult(nextState, fn(nextState.result));
    });
  }

  // chain - allows us to write contextual parser
  // can choose how we parse the next piece of data based on what we just parsed
  chain(fn) {
    return new Parser(parserState => {
      const nextState = this.parserStateTransformerFn(parserState);

      if (nextState.isError) return nextState;

      const nextParser = fn(nextState.result);

      return nextParser.parserStateTransformerFn(nextState);
    });
  }

  // applies structure to error results
  errorMap(fn) {
    return new Parser(parserState => {
      const nextState = this.parserStateTransformerFn(parserState);
      // don't modify anything if there's an error
      if (!nextState.error) return nextState;

      return updateParserResult(
        nextState,
        fn(nextState.result, nextState.index)
      );
    });
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
      `str: Tried to match "${s}", but got "${targetString.slice(
        index,
        index + 10
      )}"`
    );
  });

const letters = new Parser(parserState => {
  const { targetString, index, isError } = parserState;

  if (isError) return parserState;

  const slicedTarget = targetString.slice(index);

  if (slicedTarget.length === 0) {
    return updateParserError(
      parserState,
      `letters: Got Unexpected end of input.`
    );
  }

  const lettersRegex = /^[A-Za-z]+/;
  const regexMatch = slicedTarget.match(lettersRegex);

  if (regexMatch) {
    return updateParserState(
      parserState,
      index + regexMatch[0].length,
      regexMatch[0]
    );
  }

  return updateParserError(
    parserState,
    `letters: Couldn't match letters at index ${index}`
  );
});

const digits = new Parser(parserState => {
  const { targetString, index, isError } = parserState;

  if (isError) return parserState;

  const slicedTarget = targetString.slice(index);

  if (slicedTarget.length === 0) {
    return updateParserError(
      parserState,
      `digits: Got Unexpected end of input.`
    );
  }
  const digitsRegex = /^[0-9]+/;
  const regexMatch = slicedTarget.match(digitsRegex);

  if (regexMatch) {
    return updateParserState(
      parserState,
      index + regexMatch[0].length,
      regexMatch[0]
    );
  }

  return updateParserError(
    parserState,
    `digits: Couldn't match digits at index ${index}`
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

    if (nextState.isError) return nextState;

    return updateParserResult(nextState, results);
  });

// tries to match as many times as it can
const choice = parsers =>
  new Parser(parserState => {
    if (parserState.isError) return parserState;

    for (const p of parsers) {
      const nextState = p.parserStateTransformerFn(parserState);
      if (!nextState.isError) {
        return nextState;
      }
    }

    return updateParserError(
      parserState,
      `choice: Unable to match with any parser at index ${parserState.index}`
    );
  });

const many = parser =>
  new Parser(parserState => {
    if (parserState.isError) return parserState;

    let nextState = parserState;
    const results = [];
    let done = false;

    while (!done) {
      const testState = parser.parserStateTransformerFn(nextState);

      if (!testState.isError) {
        results.push(testState.result);
        nextState = testState;
      } else {
        done = true;
      }
    }

    return updateParserResult(nextState, results);
  });

const many1 = parser =>
  new Parser(parserState => {
    if (parserState.isError) {
      return parserState;
    }

    const nextState = parserState;
    const results = [];
    let done = false;

    while (!done) {
      const nextState = parser.parserStateTransformerFn(nextState);
      if (!nextState.isError) {
        results.push(nextState.result);
      } else {
        done = true;
      }
    }

    if (results.length === 0) {
      return updateParserError(
        parserState,
        `many1: Unable to match any input using parser @ index ${parserState.index}`
      );
    }

    return updateParserResult(nextState, results);
  });

// captures values that are seperated by some other parser
// captures a value and enforces that another value must be between those values
// eg an array [1]
const sepBy = seperatorParser => valueParser =>
  new Parser(parserState => {
    const results = [];

    // keep track of next state
    let nextState = parserState;
    // iterate until  break
    while (true) {
      // vapture first value
      const thingWeWantState = valueParser.parserStateTransformerFn(nextState);

      if (thingWeWantState.isError) break;

      results.push(thingWeWantState.result);
      nextState = thingWeWantState;

      // capture seperators
      const seperatorState = seperatorParser.parserStateTransformerFn(
        nextState
      );
      if (seperatorState.isError) break;

      nextState = seperatorState;
    }

    return updateParserResult(nextState, results);
  });

const sepBy1 = seperatorParser => valueParser =>
  new Parser(parserState => {
    if (parserState.isError) return parserState;

    const results = [];

    // keep track of next state
    let nextState = parserState;
    // iterate until  break
    while (true) {
      // vapture first value
      const thingWeWantState = valueParser.parserStateTransformerFn(nextState);

      if (thingWeWantState.isError) break;

      results.push(thingWeWantState.result);
      nextState = thingWeWantState;

      // capture seperators
      const seperatorState = seperatorParser.parserStateTransformerFn(
        nextState
      );
      if (seperatorState.isError) break;

      nextState = seperatorState;
    }

    if (results.length === 0)
      return updateParserError(
        parserState,
        `sepBy1: unable to capture any results at index ${parserState.index}`
      );
    return updateParserResult(nextState, results);
  });

const between = (leftParser, rightParser) => contentParser =>
  sequenceOf([leftParser, contentParser, rightParser]).map(
    results => results[1]
  );

// parserThunk is a thunk that returns a parser
// workaround the eagerness of JS
const lazy = parserThunk =>
  new Parser(parserState => {
    const parser = parserThunk();
    return parser.parserStateTransformerFn(parserState);
  });

module.exports = {
  str,
  letters,
  digits,
  choice,
  many,
  many1,
  sepBy,
  sepBy1,
  sequenceOf,
  between,
  lazy,
  Parser,
  updateParserState,
  updateParserError,
  updateParserResult,
};
