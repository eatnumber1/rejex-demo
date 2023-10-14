export class CharMatchExpr {
  constructor(chr) {
    this.chr = chr
  }

  match(tokens) {
    const [head, ...tail] = tokens
    if (head != this.chr) return [false, tokens]
    return [true, tail]
  }
}

export class ConcatExpr {
  constructor(lhs, rhs) {
    this.lhs = lhs
    this.rhs = rhs
  }

  match(tokens) {
    if (tokens.length < 2) return [false, tokens]

    const [lhs_is_match, lhs_remainder] = this.lhs.match(tokens)
    const [rhs_is_match, rhs_remainder] = this.rhs.match(lhs_remainder)

    if (!lhs_is_match || !rhs_is_match) return [false, []]

    return [true, rhs_remainder]
  }
}

export class AlternationExpr {
  constructor(lhs, rhs) {
    this.lhs = lhs
    this.rhs = rhs
  }

  match(tokens) {
    const [lhs_is_match, lhs_remainder] = this.lhs.match(tokens)
    const [rhs_is_match, rhs_remainder] = this.rhs.match(tokens)

    if (lhs_is_match) return [true, lhs_remainder]
    if (rhs_is_match) return [true, rhs_remainder]

    return [false, []]
  }
}

export class RepetitionExpr {
  constructor(expr) {
    this.expr = expr
  }

  match(tokens) {
    let remainder = tokens
    let is_match = true
    while (is_match) {
      [is_match, remainder] = this.expr.match(remainder)
    }
    return [true, remainder]
  }
}

export function regexMatch(str, expr) {
  const [is_match, remainder] = expr.match(str.split(''))
  if (remainder.length != 0) return false
  return is_match
}
