// Analyzer — semantic analysis and type checking

import * as core from "./core.js"

class Context {
  constructor(parent = null) {
    this.parent = parent
    this.bindings = new Map()
  }

  get(name, at) {
    if (this.bindings.has(name)) return this.bindings.get(name)
    else if (this.parent) return this.parent.get(name, at)
    else error(`Undefined variable: ${name}`, at)
  }

  set(name, value, at) {
    if (this.bindings.has(name)) error(`Variable already declared: ${name}`, at)
    this.bindings.set(name, value)
  }
}

function error(message, at) {
  const prefix = at.getLineAndColumnMessage()
  throw new Error(`${prefix}${message}`)
}

function validate(condition, message, at) {
  if (!condition) error(message, at)
}

function typeOf(value) {
  return value?.type ?? typeof value
}

function validateType(expression, expectedType, at) {
  const actualType = typeOf(expression)
  const isNamedType = ["num", "str", "bool", "any", "void"].includes(actualType)
  if (!isNamedType) return
  validate(
    actualType === expectedType || actualType === "any",
    `Expected type ${expectedType}, got ${actualType}`,
    at
  )
}

function validateCallable(value, at) {
  validate(value?.kind === "FunctionObject", "Value is not callable", at)
}

function validateParamCount(func, args, at) {
  const required = func.params.filter(p => !p.optional).length
  const total = func.params.length
  validate(
    args.length >= required && args.length <= total,
    `Expected ${required === total ? required : `${required}-${total}`} argument(s), got ${args.length}`,
    at
  )
}

const jsGlobals = [
  "console", "Math", "JSON", "parseInt", "parseFloat",
  "Number", "String", "Boolean", "Array", "Object",
  "Date", "RegExp", "Error", "Promise", "process",
  "log", "forEach", "null",
]

