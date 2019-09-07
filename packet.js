// Version: 4
// Header length: 5 * 32-bit = 20 bytes
// TOS: 0x00
// Total Length: 0x0044 (68 bytes)
// Identification: 0xad0b
// Flags and Fragments: 0x0000
// TTL: 0x40 (64 hops)
// Protocol: 0x11 (UDP)
// Header Checksum: 0x7272
// Source: 0xac1402fd (172.20.2.253)
// Destination: 0xac140006 (172.20.0.6)

// A 16 bit number: (24161)
// 0101111001100001

// And some of the different ways we might interpret this number

// 0101111001100001                 :: As one 16 bit number (24161)
// 01011110 01100001                :: As two 8 bit numbers (94, 97)
// 0101 1110 0110 0001              :: As four 4 bit numbers (5, 14, 6, 1)
// 0 1 0 1 1 1 1 0 0 1 1 0 0 0 0 1  :: As sixteen individual bits

// binary data is just a string of 1s and 0s, how we interpret those 1s and 0s defines the structure and what the values mean

const {
  Parser,
  updateParserError,
  updateParserState,
  sequenceOf,
} = require('./index');

const Bit = new Parser(parserState => {
  if (parserState.error) return parserState;
  // grab bit at index, return it inside state and update index
  // parse binary data structure with arraybuffer

  // lowest level we can work with data in node is using bytes, can't work directly with bits
  // extract byte -> extract bit from byte  (round down to nearest byte if float)
  const byteOffset = Math.floor(parserState.index / 8);

  // check byteLength using dataView, if we can't find a byte throw an error
  if (byteOffset >= parserState.targetString.byteLength) {
    return updateParserError(parserState, `Bit: Unexpected end of input`);
  }

  // look into dataView, get one unsigned int at the exact offset
  const byte = parserState.targetString.getUint8(byteOffset);
  // extract the single bit
  // bitwise and -> take each bit in the byte, compare 2 at the same position -> if they are both 1, output is also 1, otherwise output is 0

  // left shift 1 along

  // isolate bit - use modulo to divide by 8 and get the remainder -> remainder is the index into the bit we would like to isolate
  // always going to get 0 - 7, take away 7 to get reversed positioning
  const bitOffset = 7 - (parserState.index % 8);
  const result = (byte & (1 << bitOffset)) >> bitOffset;

  return updateParserState(parserState, parserState.index + 1, result);
});

const Zero = new Parser(parserState => {
  if (parserState.error) return parserState;

  const byteOffset = Math.floor(parserState.index / 8);

  if (byteOffset >= parserState.targetString.byteLength) {
    return updateParserError(parserState, `Zero: Unexpected end of input`);
  }

  const byte = parserState.targetString.getUint8(byteOffset);

  const bitOffset = 7 - (parserState.index % 8);
  const result = (byte & (1 << bitOffset)) >> bitOffset;

  // expecting 0, but got 1
  if (result !== 0)
    return updateParserError(
      parserState,
      `Zero: Expected 0, but got 1 at index ${parserState.index}`
    );

  return updateParserState(parserState, parserState.index + 1, result);
});

const One = new Parser(parserState => {
  if (parserState.error) return parserState;

  const byteOffset = Math.floor(parserState.index / 8);

  if (byteOffset >= parserState.targetString.byteLength) {
    return updateParserError(parserState, `One: Unexpected end of input`);
  }

  const byte = parserState.targetString.getUint8(byteOffset);

  const bitOffset = 7 - (parserState.index % 8);
  const result = (byte & (1 << bitOffset)) >> bitOffset;

  // expecting 1, but got 0
  if (result !== 1)
    return updateParserError(
      parserState,
      `One: Expected 1, but got 0 at index ${parserState.index}`
    );

  return updateParserState(parserState, parserState.index + 1, result);
});

const parser = sequenceOf([Bit, Bit, Bit, Bit, Bit, Bit, Bit, Bit]);
// how to use arrayBuffer
const data = new Uint8Array([234, 235]).buffer;
// can't read or write array buffers directly - need to use dataView
// dataView is a standardized way of extracting bytes, eg: extract first byte, but read at 16 bit number
const dataView = new DataView(data);
const res = parser.run(dataView);

console.log(res);
