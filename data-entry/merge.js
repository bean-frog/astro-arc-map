#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

async function main() {
  const dir = process.argv[2];

  if (!dir) {
    console.log('Please provide a directory path.');
    console.log('Usage: node combineMaps.js ./people');
    process.exit(1);
  }

  if (!fs.existsSync(dir)) {
    console.log(`Directory not found: ${dir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.log('No JSON files found in that directory.');
    process.exit(0);
  }

  let combined = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const person = JSON.parse(content);

      // Validate structure
      if (person.name && Array.isArray(person.nodes) && Array.isArray(person.connections)) {
        combined.push(person);
        console.log(`Added: ${person.name}`);
      } else {
        console.log(`Skipped invalid file: ${file}`);
      }
    } catch (err) {
      console.log(`Error reading ${file}: ${err.message}`);
    }
  }

  const output = `window.mapData = ${JSON.stringify(combined, null, 2)};\n`;
  const outputFile = path.join(dir, 'mapData.js');
  fs.writeFileSync(outputFile, output, 'utf8');

  console.log(`\n Combined data saved to ${outputFile}`);
}

main();
