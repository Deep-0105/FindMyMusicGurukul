const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/static_pages.json');

const getStaticPages = (req, res) => {
  try {
    const rawData = fs.readFileSync(dataPath);
    const data = JSON.parse(rawData);
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Error reading static pages:', err);
    res.status(500).json({ success: false, message: 'Server error reading static pages' });
  }
};

const updateStaticPages = (req, res) => {
  try {
    const newData = req.body;
    
    // Optional: add validation here before saving
    
    fs.writeFileSync(dataPath, JSON.stringify(newData, null, 2));
    res.status(200).json({ success: true, message: 'Static pages updated successfully' });
  } catch (err) {
    console.error('Error updating static pages:', err);
    res.status(500).json({ success: false, message: 'Server error updating static pages' });
  }
};

module.exports = {
  getStaticPages,
  updateStaticPages
};
