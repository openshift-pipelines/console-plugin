const fs = require('fs');
const path = require('path');

// Function to convert PO to JSON
async function convertPoToJson(language, poFilePath, jsonFilePath) {
  const { gettextToI18next } = await import('i18next-conv');

  const poContent = fs.readFileSync(poFilePath, 'utf-8');

  try {
    const result = await gettextToI18next(language, poContent);
    fs.writeFileSync(jsonFilePath, JSON.stringify(JSON.parse(result), null, 2));
    console.log(`JSON file saved at: ${jsonFilePath}`);
  } catch (err) {
    console.error(`Error converting PO to JSON for ${language}:`, err);
  }
}

// Convert all .po files in the po-files directory
const poFilesDir = './po-files'; // Directory containing PO files
const outputJsonDir = './json-locales'; // Directory where JSON files will be saved

// Ensure output directory exists
if (!fs.existsSync(outputJsonDir)) {
  fs.mkdirSync(outputJsonDir, { recursive: true });
}

fs.readdir(poFilesDir, (err, files) => {
  if (err) {
    console.error('Error reading PO files directory:', err);
    return;
  }

  // Filter and process only .po files
  files
    .filter((file) => file.endsWith('.po'))
    .forEach((file) => {
      const poFilePath = path.join(poFilesDir, file);
      const language = file.split('-').pop().replace('.po', '');
      const jsonFileName = file.replace('.po', `.json`);
      const jsonFilePath = path.join(outputJsonDir, jsonFileName);

      convertPoToJson(language, poFilePath, jsonFilePath);
    });
});
