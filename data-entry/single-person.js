#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function ask(question) {
  return new Promise((resolve) =>
    rl.question(question, (ans) => resolve(ans.trim())),
  );
}

async function main() {
  const name = await ask("Enter person name: ");
  if (!name) {
    console.log("Name is required.");
    rl.close();
    return;
  }

  let connections = [];
  console.log(
    `\nEnter connections for ${name} (format: "NodeA - NodeB", type 'done' when finished):`,
  );
  while (true) {
    const conn = await ask("  Connection: ");
    if (conn.toLowerCase() === "done") break;

    const parts = conn.split(/\s*-\s*/);
    if (parts.length === 2 && parts[0] && parts[1]) {
      connections.push(parts);
    } else {
      console.log('Invalid format. Use "NodeA - NodeB".');
    }
  }

  // Derive nodes from connections
  const nodes = Array.from(new Set(connections.flat()));

  const personData = { name, nodes, connections };

  const safeName = name.replace(/[^a-z0-9_\-]/gi, "_");
  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const filename = safeName.endsWith(".json") ? safeName : `${safeName}.json`;
  const filePath = path.join(outputDir, filename);

  fs.writeFileSync(filePath, JSON.stringify(personData, null, 2), "utf8");
  console.log(`\nSaved to ${filePath}`);

  rl.close();
}

main();
