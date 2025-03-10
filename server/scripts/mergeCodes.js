// Script to merge country codes into countries.ts
const fs = require('fs');
const path = require('path');

// Read the files
const codesPath = path.join(__dirname, '../src/data/seeds/codes.ts');
const countriesPath = path.join(__dirname, '../src/data/seeds/countries.ts');

// Read the content of both files
const codesContent = fs.readFileSync(codesPath, 'utf8');
const countriesContent = fs.readFileSync(countriesPath, 'utf8');

// Create a map of country names to codes
const codeMap = {};
const codeRegex = /"([a-z]{2})": "([^"]+)"/g;
let match;

while ((match = codeRegex.exec(codesContent)) !== null) {
  const code = match[1];
  const name = match[2];
  
  // Skip US states and other subdivisions with hyphens
  if (code.includes('-')) continue;
  
  codeMap[name] = code;
}

console.log(`Extracted ${Object.keys(codeMap).length} country codes`);

// Process the countries content
let updatedContent = countriesContent;
let matchCount = 0;

// For each country in the codeMap, try to find it in the countries content
for (const [name, code] of Object.entries(codeMap)) {
  // Create a regex to match the country name in the countries.ts file
  // This regex looks for the country name in a JSON object
  const countryRegex = new RegExp(`{"name": "${name}"([^}]+)}`, 'g');
  
  if (countryRegex.test(updatedContent)) {
    // Replace the matched country with the same country plus the code
    updatedContent = updatedContent.replace(
      countryRegex,
      `{"name": "${name}"$1, "code": "${code}"}`
    );
    matchCount++;
  }
}

console.log(`Added codes to ${matchCount} countries`);

// Handle special cases and partial matches manually
const specialCases = [
  { name: "Côte d'Ivoire", code: "ci" },
  { name: "DR Congo", code: "cd" },
  { name: "Eswatini", code: "sz" },
  { name: "North Macedonia", code: "mk" },
  { name: "Republic of the Congo", code: "cg" },
  { name: "São Tomé and Príncipe", code: "st" },
  { name: "United States", code: "us" },
  { name: "Vatican City", code: "va" }
];

for (const { name, code } of specialCases) {
  const countryRegex = new RegExp(`{"name": "${name}"([^}]+)}`, 'g');
  
  if (countryRegex.test(updatedContent)) {
    updatedContent = updatedContent.replace(
      countryRegex,
      `{"name": "${name}"$1, "code": "${code}"}`
    );
    console.log(`Added special case: ${name} -> ${code}`);
    matchCount++;
  }
}

// Write the updated content back to the countries file
fs.writeFileSync(countriesPath, updatedContent, 'utf8');
console.log(`Updated countries.ts with ${matchCount} country codes`);
