// Demonstrates: pipeline operator ->, arrow functions, chained calls

fn double(n: num): num {
  give n * 2
}

fn addTen(n: num): num {
  give n + 10
}

fn square(n: num): num {
  give n * n
}

fn negate(n: num): num {
  give 0 - n
}

fn describe(n: num): str {
  give `Result is {n}`
}

// Single-step pipeline: 5 -> 10
let step1 = 5 -> double

// Multi-step chained pipeline: 3 -> 6 -> 36 -> 46
let processed = 3 -> double -> square -> addTen

// Longer chain using arrow function in pipeline via forEach
let chain = 2 -> double -> addTen -> square -> negate

// Pipeline into a descriptor function
let label = processed -> describe

console.log(label)
console.log(`Chain result: {chain}`)
console.log(`Single step: {step1}`)