export default function translate(match) {
  let context = new Context()
  for (const name of jsGlobals) context.bindings.set(name, core.variable(name, "any"))
  let currentFunction = null
  let inLoop = false
  let inAsyncFunction = false

  const grammar = match.matcher.grammar

  const actions = {
    Program(statements) {
      return core.program(statements.children.map(s => s.translate()))
    },

    FunctionDecl(asyncOpt, _fn, id, _open, paramsOpt, _close, returnTypeOpt, body) {
      const isAsync = asyncOpt.children.length === 1
      const name = id.sourceString
      const params = paramsOpt.children.length
        ? paramsOpt.children[0].translate()
        : []
      const returnType = returnTypeOpt.children.length
        ? returnTypeOpt.children[0].translate()
        : core.typeAnnotation("void")

      const func = core.functionObject(name, params, returnType, isAsync)
      context.set(name, func, id.source)

      const savedContext = context
      const savedFunction = currentFunction
      const savedAsync = inAsyncFunction
      context = new Context(savedContext)
      currentFunction = func
      inAsyncFunction = isAsync

      for (const param of params) {
        context.set(param.name, param, id.source)
      }
      const bodyTranslated = body.translate()

      context = savedContext
      currentFunction = savedFunction
      inAsyncFunction = savedAsync

      return core.functionDecl(func, bodyTranslated)
    },

    Params(first, _commas, rest) {
      return [first.translate(), ...rest.children.map(p => p.translate())]
    },

    Param(id, optMark, _colon, type) {
      const optional = optMark.children.length === 1
      return core.parameter(id.sourceString, type.translate(), optional)
    },

    ReturnType(_colon, type) {
      return type.translate()
    },

    VariableDecl(_let, id, _colonIter, typeIter, _eq, expression) {
      const name = id.sourceString
      const initializer = expression.translate()
      const declaredType = typeIter.children.length
        ? typeIter.children[0].translate()
        : null
      const inferredType = typeOf(initializer)
      const type = declaredType ?? inferredType
      const variable = core.variable(name, type)
      context.set(name, variable, id.source)
      return core.variableDecl(variable, initializer)
    },

    TypeDecl(_type, id, _eq, type) {
      const name = id.sourceString
      const typeNode = type.translate()
      const alias = core.typeAlias(name, typeNode)
      context.set(name, alias, id.source)
      return alias
    },

    IfStmt(_if, condition, block, elseIfs, elseOpt) {
      const test = condition.translate()
      const consequent = block.translate()
      const alternates = elseIfs.children.map(e => e.translate())
      const otherwise = elseOpt.children.length
        ? elseOpt.children[0].translate()
        : null
      return core.ifStmt(test, consequent, alternates, otherwise)
    },

    ElseIf(_else, _if, condition, block) {
      return {
        kind: "ElseIf",
        test: condition.translate(),
        consequent: block.translate(),
      }
    },

    Else(_else, block) {
      return block.translate()
    },

    LoopStmt(_loop, id, _in, start, _dotdot, end, body) {
      const startVal = start.translate()
      const endVal = end.translate()
      validateType(startVal, "num", start.source)
      validateType(endVal, "num", end.source)
      const rangeNode = core.range(startVal, endVal)
      const variable = core.variable(id.sourceString, "num")

      const savedContext = context
      const savedInLoop = inLoop
      context = new Context(savedContext)
      context.set(id.sourceString, variable, id.source)
      inLoop = true

      const bodyTranslated = body.translate()

      context = savedContext
      inLoop = savedInLoop

      return core.loopStmt(variable, rangeNode, bodyTranslated)
    },

    MatchStmt(_match, subject, _open, arms, _close) {
      const subjectVal = subject.translate()
      const armNodes = arms.children.map(a => a.translate())
      for (let i = 0; i < armNodes.length - 1; i++) {
        if (armNodes[i].pattern === "_") {
          error(
            "Wildcard pattern '_' must be the last match arm",
            arms.children[i].source
          )
        }
      }
      return core.matchStmt(subjectVal, armNodes)
    },

    MatchArm(pattern, _arrow, body) {
      return core.matchArm(pattern.translate(), body.translate())
    },

    GuardStmt(_guard, condition, _else, block) {
      const test = condition.translate()
      const elseBlock = block.translate()
      const exits = elseBlock.some(
        s => s.kind === "ReturnStatement" || s.kind === "ThrowStatement"
      )
      validate(
        exits,
        "Guard else block must contain a give or fail statement",
        block.source
      )
      return core.guardStmt(test, elseBlock)
    },

    TryStmt(_try, block, _catch, id, catchBlock) {
      const blockTranslated = block.translate()
      const errorName = id.sourceString

      const savedContext = context
      context = new Context(savedContext)
      context.set(errorName, core.variable(errorName, "any"), id.source)
      const catchTranslated = catchBlock.translate()
      context = savedContext

      return core.tryStmt(blockTranslated, errorName, catchTranslated)
    },

    FailStmt(_fail, expression) {
      return core.throwStmt(expression.translate())
    },

    ReturnStmt(_give, expression) {
      validate(
        currentFunction !== null,
        "give used outside function",
        _give.source
      )
      return core.returnStmt(expression.translate())
    },

    ExpStmt(expression) {
      return core.expressionStmt(expression.translate())
    },

    Block(_open, statements, _close) {
      return statements.children.map(s => s.translate())
    },

    PipelineExp_pipe(left, _arrow, right) {
      return core.pipelineExp(left.translate(), right.translate())
    },

    TernaryExp_tern(condition, _q, consequent, _colon, alternate) {
      return core.ternaryExp(
        condition.translate(),
        consequent.translate(),
        alternate.translate()
      )
    },

    LogicalOrExp_or(left, op, right) {
      const node = core.binaryExp(left.translate(), op.sourceString, right.translate())
      node.type = "bool"
      return node
    },

    LogicalAndExp_and(left, op, right) {
      const node = core.binaryExp(left.translate(), op.sourceString, right.translate())
      node.type = "bool"
      return node
    },

    CoalesceExp_coal(left, _op, right) {
      return core.nullCoalesce(left.translate(), right.translate())
    },

    EqualityExp_eq(left, op, right) {
      const node = core.binaryExp(left.translate(), op.sourceString, right.translate())
      node.type = "bool"
      return node
    },

    RelationalExp_rel(left, op, right) {
      const node = core.binaryExp(left.translate(), op.sourceString, right.translate())
      node.type = "bool"
      return node
    },

    AdditiveExp_add(left, op, right) {
      const node = core.binaryExp(left.translate(), op.sourceString, right.translate())
      if (op.sourceString === "-") node.type = "num"
      return node
    },

    MultiplicativeExp_mul(left, op, right) {
      const node = core.binaryExp(left.translate(), op.sourceString, right.translate())
      node.type = "num"
      return node
    },

    UnaryExp_not(_op, operand) {
      const node = core.unaryExp("!", operand.translate())
      node.type = "bool"
      return node
    },

    UnaryExp_neg(_op, operand) {
      const node = core.unaryExp("-", operand.translate())
      node.type = "num"
      return node
    },

    UnaryExp_await(_await, operand) {
      validate(
        inAsyncFunction,
        "await used outside async function",
        _await.source
      )
      return core.awaitExp(operand.translate())
    },

    ExistsExp_exists(operand, _exists) {
      const node = core.existsExp(operand.translate())
      node.type = "bool"
      return node
    },

    PostfixExp_call(callee, _open, argsOpt, _close) {
      const calleeVal = callee.translate()
      const args = argsOpt.children.length
        ? argsOpt.children[0].translate()
        : []
      if (calleeVal?.kind === "FunctionObject") {
        validateCallable(calleeVal, callee.source)
        validateParamCount(calleeVal, args, callee.source)
      }
      const node = core.callExp(calleeVal, args)
      if (calleeVal?.kind === "FunctionObject") {
        node.type = calleeVal.returnType?.name ?? "any"
      }
      return node
    },

    PostfixExp_optchain(object, _op, property) {
      return core.optionalChain(object.translate(), property.sourceString)
    },

    PostfixExp_member(object, _dot, property) {
      return core.memberExp(object.translate(), property.sourceString, false)
    },

    PostfixExp_index(object, _open, prop, _close) {
      return core.memberExp(object.translate(), prop.translate(), true)
    },

    Arguments(first, _commas, rest) {
      return [first.translate(), ...rest.children.map(a => a.translate())]
    },

    PrimaryExp_paren(_open, expression, _close) {
      return expression.translate()
    },

    PrimaryExp_id(id) {
      return context.get(id.sourceString, id.source)
    },

    ArrowFn(params, _arrow, body) {
      const paramNames = params.translate()
      const savedContext = context
      context = new Context(savedContext)
      const paramNodes = paramNames.map(name => {
        const param = core.parameter(name, core.typeAnnotation("any"), false)
        context.set(name, param, params.source)
        return param
      })
      const bodyTranslated = body.translate()
      context = savedContext
      return core.arrowFunction(paramNodes, bodyTranslated)
    },

    ArrowParams_single(id) {
      return [id.sourceString]
    },

    ArrowParams_parens(_open, identsOpt, _close) {
      return identsOpt.children.length
        ? identsOpt.children[0].translate()
        : []
    },

    ArrowIdentList(first, _commas, rest) {
      return [first.sourceString, ...rest.children.map(i => i.sourceString)]
    },

    ArrayLit(_open, eltsOpt, _close) {
      const elements = eltsOpt.children.length
        ? eltsOpt.children[0].translate()
        : []
      return core.arrayLiteral(elements)
    },

    ArrayElts(first, _commas, rest, _trail) {
      return [first.translate(), ...rest.children.map(e => e.translate())]
    },

    ObjectLit(_open, fieldsOpt, _close) {
      const properties = fieldsOpt.children.length
        ? fieldsOpt.children[0].translate()
        : []
      return core.objectLiteral(properties)
    },

    ObjFields(first, _commas, rest, _trail) {
      return [first.translate(), ...rest.children.map(f => f.translate())]
    },

    ObjField(key, _colon, value) {
      return core.property(key.sourceString, value.translate())
    },

    TypeName(_) {
      return core.typeAnnotation(this.sourceString)
    },

    ObjectType(_open, fieldsOpt, _close) {
      const fields = fieldsOpt.children.length
        ? fieldsOpt.children[0].translate()
        : []
      return core.objectType(fields)
    },

    TypeFields(first, _commas, rest, _trail) {
      return [first.translate(), ...rest.children.map(f => f.translate())]
    },

    TypeField(id, _colon, type) {
      return { name: id.sourceString, type: type.translate() }
    },

    numberLit(_whole, _dot, _frac) {
      const lit = core.numLiteral(Number(this.sourceString))
      lit.type = "num"
      return lit
    },

    boolLit(_) {
      const lit = core.boolLiteral(this.sourceString === "true")
      lit.type = "bool"
      return lit
    },

    stringLit_dq(_open, chars, _close) {
      const lit = core.strLiteral(chars.sourceString)
      lit.type = "str"
      return lit
    },

    stringLit_sq(_open, chars, _close) {
      const lit = core.strLiteral(chars.sourceString)
      lit.type = "str"
      return lit
    },

    templateLit(_open, parts, _close) {
      const lit = core.templateLiteral(parts.children.map(p => p.translate()))
      lit.type = "str"
      return lit
    },

    tmplPart_interp(_open, expression, _close) {
      return { kind: "Interpolation", expression: expression.translate() }
    },

    tmplPart_esc(_bs, ch) {
      return { kind: "TemplateChar", value: "\\" + ch.sourceString }
    },

    tmplPart_char(ch) {
      return { kind: "TemplateChar", value: ch.sourceString }
    },

    wildcard(_underscore) {
      return "_"
    },

  }

  const semantics = grammar.createSemantics().addOperation("translate", actions)
  return semantics(match).translate()
}
