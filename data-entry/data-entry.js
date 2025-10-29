#!/usr/bin/env node
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function ask(question) {
  return new Promise(resolve => rl.question(question, answer => resolve(answer.trim())));
}

async function main() {
  let mapData = [];

  while (true) {
    const name = await ask('Enter name (or "done" to finish all entries): ');
    if (name.toLowerCase() === 'done') break;

    // Collect nodes
    let nodes = [];
    console.log(`Enter nodes for ${name} (type 'done' when finished):`);
    while (true) {
      const node = await ask('Node: ');
      if (node.toLowerCase() === 'done') break;
      if (node) nodes.push(node);
    }

    // Collect connections
    let connections = [];
    console.log(`Enter connections for ${name} (format: "NodeA NodeB", type 'done' when finished):`);
    while (true) {
      const conn = await ask('Connection: ');
      if (conn.toLowerCase() === 'done') break;
      const parts = conn.split(/\s+/);
      if (parts.length === 2 && nodes.includes(parts[0]) && nodes.includes(parts[1])) {
        connections.push(parts);
      } else {
        console.log('Invalid connection. Make sure both nodes exist and format is "NodeA NodeB".');
      }
    }

    mapData.push({ name, nodes, connections });
  }

  const filename = await ask('Enter filename to save (e.g. mapData.js): ');
  const fileContent = `window.mapData = ${JSON.stringify(mapData, null, 2)};\n`;

  fs.writeFileSync(filename, fileContent, 'utf8');
  console.log(`Data saved to ${filename}`);

  rl.close();
}

main();
