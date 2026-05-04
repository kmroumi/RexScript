// Demonstrates: match statement, multiple arms, wildcard _

fn httpLabel(code: num): str {
  match code {
    200 => { give "OK" }
    201 => { give "Created" }
    204 => { give "No Content" }
    400 => { give "Bad Request" }
    401 => { give "Unauthorized" }
    403 => { give "Forbidden" }
    404 => { give "Not Found" }
    500 => { give "Internal Server Error" }
    _ => { give "Unknown Status" }
  }
}

fn priority(level: num): str {
  match level {
    1 => { give "Critical" }
    2 => { give "High" }
    3 => { give "Medium" }
    4 => { give "Low" }
    _ => { give "None" }
  }
}

console.log(httpLabel(200))
console.log(httpLabel(404))
console.log(httpLabel(503))
console.log(priority(1))
console.log(priority(3))
console.log(priority(9))
