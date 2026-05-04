import { describe, it } from "node:test"
import assert from "node:assert"
import optimize from "../src/optimizer.js"
import * as core from "../src/core.js"

const x = core.variable("x", "num")

describe("The optimizer", () => {
  describe("constant folding", () => {
    const cases = [
      [
        "2 + 3",
        core.binaryExp(core.numLiteral(2), "+", core.numLiteral(3)),
        core.numLiteral(5),
      ],
      [
        "10 - 4",
        core.binaryExp(core.numLiteral(10), "-", core.numLiteral(4)),
        core.numLiteral(6),
      ],
      [
        "2 * 3",
        core.binaryExp(core.numLiteral(2), "*", core.numLiteral(3)),
        core.numLiteral(6),
      ],
      [
        "8 / 2",
        core.binaryExp(core.numLiteral(8), "/", core.numLiteral(2)),
        core.numLiteral(4),
      ],
      [
        "7 % 3",
        core.binaryExp(core.numLiteral(7), "%", core.numLiteral(3)),
        core.numLiteral(1),
      ],
      [
        "true && false",
        core.binaryExp(core.boolLiteral(true), "&&", core.boolLiteral(false)),
        core.boolLiteral(false),
      ],
      [
        "true || false",
        core.binaryExp(core.boolLiteral(true), "||", core.boolLiteral(false)),
        core.boolLiteral(true),
      ],
      [
        "-numLiteral(5)",
        core.unaryExp("-", core.numLiteral(5)),
        core.numLiteral(-5),
      ],
      [
        "!boolLiteral(true)",
        core.unaryExp("!", core.boolLiteral(true)),
        core.boolLiteral(false),
      ],
      [
        "3 < 5",
        core.binaryExp(core.numLiteral(3), "<", core.numLiteral(5)),
        core.boolLiteral(true),
      ],
      [
        "3 > 1",
        core.binaryExp(core.numLiteral(3), ">", core.numLiteral(1)),
        core.boolLiteral(true),
      ],
      [
        "2 <= 5",
        core.binaryExp(core.numLiteral(2), "<=", core.numLiteral(5)),
        core.boolLiteral(true),
      ],
      [
        "5 >= 3",
        core.binaryExp(core.numLiteral(5), ">=", core.numLiteral(3)),
        core.boolLiteral(true),
      ],
      [
        "4 === 4 (numbers)",
        core.binaryExp(core.numLiteral(4), "===", core.numLiteral(4)),
        core.boolLiteral(true),
      ],
      [
        "4 !== 5 (numbers)",
        core.binaryExp(core.numLiteral(4), "!==", core.numLiteral(5)),
        core.boolLiteral(true),
      ],
      [
        "true === true (booleans)",
        core.binaryExp(core.boolLiteral(true), "===", core.boolLiteral(true)),
        core.boolLiteral(true),
      ],
      [
        "false !== true (booleans)",
        core.binaryExp(core.boolLiteral(false), "!==", core.boolLiteral(true)),
        core.boolLiteral(true),
      ],
    ]
    for (const [scenario, input, expected] of cases) {
      it(`folds ${scenario}`, () => {
        assert.deepEqual(optimize(input), expected)
      })
    }
  })

  describe("identity elimination", () => {
    const cases = [
      ["x + 0", core.binaryExp(x, "+", core.numLiteral(0)), x],
      ["x - 0", core.binaryExp(x, "-", core.numLiteral(0)), x],
      ["x * 1", core.binaryExp(x, "*", core.numLiteral(1)), x],
      ["x / 1", core.binaryExp(x, "/", core.numLiteral(1)), x],
      ["x || false", core.binaryExp(x, "||", core.boolLiteral(false)), x],
      ["x && true", core.binaryExp(x, "&&", core.boolLiteral(true)), x],
      ["0 + x", core.binaryExp(core.numLiteral(0), "+", x), x],
      ["1 * x", core.binaryExp(core.numLiteral(1), "*", x), x],
      ["false || x", core.binaryExp(core.boolLiteral(false), "||", x), x],
      ["true && x", core.binaryExp(core.boolLiteral(true), "&&", x), x],
    ]
    for (const [scenario, input, expected] of cases) {
      it(`eliminates identity in ${scenario}`, () => {
        assert.deepEqual(optimize(input), expected)
      })
    }
  })

  describe("dead code elimination", () => {
    it("removes statements after a return in the middle", () => {
      const input = core.program([
        core.expressionStmt(core.numLiteral(1)),
        core.returnStmt(core.numLiteral(0)),
        core.expressionStmt(core.numLiteral(2)),
      ])
      const expected = core.program([
        core.expressionStmt(core.numLiteral(1)),
        core.returnStmt(core.numLiteral(0)),
      ])
      assert.deepEqual(optimize(input), expected)
    })

    it("removes all statements after a leading return", () => {
      const input = core.program([
        core.returnStmt(core.numLiteral(0)),
        core.expressionStmt(core.numLiteral(1)),
        core.expressionStmt(core.numLiteral(2)),
      ])
      const expected = core.program([core.returnStmt(core.numLiteral(0))])
      assert.deepEqual(optimize(input), expected)
    })
  })

  it("optimizes an if statement with else-if and else branches", () => {
    const input = core.ifStmt(
      core.boolLiteral(true),
      [core.expressionStmt(core.numLiteral(1))],
      [{ kind: "ElseIf", test: core.boolLiteral(false), consequent: [core.expressionStmt(core.numLiteral(2))] }],
      [core.expressionStmt(core.numLiteral(3))]
    )
    assert.deepEqual(optimize(input), core.ifStmt(
      core.boolLiteral(true),
      [core.expressionStmt(core.numLiteral(1))],
      [{ kind: "ElseIf", test: core.boolLiteral(false), consequent: [core.expressionStmt(core.numLiteral(2))] }],
      [core.expressionStmt(core.numLiteral(3))]
    ))
  })

  it("leaves a non-foldable unary expression unchanged", () => {
    const v = core.variable("q", "any")
    assert.deepEqual(optimize(core.unaryExp("!", v)), core.unaryExp("!", v))
  })

  it("optimizes sub-expressions of a ternary expression", () => {
    const input = core.ternaryExp(core.boolLiteral(true), core.numLiteral(1), core.numLiteral(2))
    assert.deepEqual(
      optimize(input),
      core.ternaryExp(core.boolLiteral(true), core.numLiteral(1), core.numLiteral(2))
    )
  })

  it("optimizes both sides of a pipeline expression", () => {
    const input = core.pipelineExp(core.numLiteral(1), core.variable("fn1", "any"))
    assert.deepEqual(optimize(input), core.pipelineExp(core.numLiteral(1), core.variable("fn1", "any")))
  })

  it("optimizes the body of an arrow function", () => {
    const param = core.parameter("x", core.typeAnnotation("any"), false)
    const input = core.arrowFunction([param], core.numLiteral(42))
    assert.deepEqual(optimize(input), core.arrowFunction([param], core.numLiteral(42)))
  })

  it("optimizes each element of an array literal", () => {
    const input = core.arrayLiteral([core.numLiteral(1), core.numLiteral(2)])
    assert.deepEqual(optimize(input), core.arrayLiteral([core.numLiteral(1), core.numLiteral(2)]))
  })

  it("optimizes property values in an object literal", () => {
    const input = core.objectLiteral([core.property("a", core.numLiteral(1))])
    assert.deepEqual(optimize(input), core.objectLiteral([core.property("a", core.numLiteral(1))]))
  })

  it("passes through a node with no optimizer unchanged", () => {
    const lit = core.numLiteral(99)
    assert.deepEqual(optimize(lit), lit)
  })

  it("optimizes an if statement without an else branch", () => {
    const input = core.ifStmt(
      core.boolLiteral(true),
      [core.expressionStmt(core.numLiteral(1))],
      [],
      null
    )
    assert.deepEqual(
      optimize(input),
      core.ifStmt(core.boolLiteral(true), [core.expressionStmt(core.numLiteral(1))], [], null)
    )
  })

  it("does not fold boolean literals with a non-boolean operator", () => {
    const input = core.binaryExp(core.boolLiteral(true), "+", core.boolLiteral(false))
    assert.deepEqual(optimize(input), core.binaryExp(core.boolLiteral(true), "+", core.boolLiteral(false)))
  })

  it("propagates constants through variable use", () => {
    const input = core.program([
      core.variableDecl(core.variable("k", "num"), core.numLiteral(7)),
      core.expressionStmt(core.variable("k", "num")),
    ])
    const expected = core.program([
      core.variableDecl(core.variable("k", "num"), core.numLiteral(7)),
      core.expressionStmt(core.numLiteral(7)),
    ])
    assert.deepEqual(optimize(input), expected)
  })

  it("optimizes a computed member expression", () => {
    const input = core.memberExp(core.variable("a", "any"), core.numLiteral(0), true)
    assert.deepEqual(optimize(input), core.memberExp(core.variable("a", "any"), core.numLiteral(0), true))
  })
})
