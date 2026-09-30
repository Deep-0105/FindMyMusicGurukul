require('dotenv').config();
const sql = require('mssql');
const logger = require('../utils/logger');

const isTrusted = process.env.DB_TRUSTED_CONNECTION === 'true' ||
  process.env.DB_USER?.includes('\\') ||
  (!process.env.DB_USER && !process.env.DB_PASSWORD);

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'FindMyMusicGurukul',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
    trustedConnection: isTrusted
  }
};

// If using SQL Authentication (e.g. sa with empty password)
if (!isTrusted) {
  config.user = process.env.DB_USER || 'sa';
  config.password = process.env.DB_PASSWORD || '';
}

const pool = new sql.ConnectionPool(config);

// Add an event listener to handle successful connection
pool.connect()
  .then(async () => {
    if (logger && logger.info) {
      logger.info('Database Connected Successfully');
    } else {
      console.log('✅ Database Connected Successfully to FindMyMusicGurukul');
    }

    try {
      await pool.request().query(`
        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'academies') AND name = 'profile_image')
        BEGIN
          ALTER TABLE academies ALTER COLUMN profile_image VARCHAR(MAX) NULL;
        END
        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'academies') AND name = 'cover_image')
        BEGIN
          ALTER TABLE academies ALTER COLUMN cover_image VARCHAR(MAX) NULL;
        END
        IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'inquiries')
        BEGIN
          UPDATE inquiries SET preferred_slot = 'Offline' WHERE preferred_slot LIKE '%Evening%' OR preferred_slot LIKE '%Morning%';
          UPDATE inquiries SET status = 'New' WHERE status = 'Pending';
          
          DECLARE @chkName NVARCHAR(256);
          SELECT TOP 1 @chkName = cc.name
          FROM sys.check_constraints cc
          JOIN sys.columns col ON cc.parent_object_id = col.object_id AND cc.parent_column_id = col.column_id
          WHERE cc.parent_object_id = OBJECT_ID(N'inquiries') AND col.name = 'status';

          IF @chkName IS NOT NULL
          BEGIN
            EXEC('ALTER TABLE dbo.inquiries DROP CONSTRAINT [' + @chkName + ']');
          END
        END
      `);
      if (logger && logger.info) {
        logger.info('Auto-migrated profile_image and cover_image columns to VARCHAR(MAX) and dropped inquiry status CHECK constraint');
      }
    } catch (migErr) {
      console.warn('Auto-migration warning:', migErr.message);
    }
  })
  .catch(err => {
    if (logger && logger.error) {
      logger.error(`Database connection error: ${err}`);
    } else {
      console.error(`❌ Database connection error: ${err}`);
    }
  });

pool.on('error', err => {
  if (logger && logger.error) {
    logger.error(`Database connection error: ${err}`);
  } else {
    console.error(`❌ Database connection error: ${err}`);
  }
});

async function executeStoredProcedure(procedureName, params = []) {
  try {
    await pool.connect();
    const request = pool.request();

    // Add parameters to the request
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });

    const result = await request.execute(procedureName);
    return result;
  } catch (error) {
    if (logger && logger.error) {
      logger.error(`Error executing stored procedure ${procedureName}, error:`, error);
    } else {
      console.error(`Error executing stored procedure ${procedureName}, error:`, error);
    }
    throw error;
  }
}

async function executeQuery(queryText, params = []) {
  try {
    await pool.connect();
    const request = pool.request();

    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });

    const result = await request.query(queryText);
    return result;
  } catch (error) {
    if (logger && logger.error) {
      logger.error(`Error executing SQL query, error:`, error);
    } else {
      console.error(`Error executing SQL query, error:`, error);
    }
    throw error;
  }
}

module.exports = {
  pool,
  sql,
  executeStoredProcedure,
  executeQuery
};
