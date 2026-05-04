import { describe, it } from "node:test"
import assert from "node:assert"
import parse from "../src/parser.js"

const syntaxChecks = [
  ["fn f(x: num): num { give x }", "fn declaration with typed params and return type"],
  ["async fn fetch(url: str): str { give url }", "async fn declaration"],
  ["fn f(x?: num): num { give 0 }", "optional parameter with ?:"],
  ["let x = 42", "let declaration"],
  ["loop i in 0..9 { }", "loop with range"],
  ['match x { 1 => "one" 2 => "two" _ => "other" }', "match with multiple arms and wildcard"],
  ['guard x > 0 else { fail "must be positive" }', "guard with else"],
  ["try! { } catch e { }", "try-catch block"],
  ['fail "something went wrong"', "fail statement"],
  ["if x exists { }", "if exists check"],
  ["data -> filter(x => x)", "pipeline expression"],
  ['name ?/ "Guest"', "null coalescing"],
  ["user?.address?.city", "optional chaining"],
  ["type UserId = str", "type alias declaration"],
  ["`Hello, {name}!`", "template literal with interpolation"],
  ["x => x * 2", "arrow function"],
  ['x > 0 ? "pos" : "neg"', "ternary expression"],
  ["[1, 2, 3]", "array literal"],
  ['{ name: "Alice", age: 30 }', "object literal"],
  ["x + y * 2 - z / 4", "binary operators"],
  ["!x", "unary not operator"],
  ["-y", "unary negation operator"],
  ["", "empty program"],
  ["fn add(a: num, b: num): num { give a + b }", "fn with multiple params"],
  ['if x > 0 { give x } else if x < 0 { give 0 } else { give 1 }', "if-else chain"],
]

const syntaxErrors = [
  ["fn f(x: num): num", "fn with no body"],
  ["loop i 0..9 { }", "loop without in"],
  ["match x arm", "match with no braces"],
  ["guard x > 0 { }", "guard with no else"],
  ["try! { }", "try without catch"],
  ["fn f() {", "unclosed brace"],
  ["let give = 5", "give as variable name"],
  ["let fn = 5", "fn as variable name"],
  ["let fail = 5", "fail as variable name"],
  ["let loop = 5", "loop as variable name"],
  ["let match = 5", "match as variable name"],
  ["let x = (a b)", "missing operator between expressions"],
]

describe("The parser", () => {
  for (const [source, scenario] of syntaxChecks) {
    it(`matches ${scenario}`, () => {
      assert.doesNotThrow(() => parse(source))
    })
  }
  for (const [source, scenario] of syntaxErrors) {
    it(`rejects ${scenario}`, () => {
      assert.throws(() => parse(source))
    })
  }
})
