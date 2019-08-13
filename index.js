// parser = parserState in  => parserState out
const str = s => parserState => {
  const { targetString, index } = parserState;
  // success!
  if (targetString.slice(index).startsWith(s)) {
    return {
      ...parserState,
      result: s,
      index: index + s.length,
    };
  }

  throw new Error(
    `Tried to match ${s}, but got ${targetString.slice(index, index + 10)}`
  );
};

const run = (parser, targetString) => {
  const intialState = {
    targetString,
    index: 0,
    result: null,
  };
  return parser(intialState);
};

const p = str('hello there!');

console.log(run(p, 'hello there!'));
