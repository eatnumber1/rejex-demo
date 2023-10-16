// This file implements a complete regular expression engine, as given by the
// formal definition of Regular Expressions at
// https://en.wikipedia.org/wiki/Regular_expression#Formal_definition
//
// In particular, it implements:
//  - concatenation (using the class ConcatExpr)
//  - alternation (using the class AlternationExpr)
//  - Kleene star (using the class RepetitionExpr)
//
// Using these three operations, all other kinds of regular expressions can be
// expressed.
//
// For simplicity, no parser is provided for the regex *language*. Instead, a
// regular expression is constructed as a tree of objects consisting of:
//  - CharMatchExpr
//  - ConcatExpr
//  - AlternationExpr
//  - RepetitionExpr
//
// When given a tree of such objects, the regexMatch function below can tell
// you if a given string does or does not match the given regular expression
// object tree.
//
// A very simple example of this would be:
//
//   regexMatch(str, new CharMatchExpr("h"))
//
// which matches strings which contain exclusively the single character "h".
//
// See the unit tests in rejex.test.js for more examples.


// Match a single character
export class CharMatchExpr {
  constructor(chr) {
    this.chr = chr
  }

  // Match against a list of character tokens.
  //
  // The return value is always an object containing the fields `is_match` and
  // `remaining`.  `is_match` is always a bool, and `remaining` second is
  // always a list of tokens.  If there is a match (`is_match` is true), the
  // matching tokens will be removed from the `remaining` list. Otherwise, the
  // original tokens are returned in `remaining`.
  match(tokens) {
    // Split the tokens list into the first token, and a list containing
    // everything but the first.
    const [head, ...tail] = tokens

    // If the first token is not the character we're a matcher for, it's not a match.
    if (head !== this.chr) return {is_match: false, remaining: tokens}

    // It's a match. Return the remaining (unmatched) tokens.
    return {is_match: true, remaining: tail}
  }
}

// Concatenate two subexpressions together. Only matches if the two
// subexpressions match.
export class ConcatExpr {
  constructor(lhs, rhs) {
    this.lhs = lhs
    this.rhs = rhs
  }

  // Match against a list of character tokens.
  //
  // The return value is always an object containing the fields `is_match` and
  // `remaining`.  `is_match` is always a bool, and `remaining` second is
  // always a list of tokens.  If there is a match (`is_match` is true), the
  // matching tokens will be removed from the `remaining` list. Otherwise, the
  // original tokens are returned in `remaining`.
  match(tokens) {
    // Try matching both the left and right subexpressions. Do it in order of
    // left first, then right, so we can allow the left expression to consume
    // tokens before we pass the remainder into the right.
    const lhs = this.lhs.match(tokens)
    const rhs = this.rhs.match(lhs.remaining)

    // If either subexpressions didn't match, this expression does not match.
    if (!lhs.is_match || !rhs.is_match) return {is_match: false, remaining: tokens}

    // This expression is a match. Return the tokens remaining after both the
    // left and right subexpressions consume them.
    return {is_match: true, remaining: rhs.remaining}
  }
}

// Alternate two subexpressions together. Matches if either of the
// subexpressions match.
export class AlternationExpr {
  constructor(lhs, rhs) {
    this.lhs = lhs
    this.rhs = rhs
  }

  // Match against a list of character tokens.
  //
  // The return value is always an object containing the fields `is_match` and
  // `remaining`.  `is_match` is always a bool, and `remaining` second is
  // always a list of tokens.  If there is a match (`is_match` is true), the
  // matching tokens will be removed from the `remaining` list. Otherwise, the
  // original tokens are returned in `remaining`.
  match(tokens) {
    // Try matching both the left and right subexpressions.
    //
    // Since there's no ordering to alternation (e.g. [ab] is equivalent to
    // [ba]), we don't pass the consumed tokens from the one side into the
    // other.
    const lhs = this.lhs.match(tokens)
    const rhs = this.rhs.match(tokens)

    // If either the left or the right matched, we match
    if (lhs.is_match || rhs.is_match) {
      // We can return either the lhs.remaining or the rhs.remaining. We
      // choose to return the shorter of the two remainders. By doing so,
      // this expression "consumes" as much of the input as possible, and
      // therefore is considered "greedy".
      let shorter_remainder = lhs.remaining
      if (lhs.remaining.length > rhs.remaining.length) {
        shorter_remainder = rhs.remaining
      }
      return {is_match: true, remaining: shorter_remainder}
    }

    // There's no match.
    return {is_match: false, remaining: tokens}
  }
}

// Repeat a subexpression. Matches if the subexpression matches *zero or more*
// times.
export class RepetitionExpr {
  constructor(expr) {
    this.expr = expr
  }

  // Match against a list of character tokens.
  //
  // The return value is always an object containing the fields `is_match` and
  // `remaining`.  `is_match` is always a bool, and `remaining` second is
  // always a list of tokens.  If there is a match (`is_match` is true), the
  // matching tokens will be removed from the `remaining` list. Otherwise, the
  // original tokens are returned in `remaining`.
  match(tokens) {
    let cur = {is_match: true, remaining: tokens}
    // Repetitively apply the subexpression until it doesn't match anymore.
    while (cur.is_match) {
      cur = this.expr.match(cur.remaining)
    }
    // Because RepetitionExpr is allowed to match zero times, we can never fail
    // to match. E.g. he*l matches the string hl
    return {is_match: true, remaining: cur.remaining}
  }
}

// Check if a string matches a given expression.
export function regexMatch(str, expr) {
  // Convert the string into an array of chars, then feed it into the top-level
  // expression.
  const m = expr.match(str.split(''))
  // If there's any unconsumed input, it's not a match.
  if (m.remaining.length !== 0) return false
  return m.is_match
}

