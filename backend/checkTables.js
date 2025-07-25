import pool from './db.js';

async function checkTables() {
  try {
    console.log('Checking available tables...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('Available tables:');
    result.rows.forEach(row => console.log('- ' + row.table_name));
    
    // Check if institutionalinfo has profile picture fields
    const institutionalCols = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'institutionalinfo'
      ORDER BY ordinal_position
    `);
    
    console.log('\nInstitutionalinfo table columns:');
    institutionalCols.rows.forEach(row => console.log('- ' + row.column_name));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTables();
