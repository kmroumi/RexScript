import { describe, it } from "node:test"
import assert from "node:assert"
import generate from "../src/generator.js"
import * as core from "../src/core.js"

const generatorChecks = [
  [
    "numeric literal",
    core.numLiteral(42),
    "42",
  ],
  [
    "string literal",
    core.strLiteral("hello"),
    '"hello"',
  ],
  [
    "boolean literal",
    core.boolLiteral(true),
    "true",
  ],
  [
    "variable declaration",
    core.variableDecl(core.variable("x", "num"), core.numLiteral(1)),
    "const x = 1",
  ],
  [
    "return statement",
    core.returnStmt(core.numLiteral(0)),
    "return 0",
  ],
  [
    "throw statement",
    core.throwStmt(core.strLiteral("oops")),
    'throw new Error("oops")',
  ],
  [
    "sync function declaration",
    core.functionDecl(
      core.functionObject("f", [], core.typeAnnotation("void"), false),
      []
    ),
    "function f() {}",
  ],
  [
    "async function declaration",
    core.functionDecl(
      core.functionObject("g", [], core.typeAnnotation("void"), true),
      []
    ),
    "async function g() {}",
  ],
  [
    "loop statement",
    core.loopStmt(
      core.variable("i", "num"),
      core.range(core.numLiteral(1), core.numLiteral(5)),
      []
    ),
    "for (let i = 1; i <= 5; i++) {}",
  ],
  [
    "match statement",
    core.matchStmt(core.variable("x", "num"), [
      core.matchArm(core.numLiteral(1), [core.returnStmt(core.strLiteral("a"))]),
      core.matchArm("_", [core.returnStmt(core.strLiteral("b"))]),
    ]),
    'switch (x) {\n  case 1:\n    return "a"\n  default:\n    return "b"\n}',
  ],
  [
    "guard statement",
    core.guardStmt(
      core.binaryExp(core.variable("x", "num"), ">", core.numLiteral(0)),
      [core.throwStmt(core.strLiteral("bad"))]
    ),
    'if (!(x > 0)) {\n  throw new Error("bad")\n}',
  ],
  [
    "if statement",
    core.ifStmt(
      core.boolLiteral(true),
      [core.expressionStmt(core.numLiteral(1))],
      [],
      null
    ),
    "if (true) {\n  1;\n}",
  ],
  [
    "try statement",
    core.tryStmt(
      [core.throwStmt(core.strLiteral("err"))],
      "e",
      [
        core.expressionStmt(
          core.callExp(core.variable("log", "any"), [core.variable("e", "any")])
        ),
      ]
    ),
    'try {\n  throw new Error("err")\n} catch (e) {\n  log(e);\n}',
  ],
  [
    "expression statement",
    core.expressionStmt(
      core.callExp(core.variable("log", "any"), [core.numLiteral(1)])
    ),
    "log(1);",
  ],
  [
    "binary expression",
    core.binaryExp(core.numLiteral(1), "+", core.numLiteral(2)),
    "1 + 2",
  ],
  [
    "unary expression",
    core.unaryExp("!", core.boolLiteral(false)),
    "!false",
  ],
  [
    "ternary expression",
    core.ternaryExp(core.boolLiteral(true), core.numLiteral(1), core.numLiteral(2)),
    "true ? 1 : 2",
  ],
  [
    "null coalesce",
    core.nullCoalesce(core.variable("x", "any"), core.numLiteral(0)),
    "x ?? 0",
  ],
  [
    "exists expression",
    core.existsExp(core.variable("x", "any")),
    "(x !== null && x !== undefined)",
  ],
  [
    "pipeline expression",
    core.pipelineExp(core.numLiteral(1), core.variable("f", "any")),
    "f(1)",
  ],
  [
    "call expression",
    core.callExp(core.variable("f", "any"), [core.numLiteral(1)]),
    "f(1)",
  ],
  [
    "member expression dot",
    core.memberExp(core.variable("a", "any"), "b", false),
    "a.b",
  ],
  [
    "member expression computed",
    core.memberExp(core.variable("a", "any"), core.numLiteral(0), true),
    "a[0]",
  ],
  [
    "optional chain",
    core.optionalChain(core.variable("a", "any"), "b"),
    "a?.b",
  ],
  [
    "arrow function",
    core.arrowFunction(
      [core.parameter("x", core.typeAnnotation("num"), false)],
      core.numLiteral(42)
    ),
    "x => 42",
  ],
  [
    "array literal",
    core.arrayLiteral([core.numLiteral(1), core.numLiteral(2)]),
    "[1, 2]",
  ],
  [
    "object literal",
    core.objectLiteral([core.property("a", core.numLiteral(1))]),
    "{ a: 1 }",
  ],
  [
    "type alias emits empty string",
    core.typeAlias("MyStr", core.typeAnnotation("str")),
    "",
  ],
  [
    "template literal with string and interpolation parts",
    core.templateLiteral([
      { kind: "TemplateChar", value: "hello " },
      { kind: "Interpolation", expression: core.variable("name", "any") },
      { kind: "TemplateChar", value: "!" },
    ]),
    "`hello ${name}!`",
  ],
  [
    "template literal fallback part kind",
    core.templateLiteral([core.variable("x", "any")]),
    "`${x}`",
  ],
  [
    "pipeline expression with call expression on right",
    core.pipelineExp(
      core.variable("data", "any"),
      core.callExp(
        core.variable("filter", "any"),
        [
          core.arrowFunction(
            [core.parameter("x", core.typeAnnotation("any"), false)],
            core.memberExp(core.variable("x", "any"), "active", false)
          ),
        ]
      )
    ),
    "filter(data, x => x.active)",
  ],
  [
    "await expression",
    core.awaitExp(core.variable("p", "any")),
    "await p",
  ],
  [
    "FunctionObject generates its name",
    core.functionObject("myFunc", [], core.typeAnnotation("void"), false),
    "myFunc",
  ],
  [
    "arrow function with multiple params",
    core.arrowFunction(
      [
        core.parameter("x", core.typeAnnotation("num"), false),
        core.parameter("y", core.typeAnnotation("num"), false),
      ],
      core.binaryExp(core.variable("x", "num"), "+", core.variable("y", "num"))
    ),
    "(x, y) => x + y",
  ],
  [
    "arrow function with block body",
    core.arrowFunction(
      [core.parameter("x", core.typeAnnotation("num"), false)],
      [core.returnStmt(core.variable("x", "num"))]
    ),
    "x => {\n  return x\n}",
  ],
  [
    "match arm array body without trailing return inserts break",
    core.matchStmt(core.variable("x", "num"), [
      core.matchArm(core.numLiteral(1), [core.expressionStmt(core.numLiteral(1))]),
      core.matchArm("_", []),
    ]),
    'switch (x) {\n  case 1:\n    1;\n    break\n  default:\n    break\n}',
  ],
]

describe("The generator", () => {
  for (const [scenario, node, expected] of generatorChecks) {
    it(`generates ${scenario}`, () => {
      assert.strictEqual(generate(node), expected)
    })
  }
  it("throws for an unknown node kind", () => {
    assert.throws(() => generate({ kind: "Unknown" }), /No generator for node kind/)
  })
})
