// Core — AST node factories for Rex Script

export function program(statements) {
  return { kind: "Program", statements }
}

export function functionDecl(func, body) {
  return {
    kind: "FunctionDeclaration",
    func,
    body,
  }
}

export function functionObject(name, params, returnType, isAsync) {
  return {
    kind: "FunctionObject",
    name,
    params,
    returnType,
    isAsync,
  }
}

export function variableDecl(variable, initializer) {
  return {
    kind: "VariableDeclaration",
    variable,
    initializer,
  }
}

export function typeAlias(name, type) {
  return {
    kind: "TypeAlias",
    name,
    type,
  }
}

export function returnStmt(expression) {
  return { kind: "ReturnStatement", expression }
}

export function loopStmt(variable, range, body) {
  return {
    kind: "LoopStatement",
    variable,
    range,
    body,
  }
}

export function matchStmt(subject, arms) {
  return {
    kind: "MatchStatement",
    subject,
    arms,
  }
}

export function matchArm(pattern, body) {
  return {
    kind: "MatchArm",
    pattern,
    body,
  }
}

export function guardStmt(condition, elseBlock) {
  return {
    kind: "GuardStatement",
    condition,
    elseBlock,
  }
}

export function ifStmt(test, consequent, alternates, otherwise) {
  return {
    kind: "IfStatement",
    test,
    consequent,
    alternates,
    otherwise,
  }
}

export function throwStmt(message) {
  return { kind: "ThrowStatement", message }
}

export function tryStmt(block, errorName, catchBlock) {
  return {
    kind: "TryStatement",
    block,
    errorName,
    catchBlock,
  }
}

export function expressionStmt(expression) {
  return { kind: "ExpressionStatement", expression }
}

export function pipelineExp(left, right) {
  return {
    kind: "PipelineExpression",
    left,
    right,
  }
}

export function binaryExp(left, operator, right) {
  return {
    kind: "BinaryExpression",
    left,
    operator,
    right,
  }
}

export function unaryExp(operator, operand) {
  return {
    kind: "UnaryExpression",
    operator,
    operand,
  }
}

export function ternaryExp(condition, consequent, alternate) {
  return {
    kind: "TernaryExpression",
    condition,
    consequent,
    alternate,
  }
}

export function nullCoalesce(left, right) {
  return {
    kind: "NullCoalesce",
    left,
    right,
  }
}

export function existsExp(operand) {
  return { kind: "ExistsExpression", operand }
}

export function awaitExp(expression) {
  return { kind: "AwaitExpression", expression }
}

export function callExp(callee, args) {
  return {
    kind: "CallExpression",
    callee,
    args,
  }
}

export function memberExp(object, property, computed) {
  return {
    kind: "MemberExpression",
    object,
    property,
    computed,
  }
}

export function optionalChain(object, property) {
  return {
    kind: "OptionalChain",
    object,
    property,
  }
}

export function arrowFunction(params, body) {
  return {
    kind: "ArrowFunction",
    params,
    body,
  }
}

export function variable(name, type) {
  return {
    kind: "Variable",
    name,
    type,
  }
}

export function parameter(name, type, optional) {
  return {
    kind: "Parameter",
    name,
    type,
    optional,
  }
}

export function numLiteral(value) {
  return { kind: "NumericLiteral", value }
}

export function strLiteral(value) {
  return { kind: "StringLiteral", value }
}

export function templateLiteral(parts) {
  return { kind: "TemplateLiteral", parts }
}

export function boolLiteral(value) {
  return { kind: "BooleanLiteral", value }
}

export function arrayLiteral(elements) {
  return { kind: "ArrayLiteral", elements }
}

export function objectLiteral(properties) {
  return { kind: "ObjectLiteral", properties }
}

export function property(key, value) {
  return {
    kind: "Property",
    key,
    value,
  }
}

export function range(start, end) {
  return {
    kind: "Range",
    start,
    end,
  }
}

export function typeAnnotation(name) {
  return { kind: "TypeAnnotation", name }
}

export function objectType(fields) {
  return { kind: "ObjectType", fields }
}
