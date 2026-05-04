// Demonstrates: guard...else, fail, input validation pattern

fn safeDivide(a: num, b: num): num {
  guard b !== 0 else {
    fail "Division by zero is not allowed"
  }
  give a / b
}

fn classifyAge(age: num): str {
  guard age >= 0 else {
    fail "Age cannot be negative"
  }
  guard age <= 150 else {
    fail "Age value is unrealistically large"
  }

  if age < 13 {
    give "Child"
  } else if age < 18 {
    give "Teenager"
  } else if age < 65 {
    give "Adult"
  } else {
    give "Senior"
  }
}

fn scoreGrade(score: num): str {
  guard score >= 0 else {
    fail "Score cannot be negative"
  }
  guard score <= 100 else {
    fail "Score cannot exceed 100"
  }

  if score >= 90 {
    give "A"
  } else if score >= 80 {
    give "B"
  } else if score >= 70 {
    give "C"
  } else {
    give "F"
  }
}

console.log(safeDivide(10, 4))
console.log(classifyAge(25))
console.log(scoreGrade(85))
