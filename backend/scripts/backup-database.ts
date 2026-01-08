/**
 * Database backup utility
 * Creates a backup of the database schema and data
 */

import { getPool } from '../lib/db';
import * as fs from 'fs';
import * as path from 'path';

async function backupDatabase() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('Starting database backup...');

    // Create backups directory
    const backupsDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFile = path.join(backupsDir, `backup-${timestamp}.sql`);

    // Get all table names
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map((r: any) => r.table_name);
    console.log(`Found ${tables.length} tables to backup`);

    let backupSQL = `-- Database Backup\n-- Generated: ${new Date().toISOString()}\n\n`;

    // Backup each table
    for (const table of tables) {
      console.log(`Backing up table: ${table}`);

      // Get table structure
      const structureResult = await client.query(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);

      // Get table data
      const dataResult = await client.query(`SELECT * FROM ${table}`);

      backupSQL += `\n-- Table: ${table}\n`;
      backupSQL += `-- Rows: ${dataResult.rows.length}\n\n`;

      // Create table structure (simplified)
      backupSQL += `CREATE TABLE IF NOT EXISTS ${table} (\n`;
      const columns = structureResult.rows.map((col: any) => {
        let def = `  ${col.column_name} ${col.data_type}`;
        if (col.character_maximum_length) {
          def += `(${col.character_maximum_length})`;
        }
        if (col.is_nullable === 'NO') {
          def += ' NOT NULL';
        }
        if (col.column_default) {
          def += ` DEFAULT ${col.column_default}`;
        }
        return def;
      }).join(',\n');
      backupSQL += columns + '\n);\n\n';

      // Insert data
      if (dataResult.rows.length > 0) {
        const columnNames = structureResult.rows.map((col: any) => col.column_name).join(', ');
        backupSQL += `INSERT INTO ${table} (${columnNames}) VALUES\n`;

        const values = dataResult.rows.map((row: any, idx: number) => {
          const rowValues = structureResult.rows.map((col: any) => {
            const val = row[col.column_name];
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            if (Array.isArray(val)) return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return String(val);
          }).join(', ');
          return `  (${rowValues})${idx < dataResult.rows.length - 1 ? ',' : ';'}`;
        }).join('\n');

        backupSQL += values + '\n\n';
      }
    }

    // Write backup file
    fs.writeFileSync(backupFile, backupSQL, 'utf8');

    console.log(`✓ Backup completed: ${backupFile}`);
    console.log(`  Size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`);

    return backupFile;
  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  backupDatabase()
    .then((file) => {
      console.log(`\n✅ Backup saved to: ${file}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Backup error:', error);
      process.exit(1);
    });
}

export { backupDatabase };
