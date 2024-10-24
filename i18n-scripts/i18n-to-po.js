const fs = require('fs');

async function convertJsonToPo(language, jsonFilePath, poFilePath) {
  const jsonContent = fs.readFileSync(jsonFilePath, 'utf-8');
  const { i18nextToPo } = await import('i18next-conv');

  try {
    const result = await i18nextToPo(language, jsonContent, {
      language,
      foldLength: 0,
    });
    fs.writeFileSync(poFilePath, result);
    console.log(`PO file saved at: ${poFilePath}`);
  } catch (err) {
    console.error('Error converting JSON to PO:', err);
  }
}

const jsonFilePath = './locales/en/plugin__pipelines-console-plugin.json'; // Path to en JSON file
const poFilePath = './i18n-scripts/plugin__pipelines-console-plugin.po'; // Output PO file path
const language = 'en'; // Language code

convertJsonToPo(language, jsonFilePath, poFilePath);
