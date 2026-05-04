// Demonstrates: type aliases, typed parameters, optional params

type UserId = str
type Score = num
type Point = { x: num, y: num }

fn makePoint(x: num, y: num): Point {
  give { x: x, y: y }
}

fn distanceBetween(a: Point, b: Point): num {
  let dx = a.x - b.x
  let dy = a.y - b.y
  give Math.sqrt(dx * dx + dy * dy)
}

fn formatUser(id: UserId, name: str, score?: Score): str {
  let s = score ?/ 0
  give `User {id} ({name}) — score: {s}`
}

fn midpoint(a: Point, b: Point): Point {
  give { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

let origin = makePoint(0, 0)
let target = makePoint(3, 4)
let dist = distanceBetween(origin, target)
let mid = midpoint(origin, target)

console.log(`Distance: {dist}`)
console.log(`Midpoint: ({mid.x}, {mid.y})`)
console.log(formatUser("u42", "Alice"))
console.log(formatUser("u99", "Bob", 88))
