/**
 * Export only custom application tables to Excel
 * Filters out Django, system, and migration tables
 * Next.js/TypeScript implementation
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env.local in project root
const envPath = path.join(__dirname, '../../.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  // Try .env as fallback
  const envFallback = path.join(__dirname, '../../.env');
  if (fs.existsSync(envFallback)) {
    dotenv.config({ path: envFallback });
  } else {
    console.warn('⚠️  Warning: No .env.local or .env file found. Using system environment variables.');
  }
}

import { getPool } from '../lib/db';
import * as XLSX from 'xlsx';

// Custom application tables (our tables)
const CUSTOM_TABLES = [
  'generated_images',
  'favorites',
  'collections',
  'users',
  'schema_migrations',
  'image_action_history',
  'jobs',
  'keywords',
];

// Tables to exclude (Django, system tables)
const EXCLUDED_TABLES = [
  'auth_group',
  'auth_group_permissions',
  'auth_permission',
  'django_admin_log',
  'django_content_type',
  'django_migrations',
  'django_session',
  'users_groups',
  'users_user_permissions',
];

interface TableInfo {
  schema: string;
  name: string;
  rowCount: number;
  columnCount: number;
}

async function exportCustomTablesToExcel() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('📊 PostgreSQL Database to Excel Exporter (Next.js/TypeScript)');
    console.log('================================================================================');
    console.log('🔍 Fetching custom application tables...\n');

    // Get all tables
    const tablesResult = await client.query(`
      SELECT 
        table_schema,
        table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    // Filter to only custom tables
    const customTables = tablesResult.rows.filter(
      (table: any) =>
        CUSTOM_TABLES.includes(table.table_name) &&
        !EXCLUDED_TABLES.includes(table.table_name)
    );

    console.log(`Found ${customTables.length} custom table(s). Starting export...\n`);

    if (customTables.length === 0) {
      console.log('⚠️  No custom tables found. Only Django/system tables exist.');
      return;
    }

    // Create output directory
    const outputDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const summaryData: any[] = [
      ['Custom Tables Export Summary'],
      ['Generated at:', new Date().toISOString()],
      ['Database:', process.env.DATABASE_NAME || 'N/A'],
      [],
      ['Table Name', 'Row Count', 'Column Count', 'Status'],
    ];

    // Process each custom table
    for (let i = 0; i < customTables.length; i++) {
      const table = customTables[i];
      const tableName = table.table_name;
      const schemaName = table.table_schema;

      console.log(`[${i + 1}/${customTables.length}] Exporting: ${schemaName}.${tableName}...`);

      try {
        // Get column information
        const columnsResult = await client.query(
          `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position
        `,
          [schemaName, tableName]
        );

        // Get row count
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const rowCount = parseInt(countResult.rows[0].count);

        // Fetch data
        const dataResult = await client.query(`SELECT * FROM ${tableName} ORDER BY id LIMIT 10000`);
        const rows = dataResult.rows;
        const columns = columnsResult.rows.map((col: any) => col.column_name);

        console.log(`   ✅ (${rowCount} rows, ${columns.length} columns)`);

        // Create worksheet data
        const worksheetData: any[] = [];

        // Add metadata
        worksheetData.push(['=== TABLE METADATA ===']);
        worksheetData.push(['Table Name:', tableName]);
        worksheetData.push(['Schema:', schemaName]);
        worksheetData.push(['Total Rows:', rowCount]);
        worksheetData.push(['Exported Rows:', rows.length]);
        worksheetData.push(['Columns:', columns.length]);
        worksheetData.push([]);

        // Add column information
        worksheetData.push(['=== COLUMN INFORMATION ===']);
        worksheetData.push(['Column Name', 'Data Type', 'Nullable', 'Default Value']);

        columnsResult.rows.forEach((col: any) => {
          worksheetData.push([
            col.column_name,
            col.data_type,
            col.is_nullable,
            col.column_default || '',
          ]);
        });

        worksheetData.push([]);
        worksheetData.push(['=== TABLE DATA ===']);
        worksheetData.push([]);

        // Add headers
        worksheetData.push(columns);

        // Add data rows
        rows.forEach((row: any) => {
          const rowData = columns.map((col: string) => {
            const value = row[col];
            if (value === null) return '[NULL]';
            if (value instanceof Date) return value.toISOString();
            if (typeof value === 'object') {
              try {
                return JSON.stringify(value);
              } catch {
                return String(value);
              }
            }
            if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
            return String(value);
          });
          worksheetData.push(rowData);
        });

        // Add note if limited
        if (rowCount > 10000) {
          worksheetData.push([]);
          worksheetData.push([`⚠️ NOTE: Only first 10,000 rows exported. Total rows: ${rowCount}`]);
        }

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        worksheet['!cols'] = columns.map(() => ({ wch: 20 }));

        // Add to workbook (Excel sheet name limit is 31 characters)
        const sheetName = tableName.length > 31 ? tableName.substring(0, 31) : tableName;
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        // Add to summary
        summaryData.push([tableName, rowCount, columns.length, '✅']);

      } catch (error) {
        console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        summaryData.push([
          tableName,
          'ERROR',
          'ERROR',
          `❌ ${error instanceof Error ? error.message.substring(0, 30) : 'Unknown'}`,
        ]);
      }
    }

    // Create summary sheet
    console.log('\n📝 Creating summary sheet...');
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [
      { wch: 30 }, // Table Name
      { wch: 12 }, // Row Count
      { wch: 12 }, // Column Count
      { wch: 20 }, // Status
    ];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary', true);

    // Generate filename
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '')
      .slice(0, 15);
    const filename = `custom_tables_export_${timestamp}.xlsx`;
    const filepath = path.join(outputDir, filename);

    // Write file
    XLSX.writeFile(workbook, filepath);

    console.log('\n================================================================================');
    console.log(`✅ Export complete! File saved as: ${filename}`);
    console.log('================================================================================');
    console.log('\n📋 Export Summary:');
    console.log('--------------------------------------------------------------------------------');

    summaryData.slice(5).forEach((row: any[]) => {
      const [name, rows, cols, status] = row;
      if (name && name !== 'Table Name') {
        const rowCount = typeof rows === 'number' ? rows.toString().padStart(6) : rows;
        const colCount = typeof cols === 'number' ? cols.toString().padStart(6) : cols;
        console.log(`${status} ${name.padEnd(40)} ${rowCount} rows, ${colCount} columns`);
      }
    });

    console.log('\n🔌 Database connection closed.\n');

    return filepath;
  } catch (error) {
    console.error('❌ Error exporting database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  exportCustomTablesToExcel()
    .then((filepath) => {
      console.log(`✅ Success! File: ${filepath}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Export failed:', error);
      process.exit(1);
    });
}

export { exportCustomTablesToExcel };
