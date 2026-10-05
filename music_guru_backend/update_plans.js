require('dotenv').config();
const { executeQuery } = require('./config/db');

async function runSQL() {
  try {
    const featureCheck = await executeQuery(`SELECT id FROM features WHERE name='View Student Contacts'`);
    if (!featureCheck.recordset.length) {
      await executeQuery(`
        INSERT INTO features (name, description) 
        VALUES ('View Student Contacts', 'View masked mobile and email in received inquiries');
      `);
    }
    
    const planCheck = await executeQuery(`SELECT id FROM subscriptions WHERE name='View Contacts Plan'`);
    if (!planCheck.recordset.length) {
      await executeQuery(`
        INSERT INTO subscriptions (name, target_role, price, duration_months, description, features) 
        VALUES ('View Contacts Plan', 'academy', 599.00, 12, 'View unmasked mobile and email addresses in received inquiries.', 'View Student Contacts');
      `);
    }

    await executeQuery(`
      UPDATE subscriptions 
      SET name='All-in-One Premium Plan', 
          description='Includes all features: Social Media links, interactive Google Map Location, and View Student Contacts.', 
          features='Social Media, Google Map Location, View Student Contacts' 
      WHERE id=4 OR CAST(id AS VARCHAR(100)) = '4' OR name LIKE '%Social Media & Google Map Plan%';
    `);

    console.log("Plans updated successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error running SQL:", err);
    process.exit(1);
  }
}

runSQL();
