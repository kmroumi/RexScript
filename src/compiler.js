import parse from "./parser.js"
import translate from "./analyzer.js"
import optimize from "./optimizer.js"
import generate from "./generator.js"

export default function compile(source) {
  return generate(optimize(translate(parse(source))))
}
