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

interface TableData {
  tableName: string;
  columns: string[];
  rows: any[];
}

/**
 * Export database to Excel - Next.js/TypeScript version
 * Filters out Django/system tables and only exports custom application tables
 */
async function exportDatabaseToExcel() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('🔍 Fetching database structure (Next.js/TypeScript)...');
    console.log('📋 Filtering out Django/system tables...');

    // Get all tables - filter out Django/system tables
    const tablesResult = await client.query(`
      SELECT 
        table_schema,
        table_name
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE 'auth_%'
      AND table_name NOT LIKE 'django_%'
      AND table_name NOT LIKE 'users_%'
      ORDER BY table_schema, table_name
    `);

    const tables = tablesResult.rows;
    console.log(`📊 Found ${tables.length} tables`);

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Process each table
    for (const table of tables) {
      const schemaName = table.table_schema;
      const tableName = table.table_name;
      const fullTableName = schemaName !== 'public' ? `${schemaName}.${tableName}` : tableName;

      console.log(`📋 Processing table: ${fullTableName}`);

      try {
        // Get column information
        const columnsResult = await client.query(`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position
        `, [schemaName, tableName]);

        // Fetch all data from the table
        const dataResult = await client.query(`SELECT * FROM ${fullTableName}`);
        
        const columns = columnsResult.rows.map(col => col.column_name);
        const rows = dataResult.rows;

        console.log(`   ✅ Found ${rows.length} rows with ${columns.length} columns`);

        // Create worksheet data
        const worksheetData: any[] = [];

        // Add header row with column info
        const headerRow = ['Column Name', 'Data Type', 'Nullable', 'Default Value'];
        worksheetData.push(headerRow);
        
        columnsResult.rows.forEach(col => {
          worksheetData.push([
            col.column_name,
            col.data_type,
            col.is_nullable,
            col.column_default || ''
          ]);
        });

        // Add separator
        worksheetData.push([]);
        worksheetData.push(['--- DATA ---']);
        worksheetData.push([]);

        // Add column headers
        worksheetData.push(columns);

        // Add data rows
        rows.forEach(row => {
          const rowData = columns.map(col => {
            const value = row[col];
            // Handle different data types
            if (value === null) return 'NULL';
            if (value instanceof Date) return value.toISOString();
            if (typeof value === 'object') return JSON.stringify(value);
            return value;
          });
          worksheetData.push(rowData);
        });

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // Set column widths
        const colWidths = [
          { wch: 20 }, // Column Name
          { wch: 15 }, // Data Type
          { wch: 10 }, // Nullable
          { wch: 20 }, // Default Value
        ];
        
        // Add widths for data columns
        columns.forEach(() => {
          colWidths.push({ wch: 15 });
        });
        
        worksheet['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, tableName.substring(0, 31)); // Excel sheet name limit

      } catch (error) {
        console.error(`   ❌ Error processing table ${fullTableName}:`, error);
        // Create an error sheet
        const errorSheet = XLSX.utils.aoa_to_sheet([
          ['Error'],
          [error instanceof Error ? error.message : 'Unknown error']
        ]);
        XLSX.utils.book_append_sheet(workbook, errorSheet, `ERROR_${tableName.substring(0, 25)}`);
      }
    }

    // Create summary sheet
    console.log('📝 Creating summary sheet...');
    const summaryData = [
      ['Database Export Summary'],
      ['Generated at:', new Date().toISOString()],
      [],
      ['Table Name', 'Row Count', 'Column Count'],
    ];

    for (const table of tables) {
      try {
        const countResult = await client.query(
          `SELECT COUNT(*) as count FROM ${table.table_schema !== 'public' ? `${table.table_schema}.${table.table_name}` : table.table_name}`
        );
        const colCountResult = await client.query(`
          SELECT COUNT(*) as count
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
        `, [table.table_schema, table.table_name]);

        summaryData.push([
          `${table.table_schema}.${table.table_name}`,
          parseInt(countResult.rows[0].count),
          parseInt(colCountResult.rows[0].count),
        ]);
      } catch (error) {
        summaryData.push([
          `${table.table_schema}.${table.table_name}`,
          'ERROR',
          'ERROR',
        ]);
      }
    }

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 40 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary', true); // Insert at beginning

    // Write to file
    const outputDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `database-export-${timestamp}.xlsx`;
    const filepath = path.join(outputDir, filename);

    XLSX.writeFile(workbook, filepath);

    console.log(`\n✅ Database exported successfully!`);
    console.log(`📁 File saved to: ${filepath}`);
    console.log(`📊 Total tables exported: ${tables.length}`);

    return filepath;
  } catch (error) {
    console.error('❌ Error exporting database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the export
if (require.main === module) {
  exportDatabaseToExcel()
    .then((filepath) => {
      console.log(`\n🎉 Export completed! File: ${filepath}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Export failed:', error);
      process.exit(1);
    });
}

export { exportDatabaseToExcel };
