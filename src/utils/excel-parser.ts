/**
 * Excel File Parser Utility
 * 
 * Handles parsing Excel files (XLSX) for FFB data import
 * Supports both FFA raw stats and FPs projections formats
 */

import * as XLSX from 'xlsx';
import { ProjectionImportResult } from '../types/data-contracts';

export interface ExcelParseResult {
  success: boolean;
  data?: any;
  sheets?: string[];
  errors: string[];
  warnings: string[];
  fileType: 'FFA' | 'FPs' | 'unknown';
}

export interface SheetData {
  name: string;
  data: any[];
  headers: string[];
  rowCount: number;
}

/**
 * Parse Excel file from File object
 */
export async function parseExcelFile(file: File): Promise<ExcelParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        success: false,
        errors: ['Excel file contains no sheets'],
        warnings: [],
        fileType: 'unknown'
      };
    }

    // Determine file type based on filename and sheet names
    const fileType = determineFileType(file.name, workbook.SheetNames);
    
    const result: ExcelParseResult = {
      success: true,
      data: {},
      sheets: workbook.SheetNames,
      errors: [],
      warnings: [],
      fileType
    };

    // Parse based on file type
    if (fileType === 'FFA') {
      result.data = parseFFAFile(workbook);
    } else if (fileType === 'FPs') {
      result.data = parseFPsFile(workbook);
    } else {
      // Generic parsing - return all sheets
      result.data = parseGenericFile(workbook);
      result.warnings.push('Unknown file type - parsed as generic Excel file');
    }

    return result;
  } catch (error) {
    return {
      success: false,
      errors: [`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      fileType: 'unknown'
    };
  }
}

/**
 * Determine file type based on filename and sheet names
 */
function determineFileType(filename: string, sheetNames: string[]): 'FFA' | 'FPs' | 'unknown' {
  const name = filename.toLowerCase();
  
  // Check for FFA indicators
  if (name.includes('ffa') || name.includes('raw_stats')) {
    return 'FFA';
  }
  
  // Check for FPs indicators
  if (name.includes('fps') || name.includes('projections')) {
    return 'FPs';
  }
  
  // Check sheet names for position indicators (FPs style)
  const positionSheets = sheetNames.filter(sheet => 
    ['QB', 'RB', 'WR', 'TE', 'K', 'DST', 'DEF'].some(pos => 
      sheet.toUpperCase().includes(pos)
    )
  );
  
  if (positionSheets.length >= 3) {
    return 'FPs';
  }
  
  // Check for common FFA column patterns in first sheet
  // (This would require parsing the first sheet to check headers)
  
  return 'unknown';
}

/**
 * Parse FFA raw stats file
 */
function parseFFAFile(workbook: XLSX.WorkBook): any[] {
  // FFA files typically have one main sheet with all players
  const firstSheet = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheet];
  
  if (!worksheet) {
    throw new Error('FFA file has no data sheet');
  }
  
  // Convert to JSON with header row detection
  const data = XLSX.utils.sheet_to_json(worksheet, {
    header: 1, // Return as array of arrays
    defval: '', // Default value for empty cells
    blankrows: false // Skip blank rows
  }) as string[][];
  
  if (data.length < 2) {
    throw new Error('FFA file must contain header row and at least one data row');
  }
  
  // Convert to objects using first row as headers
  const headers = data[0].map(h => String(h).trim());
  const rows = data.slice(1);
  
  return rows.map(row => {
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
}

/**
 * Parse FPs projections file (multi-sheet by position)
 */
function parseFPsFile(workbook: XLSX.WorkBook): Map<string, any[]> {
  const sheetData = new Map<string, any[]>();
  
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      console.warn(`Sheet ${sheetName} is empty, skipping`);
      continue;
    }
    
    try {
      // Convert to JSON objects
      const data = XLSX.utils.sheet_to_json(worksheet, {
        defval: '', // Default value for empty cells
        blankrows: false // Skip blank rows
      });
      
      // Filter out rows that don't look like player data
      const cleanData = data.filter((row: any) => {
        // Must have a Player field with actual content
        return row.Player && 
               typeof row.Player === 'string' && 
               row.Player.trim().length > 0 &&
               !row.Player.startsWith('¬') && // Filter out Excel comments
               row.Player.toLowerCase() !== 'player'; // Filter out duplicate headers
      });
      
      if (cleanData.length > 0) {
        sheetData.set(sheetName, cleanData);
        console.log(`Parsed ${cleanData.length} players from ${sheetName} sheet`);
      }
    } catch (error) {
      console.warn(`Failed to parse sheet ${sheetName}:`, error);
    }
  }
  
  return sheetData;
}

/**
 * Parse generic Excel file (return all sheets)
 */
function parseGenericFile(workbook: XLSX.WorkBook): { [sheetName: string]: any[] } {
  const result: { [sheetName: string]: any[] } = {};
  
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) continue;
    
    try {
      const data = XLSX.utils.sheet_to_json(worksheet, {
        defval: '',
        blankrows: false
      });
      
      result[sheetName] = data;
    } catch (error) {
      console.warn(`Failed to parse sheet ${sheetName}:`, error);
    }
  }
  
  return result;
}

/**
 * Get sheet information without full parsing (for preview)
 */
export async function getExcelSheetInfo(file: File): Promise<SheetData[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    const sheetInfo: SheetData[] = [];
    
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) continue;
      
      // Get range to determine size
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const rowCount = range.e.r + 1; // +1 because range is 0-based
      
      // Get headers (first row)
      const firstRow = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        range: 0 // Just first row
      }) as string[][];
      
      const headers = firstRow[0] ? firstRow[0].map(h => String(h).trim()) : [];
      
      sheetInfo.push({
        name: sheetName,
        data: [], // Don't load full data for preview
        headers,
        rowCount: Math.max(0, rowCount - 1) // Subtract header row
      });
    }
    
    return sheetInfo;
  } catch (error) {
    console.error('Failed to get sheet info:', error);
    return [];
  }
}

/**
 * Validate Excel data matches expected format
 */
export function validateExcelData(parseResult: ExcelParseResult): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [...parseResult.errors];
  const warnings: string[] = [...parseResult.warnings];
  
  if (!parseResult.success) {
    return { valid: false, errors, warnings };
  }
  
  if (parseResult.fileType === 'FFA') {
    // Validate FFA format
    const data = parseResult.data as any[];
    if (!Array.isArray(data) || data.length === 0) {
      errors.push('FFA file contains no player data');
    } else {
      // Check for required FFA columns
      const requiredColumns = ['player', 'team', 'position'];
      const firstRow = data[0];
      
      for (const col of requiredColumns) {
        if (!(col in firstRow)) {
          errors.push(`Missing required column: ${col}`);
        }
      }
      
      // Check for stat columns
      const statColumns = ['pass_yds', 'rush_yds', 'rec_yds'];
      const hasStats = statColumns.some(col => col in firstRow);
      if (!hasStats) {
        warnings.push('No stat columns found - this may not be a complete FFA file');
      }
    }
  } else if (parseResult.fileType === 'FPs') {
    // Validate FPs format
    const data = parseResult.data as Map<string, any[]>;
    if (!data || data.size === 0) {
      errors.push('FPs file contains no position sheets');
    } else {
      // Check that sheets contain Player column
      for (const [sheetName, sheetData] of data.entries()) {
        if (!Array.isArray(sheetData) || sheetData.length === 0) {
          warnings.push(`Sheet ${sheetName} is empty`);
          continue;
        }
        
        const firstRow = sheetData[0];
        if (!('Player' in firstRow)) {
          errors.push(`Sheet ${sheetName} missing Player column`);
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}