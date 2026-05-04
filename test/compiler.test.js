import { describe, it } from "node:test"
import assert from "node:assert"
import * as fs from "node:fs"
import compile from "../src/compiler.js"

const validPrograms = [
  ["basic function", "fn f(x: num): num { give x }", /function f/],
  ["variable declaration", "let x = 42", /const x = 42/],
  ["loop", "fn f(): void { loop i in 1..5 { log(i) } }", /for \(let i/],
  [
    "match",
    'fn f(x: num): str { match x { 1 => "a"  _ => "b" } }',
    /switch/,
  ],
  [
    "guard",
    'fn f(x: num): str { guard x > 0 else { fail "bad" } give "ok" }',
    /if \(!/,
  ],
  ["fail", 'fn f(): void { fail "oops" }', /throw new Error/],
  [
    "try catch",
    "fn f(): void { try! { fail \"x\" } catch e { log(e) } }",
    /try/,
  ],
  ["null coalescing", "let x = null ?/ 42", /\?\?/],
  ["type alias omitted", "type MyStr = str", /^\/\/ Generated/],
  ["async function", "async fn f(): void { }", /async function/],
]

const invalidPrograms = [
  ["undeclared variable", "log(undeclared)", /Undefined/],
  ["give outside function", "give 42", /give/i],
  ["syntax error", "fn {", /.*/],
  ["redeclared variable", "let x = 1\nlet x = 2", /already declared/i],
]

describe("The compiler", () => {
  for (const [scenario, source, pattern] of validPrograms) {
    it(`compiles ${scenario}`, () => {
      assert.match(compile(source), pattern)
    })
  }
  for (const [scenario, source, pattern] of invalidPrograms) {
    it(`rejects ${scenario}`, () => {
      assert.throws(() => compile(source), pattern)
    })
  }
  describe("example programs", () => {
    const files = fs.readdirSync("./examples").filter(f => f.endsWith(".rex"))
    for (const file of files) {
      it(`compiles examples/${file}`, () => {
        const source = fs.readFileSync(`./examples/${file}`, "utf-8")
        assert.ok(compile(source))
      })
    }
  })
})
