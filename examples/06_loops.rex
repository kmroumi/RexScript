// Demonstrates: loop...in with ranges, nested loops, loop variable

// Basic range loop
loop i in 1..5 {
  console.log(`Step {i}`)
}

// Use loop variable in an expression
loop n in 1..8 {
  let squared = n * n
  console.log(`{n}^2 = {squared}`)
}

// Nested loops: print a small multiplication table
loop row in 1..4 {
  loop col in 1..4 {
    let product = row * col
    console.log(`{row} x {col} = {product}`)
  }
}

// Loop to display Fibonacci-style indices
loop k in 0..6 {
  let label = k % 2 === 0 ? "even" : "odd"
  console.log(`Index {k} is {label}`)
}
