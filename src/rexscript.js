#!/usr/bin/env node

import * as fs from "node:fs/promises"
import * as path from "node:path"
import { execSync } from "node:child_process"
import { tmpdir } from "node:os"
import { inspect } from "node:util"
import compile from "./compiler.js"
import parse from "./parser.js"
import translate from "./analyzer.js"

const [command, filepath, ...flags] = process.argv.slice(2)

const USAGE = `
Usage: rex <command> <file.rex>
Commands:
  run   <file.rex>              Compile and execute
  build <file.rex> [--out dir]  Compile to JavaScript
  ast   <file.rex> [--graph]    Print the AST
`

function getOutDir(flags) {
  const i = flags.indexOf("--out")
  return i !== -1 ? flags[i + 1] : "./dist"
}

function printError(message) {
  process.stderr.write(`\nREX ERROR: ${message}\n${USAGE}`)
}

async function run() {
  if (!command || !filepath) {
    printError("Missing command or file.")
    process.exit(1)
  }

  let source
  try {
    source = await fs.readFile(filepath, "utf-8")
  } catch {
    printError(`Could not read file: ${filepath}`)
    process.exit(1)
  }

  if (command === "ast") {
    let representation
    try {
      representation = translate(parse(source))
    } catch (e) {
      printError(e.message)
      process.exit(1)
    }
    if (flags.includes("--graph")) {
      const { default: stringify } = await import("graph-stringify")
      console.log(stringify(representation, "kind"))
    } else {
      console.log(inspect(representation, { depth: null }))
    }
    return
  }

  let js
  try {
    js = compile(source)
  } catch (e) {
    printError(e.message)
    process.exit(1)
  }

  if (command === "run") {
    const tempPath = path.join(tmpdir(), `rex_${Date.now()}.mjs`)
    await fs.writeFile(tempPath, js)
    try {
      execSync(`node ${tempPath}`, { stdio: "inherit" })
    } finally {
      await fs.unlink(tempPath)
    }
  } else if (command === "build") {
    const outDir = getOutDir(flags)
    await fs.mkdir(outDir, { recursive: true })
    const baseName = path.basename(filepath, path.extname(filepath))
    const outPath = path.join(outDir, `${baseName}.js`)
    await fs.writeFile(outPath, js)
    console.log(`Compiled ${filepath} → ${outPath}`)
  } else {
    printError(`Unknown command: ${command}`)
    process.exit(1)
  }
}

run()
