/**
 * Test Database Connection Script
 * 
 * This script tests the database connection with the credentials
 * you provide to verify they work BEFORE deploying to Render.
 * 
 * Usage:
 * 1. npm install pg
 * 2. node test-db-connection.js
 */

const { Client } = require('pg');

// ============================================================================
// EDIT THESE VALUES WITH YOUR SUPABASE CREDENTIALS
// ============================================================================

const config = {
  host: 'db.mlqspibxytehlycjstma.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'YOUR_PASSWORD_HERE', // ← PUT YOUR ACTUAL PASSWORD HERE
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
};

// ============================================================================
// TEST CONNECTION
// ============================================================================

console.log('🔍 Testing Supabase Database Connection...\n');
console.log('Configuration:');
console.log('  Host:', config.host);
console.log('  Port:', config.port);
console.log('  User:', config.user);
console.log('  Database:', config.database);
console.log('  Password:', config.password.substring(0, 4) + '****' + config.password.substring(config.password.length - 4));
console.log('  SSL:', config.ssl ? 'Enabled' : 'Disabled');
console.log('\n' + '='.repeat(60) + '\n');

const client = new Client(config);

async function testConnection() {
  try {
    console.log('⏳ Connecting to database...');
    await client.connect();
    console.log('✅ Successfully connected to database!\n');

    console.log('⏳ Running test query...');
    const result = await client.query('SELECT version()');
    console.log('✅ Query successful!\n');
    console.log('PostgreSQL Version:');
    console.log('  ' + result.rows[0].version);
    console.log('\n' + '='.repeat(60) + '\n');

    console.log('⏳ Checking tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tables.rows.length > 0) {
      console.log('✅ Found', tables.rows.length, 'tables:');
      tables.rows.forEach(row => {
        console.log('  -', row.table_name);
      });
    } else {
      console.log('ℹ️  No tables found (this is normal for a new database)');
    }

    console.log('\n' + '='.repeat(60) + '\n');
    console.log('🎉 CONNECTION TEST SUCCESSFUL!');
    console.log('\nYour credentials are correct. You can use these values in Render:');
    console.log('\n  DB_HOST=' + config.host);
    console.log('  DB_PORT=' + config.port);
    console.log('  DB_USERNAME=' + config.user);
    console.log('  DB_PASSWORD=' + config.password);
    console.log('  DB_NAME=' + config.database);
    console.log('\n');

  } catch (error) {
    console.error('❌ CONNECTION FAILED!\n');
    console.error('Error Details:');
    console.error('  Code:', error.code);
    console.error('  Message:', error.message);
    console.error('\n' + '='.repeat(60) + '\n');
    
    if (error.message.includes('Tenant or user not found')) {
      console.error('🔴 ERROR: "Tenant or user not found"');
      console.error('\nThis means:');
      console.error('  ❌ Wrong password');
      console.error('  ❌ Wrong username');
      console.error('  ❌ Wrong host');
      console.error('\nWhat to do:');
      console.error('  1. Go to Supabase Dashboard → Settings → Database');
      console.error('  2. Click "Reset Database Password"');
      console.error('  3. Copy the new password');
      console.error('  4. Update the password in this script');
      console.error('  5. Run this script again');
      console.error('\n  URL: https://supabase.com/dashboard/project/mlqspibxytehlycjstma/settings/database');
    } else if (error.message.includes('password authentication failed')) {
      console.error('🔴 ERROR: Password authentication failed');
      console.error('\nThe password is wrong. Reset it in Supabase:');
      console.error('  1. Go to: https://supabase.com/dashboard/project/mlqspibxytehlycjstma/settings/database');
      console.error('  2. Click "Reset Database Password"');
      console.error('  3. Copy the new password');
      console.error('  4. Update it in this script');
    } else if (error.message.includes('timeout')) {
      console.error('🔴 ERROR: Connection timeout');
      console.error('\nPossible causes:');
      console.error('  ❌ Supabase project is paused');
      console.error('  ❌ Wrong host or port');
      console.error('  ❌ Network/firewall issue');
      console.error('\nCheck:');
      console.error('  1. Supabase project status: https://supabase.com/dashboard/project/mlqspibxytehlycjstma');
      console.error('  2. Verify host: db.mlqspibxytehlycjstma.supabase.co');
      console.error('  3. Verify port: 5432');
    } else {
      console.error('🔴 UNKNOWN ERROR');
      console.error('\nFull error:');
      console.error(error);
    }
    console.error('\n');
  } finally {
    await client.end();
    console.log('🔌 Connection closed.');
  }
}

// Run the test
testConnection();
