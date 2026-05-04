// Demonstrates: optional chaining ?., exists check, ?/ operator

type Address = { street: str, city: str }
type User = { name: str, address: Address }

fn getCity(user: User): str {
  let city = user?.address?.city
  give city ?/ "Unknown City"
}

fn greetUser(user: User): str {
  guard user exists else {
    give "No user provided"
  }
  let name = user?.name
  let city = user?.address?.city
  give `Hello, {name} from {city ?/ "Somewhere"}!`
}

fn safeDisplay(user: User, fallback: str): str {
  let name = user?.name ?/ fallback
  give name
}

let alice = {
  name: "Alice",
  address: { street: "123 Main St", city: "Austin" }
}

let bob = {
  name: "Bob",
  address: { street: "456 Oak Ave", city: "Denver" }
}

console.log(getCity(alice))
console.log(greetUser(alice))
console.log(greetUser(bob))
console.log(safeDisplay(alice, "Anonymous"))
console.log(safeDisplay(null, "Nobody"))
