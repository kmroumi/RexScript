<img src="docs/RexScript_logo.png" height="200">

# Rex Script 🦖
### *Where JavaScript Evolves*

![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-brightgreen?logo=node.js)
![License MIT](https://img.shields.io/badge/License-MIT-blue)
![Tests Passing](https://img.shields.io/badge/Tests-Passing-success)

---

## Introduction

JavaScript is everywhere — but its rough edges accumulate fast: accidental reassignment, silent `null` derefs, `switch` fallthrough bugs, and return statements that feel like afterthoughts. Rex Script is a compiled language that targets JavaScript while fixing the parts that shouldn't still be broken. It keeps everything you already know — the runtime, the ecosystem, the mental model — and layers on a syntax that's more readable, a type system that's actually enforced, and a handful of guard rails that catch the mistakes you'd otherwise chase down at 2 a.m. It's familiar by design, safer by default, and built for people who love JavaScript enough to want it to be better.

---

## Features

- **`fn` / `give` syntax** — declares functions and returns values with cleaner, intention-revealing keywords
- **Typed immutable parameters** — every parameter carries a type annotation (`num`, `str`, `bool`, `any`); arguments are read-only inside the function body
- **Pipeline operator `->` ** — pipes the left-hand value as the first argument to the right-hand function, enabling clean left-to-right data transformations
- **`match` statement (no fallthrough)** — exhaustive, pattern-based branching that compiles to `switch` but never accidentally falls through
- **`guard` / `fail`** — precondition checks that must exit the block via `fail` or `give`, making validation logic impossible to skip
- **`try!` error handling** — explicit error boundary syntax paired with a named `catch` block
- **`exists` / `?/` null safety** — `exists` tests whether a value is non-null; `?/` is the null-coalescing operator (replaces JS `??`)
- **`loop...in` with inclusive ranges** — `loop i in 1..5` iterates 1 through 5 inclusive, with the loop variable scoped to the body
- **Type aliases** — `type UserId = str` creates named aliases for both primitive and structural types
- **Optional parameters with `?:`** — `score?: num` marks a parameter as optional; callers may omit it
- **Async/await support** — `async fn` and `await` map directly to their JS equivalents, enforced to appear only in async contexts
- **Template literals with `{expr}` interpolation** — backtick strings with `{expr}` syntax (compiles to JS `${expr}`)

---

## Static Checks

The analyzer enforces these rules before any code runs:

- Variables must be declared before use
- No redeclaration of the same name in the same scope
- `give` must appear inside a function body
- `await` must appear inside an `async` function
- Function call argument count must match the declaration (respecting optional parameters)
- `match` wildcard `_` must be the last arm
- `guard` else block must contain a `fail` or `give` statement
- Type aliases must be declared before use
- Loop variable is scoped to the loop body and not accessible outside it
- Optional parameters are tracked as possibly-undefined (callers may omit them)

---

## Syntax Quick Reference

| Rex Keyword / Op | Replaces (JS)        | Example                                      |
|------------------|----------------------|----------------------------------------------|
| `fn`             | `function`           | `fn greet(name: str): str { ... }`           |
| `give`           | `return`             | `give name + "!"`                            |
| `let`            | `const`              | `let x = 42`                                 |
| `match`          | `switch`             | `match code { 200 => { give "OK" } }`        |
| `guard ... else` | early-exit `if`      | `guard n > 0 else { fail "negative" }`       |
| `fail`           | `throw new Error()`  | `fail "Division by zero"`                    |
| `try!`           | `try`                | `try! { ... } catch err { ... }`             |
| `loop i in a..b` | `for` loop           | `loop i in 1..10 { console.log(i) }`         |
| `->`             | manual call chain    | `5 -> double -> square`                      |
| `?/`             | `??`                 | `user?.name ?/ "Anonymous"`                  |
| `?.`             | `?.`                 | `user?.address?.city`                        |
| `exists`         | `!== null && !== undefined` | `if x exists { ... }`              |
| `async fn`       | `async function`     | `async fn load(id: num): any { ... }`        |
| `await`          | `await`              | `let data = await fetch(url)`                |
| `type`           | typedef (none in JS) | `type UserId = str`                          |
| `str`            | `string` (type)      | `fn greet(name: str): str`                   |
| `num`            | `number` (type)      | `fn add(a: num, b: num): num`                |
| `bool`           | `boolean` (type)     | `fn isEven(n: num): bool`                    |
| `any`            | `any` (type)         | `fn parse(raw: any): any`                    |
| `void`           | `void` (type)        | `async fn run(): void { ... }`               |
| `{expr}`         | `${expr}` in strings | `` `Hello, {name}!` ``                       |

---

## Example Programs

### 1 — Greet Function (`fn`, `give`, `str`)

<table>
<tr><th>Rex Script</th><th>Compiled JavaScript</th></tr>
<tr>
<td>

```rex
fn greet(name: str): str {
  give `Hello, {name}!`
}

console.log(greet("World"))
```

</td>
<td>

```js
// Generated by the Rex Script Compiler
function greet(name) {
  return `Hello, ${name}!`
}
console.log(greet("World"));
```

</td>
</tr>
</table>

---

### 2 — Match Statement

<table>
<tr><th>Rex Script</th><th>Compiled JavaScript</th></tr>
<tr>
<td>

```rex
fn httpLabel(code: num): str {
  match code {
    200 => { give "OK" }
    404 => { give "Not Found" }
    500 => { give "Internal Server Error" }
    _ => { give "Unknown Status" }
  }
}

console.log(httpLabel(200))
console.log(httpLabel(404))
console.log(httpLabel(503))
```

</td>
<td>

```js
// Generated by the Rex Script Compiler
function httpLabel(code) {
  switch (code) {
    case 200:
      return "OK"
    case 404:
      return "Not Found"
    case 500:
      return "Internal Server Error"
    default:
      return "Unknown Status"
  }
}
console.log(httpLabel(200));
console.log(httpLabel(404));
console.log(httpLabel(503));
```

</td>
</tr>
</table>

---

### 3 — Guard + Fail Validation

<table>
<tr><th>Rex Script</th><th>Compiled JavaScript</th></tr>
<tr>
<td>

```rex
fn safeDivide(a: num, b: num): num {
  guard b !== 0 else {
    fail "Division by zero is not allowed"
  }
  give a / b
}

console.log(safeDivide(10, 4))
```

</td>
<td>

```js
// Generated by the Rex Script Compiler
function safeDivide(a, b) {
  if (!(b !== 0)) {
    throw new Error("Division by zero is not allowed")
  }
  return a / b
}
console.log(safeDivide(10, 4));
```

</td>
</tr>
</table>

---

## Getting Started

```bash
git clone https://github.com/kmroumi/RexScript
cd rexscript
npm install
npm test
```

```bash
# Run a .rex file directly
rex run examples/01_greet.rex

# Compile to JavaScript (outputs to dist/ by default)
rex build examples/01_greet.rex --out dist/

# Inspect the AST
rex ast examples/01_greet.rex
```

---

## Pipeline Operator

The `->` operator passes the left-hand operand as the **first argument** to a single-argument function on the right. Chains evaluate left-to-right and compose cleanly without nested calls.

```rex
fn double(n: num): num { give n * 2 }
fn addTen(n: num): num { give n + 10 }
fn square(n: num): num { give n * n }

// 3 → 6 → 36 → 46
let result = 3 -> double -> square -> addTen
```

Compiles to: `const result = addTen(square(double(3)))`

---

## Easter Egg 🦖

Add `// dinosaur mode` as a comment anywhere in a `.rex` file to unlock a surprise. Some code refuses to go extinct.

---

## Team
<ul>
<li>Khaleefa</li>
<li>Jackson M</li>
<li>Ahmad</li>
</ul>


---

## Links

- [Rex Script Website](https://github.com/kmroumi/RexScript)
- [View Grammar](src/rexscript.ohm)
- [Example Programs](examples/)
