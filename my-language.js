const { digits, str, choice, sequenceOf, between, lazy } = require('./index');

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
