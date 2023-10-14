import { regexMatch, CharMatchExpr, ConcatExpr, AlternationExpr, RepetitionExpr } from './rejex.mjs'

test('char match', () => {
  expect(regexMatch("", new CharMatchExpr("h"))).toBe(false);
  expect(regexMatch("h", new CharMatchExpr("h"))).toBe(true);
  expect(regexMatch("he", new CharMatchExpr("h"))).toBe(false);
});

test('concat short', () => {
  expect(regexMatch("he", new ConcatExpr(new CharMatchExpr("h"), new CharMatchExpr("e")))).toBe(true);
});

test('concat long', () => {
  const expr =
    new ConcatExpr(  // (hell)o
      new ConcatExpr(  // (he)(ll)
        new ConcatExpr(  // he
          new CharMatchExpr("h"),
          new CharMatchExpr("e")),
        new ConcatExpr(  // ll
          new CharMatchExpr("l"),
          new CharMatchExpr("l"))),
      new CharMatchExpr("o"))
  expect(regexMatch("hello", expr)).toBe(true);
});

test('concat incomplete string', () => {
  const expr =
    new ConcatExpr(  // he
      new CharMatchExpr("h"),
      new CharMatchExpr("e"))
  expect(regexMatch("h", expr)).toBe(false);
});

test('concat too much string', () => {
  const expr =
    new ConcatExpr(  // he
      new CharMatchExpr("h"),
      new CharMatchExpr("e"))
  expect(regexMatch("hel", expr)).toBe(false);
});

test('alternation short', () => {
  const expr =
    new AlternationExpr(  // [he]
      new CharMatchExpr("h"),
      new CharMatchExpr("e"))
  expect(regexMatch("", expr)).toBe(false);
  expect(regexMatch("h", expr)).toBe(true);
  expect(regexMatch("e", expr)).toBe(true);
  expect(regexMatch("he", expr)).toBe(false);
});

test('alternation long', () => {
  // [hello]
  const expr =
    new AlternationExpr(  // (hell)o
      new AlternationExpr(  // (he)(ll)
        new AlternationExpr(  // he
          new CharMatchExpr("h"),
          new CharMatchExpr("e")),
        new AlternationExpr(
          new CharMatchExpr("l"),
          new CharMatchExpr("l"))),
      new CharMatchExpr("o"))
  expect(regexMatch("h", expr)).toBe(true);
  expect(regexMatch("e", expr)).toBe(true);
  expect(regexMatch("l", expr)).toBe(true);
  expect(regexMatch("o", expr)).toBe(true);
  expect(regexMatch("x", expr)).toBe(false);
  expect(regexMatch("hello", expr)).toBe(false);
  expect(regexMatch("", expr)).toBe(false);
});

test('repetition short', () => {
  const expr =
    new RepetitionExpr(  // h*
      new CharMatchExpr("h"))
  expect(regexMatch("", expr)).toBe(true);
  expect(regexMatch("h", expr)).toBe(true);
  expect(regexMatch("hh", expr)).toBe(true);
  expect(regexMatch("hhh", expr)).toBe(true);
  expect(regexMatch("hhhh", expr)).toBe(true);
});

test('repetition wrong char', () => {
  // h*
  const expr = new RepetitionExpr(new CharMatchExpr("h"))
  expect(regexMatch("g", expr)).toBe(false);
});

test('complex repetition', () => {
  const expr =
    new RepetitionExpr(  // [he]*
      new AlternationExpr(  // [he]
        new CharMatchExpr("h"),
        new CharMatchExpr("e")))
  expect(regexMatch("", expr)).toBe(true);
  expect(regexMatch("h", expr)).toBe(true);
  expect(regexMatch("hhhhh", expr)).toBe(true);
  expect(regexMatch("e", expr)).toBe(true);
  expect(regexMatch("eeeee", expr)).toBe(true);
  expect(regexMatch("heheh", expr)).toBe(true);
  expect(regexMatch("hefeh", expr)).toBe(false);
});

test('h[e3]l*o|wo[r4]ld', () => {
  const expr =
    new AlternationExpr(  // h[e3]l*o|wo[r4]ld
      new ConcatExpr(  // (h[e3]l*)o
        new ConcatExpr(  // (h[e3])l*
          new ConcatExpr(  // h[e3]
            new CharMatchExpr("h"),
            new AlternationExpr(  // [e3]
              new CharMatchExpr("e"),
              new CharMatchExpr("3"))),
          new RepetitionExpr(  // l*
            new CharMatchExpr("l"))),
        new CharMatchExpr("o")),
      new ConcatExpr(  // (wo[r4])ld
        new ConcatExpr(  // (wo)[r4]
          new ConcatExpr(  // wo
            new CharMatchExpr("w"),
            new CharMatchExpr("o")),
          new AlternationExpr(  // [r4]
            new CharMatchExpr("r"),
            new CharMatchExpr("4"))),
        new ConcatExpr(  // ld
          new CharMatchExpr("l"),
          new CharMatchExpr("d"))))

  expect(regexMatch("hello", expr)).toBe(true);
  expect(regexMatch("hellllllo", expr)).toBe(true);
  expect(regexMatch("heo", expr)).toBe(true);
  expect(regexMatch("h3o", expr)).toBe(true);
  expect(regexMatch("h3llo", expr)).toBe(true);
  expect(regexMatch("world", expr)).toBe(true);
  expect(regexMatch("wo4ld", expr)).toBe(true);
  expect(regexMatch("worl", expr)).toBe(false);
  expect(regexMatch("hellllll", expr)).toBe(false);
});
