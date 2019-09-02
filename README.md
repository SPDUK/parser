# parser

A Parser Combinator built from scratch, I plan to use it to create my own small programming language later on.

At the moment it's just for fun to learn how parsing works.

`index.js` Is the main parser combinator library. It accepts several parsers and returns a new parser as the output, composing them together to (hopefully) create any type of parser needed.

`my-language.js` contains a small language that parses the input and creates an AST, then a basic interpreter figures out what type of actions are being used to then call the correct mathematical function and return the value.

`diceRoll.js` is a small parser to figure out the values being passed in, it parses `diceroll:2d8` into `{type: 'diceroll', value: [2, 8]}`
