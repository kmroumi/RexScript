import { describe, it } from "node:test"
import assert from "node:assert"
import parse from "../src/parser.js"
import translate from "../src/analyzer.js"
import * as core from "../src/core.js"

const semanticChecks = [
  ["declaring and using a variable", "let x = 42\nlet y = x"],
  ["fn declaration and call with correct args", "fn add(a: num, b: num): num { give a + b }\nadd(1, 2)"],
  ["give inside a function", "fn f(): num { give 42 }"],
  ["await inside an async function", "async fn f(): any { give await null }"],
  ["guard with fail in else block", 'guard true else { fail "error" }'],
  ["match with wildcard as last arm", 'match 1 { 1 => "one" _ => "other" }'],
  ["nested function scopes", "fn outer(): void { fn inner(): void { } }"],
  ["loop variable in loop body", "loop i in 0..9 { let x = i }"],
  ["optional parameter", "fn f(x?: num): num { give 0 }"],
  ["type alias declaration", "type UserId = str"],
  ["pipeline expression", "null -> log"],
  ["null coalescing", 'null ?/ "default"'],
  ["exists check", "null exists"],
  ["optional chaining", "null?.prop"],
  ["ternary expression", "true ? 1 : 2"],
  ["array and object literals", "let a = [1, 2, 3]\nlet b = { x: 1 }"],
  ["template literal", "`hello`"],
  ["multiple variable declarations", "let x = 1\nlet y = 2\nlet z = 3"],
  ["try! with catch", "try! { } catch e { }"],
  ["binary and boolean expressions", "1 + 2\ntrue && false"],
  ["subtraction expression", "5 - 3"],
  ["if statement", "if true { }"],
  ["if-else-if-else chain", "if true { } else if false { } else { }"],
  ["logical or expression", "true || false"],
  ["equality expression", "1 === 2"],
  ["multiplication expression", "2 * 3"],
  ["unary not expression", "!true"],
  ["unary negation expression", "-1"],
  ["index access expression", "let a = [1, 2]\na[0]"],
  ["parenthesized expression", "(1 + 2)"],
  ["arrow function single param", "let f = x => x"],
  ["arrow function multi params", "let g = (x, y) => x + y"],
  ["arrow function no params", "let h = () => 0"],
  ["object type alias", "type Foo = { x: num }"],
  ["single-quoted string literal", "let s = 'hello'"],
  ["template literal with escape sequence", "`hello\\nworld`"],
  ["variable with explicit type annotation", "let x: num = 42"],
  ["empty array literal", "let a = []"],
  ["empty object literal", "let b = {}"],
  ["empty object type alias", "type Foo = {}"],
  ["loop with non-named-type bound expression", 'loop i in parseInt("0")..9 { }'],
  ["call to function with object type return", "fn f(): { x: num } { give { x: 1 } }\nf()"],
  ["single-arm match statement", 'match 1 { 1 => "ok" }'],
  ["arrow function with block body", "let f = x => { log(x) }"],
  ["fn declaration without return type defaults to void", "fn f() { }"],
]

const semanticErrors = [
  ["undeclared variable", "x", /Undefined variable/],
  ["redeclaring variable in same scope", "let x = 1\nlet x = 2", /Variable already declared/],
  ["give outside function", "give 42", /give used outside/],
  ["await outside async function", "await null", /await used outside/],
  ["too few arguments to function", "fn f(a: num, b: num): num { give a + b }\nf(1)", /Expected \d+ argument/],
  ["too many arguments to function", "fn f(a: num): num { give a }\nf(1, 2)", /Expected \d+ argument/],
  ["wildcard not last in match", 'match 1 { _ => "other" 1 => "one" }', /wildcard/i],
  ["guard without exit statement", "guard true else { let x = 1 }", /guard/i],
  ["loop range with non-numeric start", 'loop i in "a"..9 { }', /Expected type num/],
  ["loop range with non-numeric end", 'loop i in 0.."b" { }', /Expected type num/],
  ["redeclaring a function name", "fn f(): void { }\nfn f(): void { }", /Variable already declared/],
  ["undeclared variable in function body", "fn f(): void { x }", /Undefined variable/],
  ["await in non-async function", "fn f(): void { await null }", /await used outside/],
  ["duplicate parameter names", "fn f(x: num, x: num): num { give x }", /Variable already declared/],
  ["loop variable used after loop", "loop i in 0..9 { }\nlet x = i", /Undefined variable/],
  ["too few args with optional param shows range format", "fn f(a: num, b?: num): num { give a }\nf()", /Expected 1-2 argument/],
]

describe("The analyzer", () => {
  for (const [scenario, source] of semanticChecks) {
    it(`recognizes ${scenario}`, () => {
      assert.ok(translate(parse(source)))
    })
  }
  for (const [scenario, source, pattern] of semanticErrors) {
    it(`throws on ${scenario}`, () => {
      assert.throws(() => translate(parse(source)), pattern)
    })
  }
  it("produces the expected AST for a trivial program", () => {
    assert.deepEqual(
      translate(parse("let x = 42")),
      core.program([
        core.variableDecl(
          core.variable("x", "num"),
          Object.assign(core.numLiteral(42), { type: "num" })
        ),
      ])
    )
  })
})
