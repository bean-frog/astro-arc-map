#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function ask(question) {
  return new Promise(resolve => rl.question(question, ans => resolve(ans.trim())));
}

async function main() {
  const name = await ask('Enter person name: ');
  if (!name) {
    console.log('Name is required.');
    rl.close();
    return;
  }

  // Collect nodes
  let nodes = [];
  console.log(`\nEnter nodes for ${name} (type 'done' when finished):`);
  while (true) {
    const node = await ask('  Node: ');
    if (node.toLowerCase() === 'done') break;
    if (node) nodes.push(node);
  }

  // Collect connections
  let connections = [];
  console.log(`\nEnter connections (format: "NodeA - NodeB", type 'done' when finished):`);
  while (true) {
    const conn = await ask('  Connection: ');
    if (conn.toLowerCase() === 'done') break;

    const parts = conn.split(/\s*-\s*/);
    if (parts.length === 2 && nodes.includes(parts[0]) && nodes.includes(parts[1])) {
      connections.push(parts);
    } else {
      console.log('Invalid connection. Make sure both nodes exist and format is "NodeA - NodeB".');
    }
  }

  const personData = { name, nodes, connections };

  const safeName = name.replace(/[^a-z0-9_\-]/gi, '_');
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const filename = safeName.endsWith('.json') ? safeName : `${safeName}.json`;
  const filePath = path.join(outputDir, filename);

  fs.writeFileSync(filePath, JSON.stringify(personData, null, 2), 'utf8');
  console.log(`\n✅ Saved to ${filePath}`);

  rl.close();
}

main();
