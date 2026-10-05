const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'AboutUsPage.jsx',
  'ContactUsPage.jsx',
  'LegalPoliciesPage.jsx',
  'HelpSupportPage.jsx',
  'StudentFaqsPage.jsx'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, 'music_guru_ui', 'src', 'components', 'findmyguru', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace('max-w-4xl', 'max-w-7xl');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`Could not find ${file}`);
  }
});
