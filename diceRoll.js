const { letters, digits, sequenceOf, str } = require('./index');

const stringParser = letters.map(result => ({
  type: 'string',
  value: result,
}));

const numberParser = digits.map(result => ({
  type: 'number',
  value: Number(result),
}));

const dicerollParser = sequenceOf([digits, str('d'), digits]).map(
  ([n, _, s]) => ({
    type: 'diceroll',
    value: [Number(n), Number(s)],
  })
);

const parser = sequenceOf([letters, str(':')])
  .map(results => results[0])
  .chain(type => {
    if (type === 'string') return stringParser;

    if (type === 'number') return numberParser;

    return dicerollParser;
  });

console.log(parser.run('diceroll:2d8'));
