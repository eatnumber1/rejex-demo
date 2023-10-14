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
// you if a given string does, or does not match the given regular expression
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
  // The return value is always a two-element list consisting of
  // [is_match, remaining_tokens]. The first element is always a bool, and the
  // second is always a list of tokens.
  // If there is a match (is_match is true), the matching tokens will be
  // removed from the remaining_tokens list. Otherwise, the original tokens is
  // returned in remaining_tokens.
  match(tokens) {
    // Split the tokens list into the first token, and a list containing
    // everything but the first.
    const [head, ...tail] = tokens

    // If the first token is not the character we're a matcher for, it's not a match.
    if (head != this.chr) return [false, tokens]

    // It's a match. Return the remaining (unmatched) tokens.
    return [true, tail]
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
  // The return value is always a two-element list consisting of
  // [is_match, remaining_tokens]. The first element is always a bool, and the
  // second is always a list of tokens.
  // If there is a match (is_match is true), the matching tokens will be
  // removed from the remaining_tokens list. Otherwise, the original tokens is
  // returned in remaining_tokens.
  match(tokens) {
    // Try matching both the left and right subexpressions. Do it in order of
    // left first, then right, so we can allow the left expression to consume
    // tokens before we pass the remainder into the right.
    const [lhs_is_match, lhs_remainder] = this.lhs.match(tokens)
    const [rhs_is_match, rhs_remainder] = this.rhs.match(lhs_remainder)

    // If either subexpressions didn't match, this expression does not match.
    if (!lhs_is_match || !rhs_is_match) return [false, tokens]

    // This expression is a match. Return the tokens remaining after both the
    // left and right subexpressions consume them.
    return [true, rhs_remainder]
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
  // The return value is always a two-element list consisting of
  // [is_match, remaining_tokens]. The first element is always a bool, and the
  // second is always a list of tokens.
  // If there is a match (is_match is true), the matching tokens will be
  // removed from the remaining_tokens list. Otherwise, the original tokens is
  // returned in remaining_tokens.
  match(tokens) {
    // Try matching both the left and right subexpressions.
    //
    // Since there's no ordering to alternation (e.g. [ab] is equivalent to
    // [ba]), we don't pass the consumed tokens from the one side into the
    // other.
    const [lhs_is_match, lhs_remainder] = this.lhs.match(tokens)
    const [rhs_is_match, rhs_remainder] = this.rhs.match(tokens)

    // If either the left or the right matched, we match, and return the
    // left/right remainder.
    if (lhs_is_match) return [true, lhs_remainder]
    if (rhs_is_match) return [true, rhs_remainder]

    // There's no match.
    return [false, tokens]
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
  // The return value is always a two-element list consisting of
  // [is_match, remaining_tokens]. The first element is always a bool, and the
  // second is always a list of tokens.
  // If there is a match (is_match is true), the matching tokens will be
  // removed from the remaining_tokens list. Otherwise, the original tokens is
  // returned in remaining_tokens.
  match(tokens) {
    let remainder = tokens
    let is_match = true
    // Repetitively apply the subexpression until it doesn't match anymore.
    while (is_match) {
      [is_match, remainder] = this.expr.match(remainder)
    }
    // Because RepetitionExpr is allowed to match zero times, we can never fail
    // to match. E.g. he*l matches the string hl
    return [true, remainder]
  }
}

// Check if a string matches a given expression.
export function regexMatch(str, expr) {
  // Convert the string into an array of chars, then feed it into the top-level
  // expression.
  const [is_match, remainder] = expr.match(str.split(''))
  // If there's any unconsumed input, it's not a match.
  if (remainder.length != 0) return false
  return is_match
}
