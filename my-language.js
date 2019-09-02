const { digits, str, choice, sequenceOf, between, lazy } = require('./index');

// create an AST (abstract syntax tree) using the parsers created in index.js
// interpret the AST to run the input program

// apply structure to a number
const numberParser = digits.map(x => ({
  type: 'number',
  value: Number(x),
}));

// utility for finding an element between brackets
const betweenBrackets = between(str('('), str(')'));

// parses operators to find which mathematical operator was used
const operatorParser = choice([str('+'), str('-'), str('*'), str('/')]);

// recursive lazy choice between number or operation
// when capturing operation -> apply structure
const expr = lazy(() => choice([numberParser, operationParser]));

// an operation is a sequence of things
// a sequence eg: '* 10 2'
// op = * , a = 10, b = 2
const operationParser = betweenBrackets(
  sequenceOf([operatorParser, str(' '), expr, str(' '), expr])
).map(results => ({
  type: 'operation',
  value: {
    op: results[0],
    a: results[2],
    b: results[4],
  },
}));

// takes node of the tree
// look at the type of the node to see what we should do
const evaluate = ({ type, value }) => {
  if (type === 'number') return value;

  if (type === 'operation') {
    if (value.op === '+') return evaluate(value.a) + evaluate(value.b);
    if (value.op === '-') return evaluate(value.a) - evaluate(value.b);
    if (value.op === '/') return evaluate(value.a) / evaluate(value.b);
    if (value.op === '*') return evaluate(value.a) * evaluate(value.b);
  }
};

const interpreter = program => {
  const parseResult = expr.run(program);
  if (parseResult.isError) throw new Error('Invalid Program');

  return evaluate(parseResult.result);
};

const input = '(+ (* 10 2) (- (/ 50 3) 2))';

console.log(interpreter(input)); // 34.666
