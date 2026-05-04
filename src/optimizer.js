// Optimizer — AST-level optimizations

import * as core from "./core.js"

const constants = new Map()

function isLiteral(node) {
  return (
    node?.kind === "NumericLiteral" ||
    node?.kind === "BooleanLiteral" ||
    node?.kind === "StringLiteral"
  )
}

function isZero(node) {
  return node?.kind === "NumericLiteral" && node.value === 0
}

function isOne(node) {
  return node?.kind === "NumericLiteral" && node.value === 1
}

function isFalse(node) {
  return node?.kind === "BooleanLiteral" && node.value === false
}

function isTrue(node) {
  return node?.kind === "BooleanLiteral" && node.value === true
}

function foldBinary(op, x, y) {
  if (x.kind === "NumericLiteral" && y.kind === "NumericLiteral") {
    switch (op) {
      case "+": return core.numLiteral(x.value + y.value)
      case "-": return core.numLiteral(x.value - y.value)
      case "*": return core.numLiteral(x.value * y.value)
      case "/": return core.numLiteral(x.value / y.value)
      case "%": return core.numLiteral(x.value % y.value)
      case "<": return core.boolLiteral(x.value < y.value)
      case ">": return core.boolLiteral(x.value > y.value)
      case "<=": return core.boolLiteral(x.value <= y.value)
      case ">=": return core.boolLiteral(x.value >= y.value)
      case "===": return core.boolLiteral(x.value === y.value)
      case "!==": return core.boolLiteral(x.value !== y.value)
    }
  }
  if (x.kind === "BooleanLiteral" && y.kind === "BooleanLiteral") {
    switch (op) {
      case "&&": return core.boolLiteral(x.value && y.value)
      case "||": return core.boolLiteral(x.value || y.value)
      case "===": return core.boolLiteral(x.value === y.value)
      case "!==": return core.boolLiteral(x.value !== y.value)
    }
  }
  return null
}

function eliminateDeadCode(statements) {
  const cutoff = statements.findIndex(s => s.kind === "ReturnStatement")
  return cutoff === -1 ? statements : statements.slice(0, cutoff + 1)
}

function optimizeBlock(statements) {
  return eliminateDeadCode(statements.map(optimize))
}

function optimizeBody(body) {
  return Array.isArray(body) ? optimizeBlock(body) : optimize(body)
}

function optimize(node) {
  return optimizers[node.kind]?.(node) ?? node
}

const optimizers = {
  Program(node) {
    constants.clear()
    return core.program(optimizeBlock(node.statements))
  },

  FunctionDeclaration(node) {
    return core.functionDecl(node.func, optimizeBlock(node.body))
  },

  VariableDeclaration(node) {
    const initializer = optimize(node.initializer)
    if (isLiteral(initializer)) {
      constants.set(node.variable.name, initializer)
    }
    return core.variableDecl(node.variable, initializer)
  },

  ReturnStatement(node) {
    return core.returnStmt(optimize(node.expression))
  },

  LoopStatement(node) {
    const start = optimize(node.range.start)
    const end = optimize(node.range.end)
    return core.loopStmt(node.variable, core.range(start, end), optimizeBlock(node.body))
  },

  IfStatement(node) {
    const test = optimize(node.test)
    const consequent = optimizeBlock(node.consequent)
    const alternates = node.alternates.map(a => ({
      kind: "ElseIf",
      test: optimize(a.test),
      consequent: optimizeBlock(a.consequent),
    }))
    const otherwise = node.otherwise ? optimizeBlock(node.otherwise) : null
    return core.ifStmt(test, consequent, alternates, otherwise)
  },

  MatchStatement(node) {
    const subject = optimize(node.subject)
    const arms = node.arms.map(a =>
      core.matchArm(
        a.pattern === "_" ? "_" : optimize(a.pattern),
        optimizeBody(a.body)
      )
    )
    return core.matchStmt(subject, arms)
  },

  GuardStatement(node) {
    return core.guardStmt(optimize(node.condition), optimizeBlock(node.elseBlock))
  },

  TryStatement(node) {
    return core.tryStmt(
      optimizeBlock(node.block),
      node.errorName,
      optimizeBlock(node.catchBlock)
    )
  },

  ExpressionStatement(node) {
    return core.expressionStmt(optimize(node.expression))
  },

  BinaryExpression(node) {
    const left = optimize(node.left)
    const right = optimize(node.right)
    const folded = foldBinary(node.operator, left, right)
    if (folded) return folded
    if (node.operator === "+" && isZero(right)) return left
    if (node.operator === "+" && isZero(left)) return right
    if (node.operator === "-" && isZero(right)) return left
    if (node.operator === "*" && isOne(right)) return left
    if (node.operator === "*" && isOne(left)) return right
    if (node.operator === "/" && isOne(right)) return left
    if (node.operator === "||" && isFalse(right)) return left
    if (node.operator === "||" && isFalse(left)) return right
    if (node.operator === "&&" && isTrue(right)) return left
    if (node.operator === "&&" && isTrue(left)) return right
    return core.binaryExp(left, node.operator, right)
  },

  UnaryExpression(node) {
    const operand = optimize(node.operand)
    if (node.operator === "-" && operand.kind === "NumericLiteral") {
      return core.numLiteral(-operand.value)
    }
    if (node.operator === "!" && operand.kind === "BooleanLiteral") {
      return core.boolLiteral(!operand.value)
    }
    return core.unaryExp(node.operator, operand)
  },

  TernaryExpression(node) {
    return core.ternaryExp(
      optimize(node.condition),
      optimize(node.consequent),
      optimize(node.alternate)
    )
  },

  NullCoalesce(node) {
    return core.nullCoalesce(optimize(node.left), optimize(node.right))
  },

  PipelineExpression(node) {
    return core.pipelineExp(optimize(node.left), optimize(node.right))
  },

  CallExpression(node) {
    return core.callExp(optimize(node.callee), node.args.map(optimize))
  },

  MemberExpression(node) {
    const object = optimize(node.object)
    const property = node.computed ? optimize(node.property) : node.property
    return core.memberExp(object, property, node.computed)
  },

  ArrowFunction(node) {
    return core.arrowFunction(node.params, optimizeBody(node.body))
  },

  ArrayLiteral(node) {
    return core.arrayLiteral(node.elements.map(optimize))
  },

  ObjectLiteral(node) {
    return core.objectLiteral(
      node.properties.map(p => core.property(p.key, optimize(p.value)))
    )
  },

  Variable(node) {
    return constants.get(node.name) ?? node
  },
}

export default optimize
