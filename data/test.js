const XLSX = require('xlsx');
const path = require('path');

class DataExtractor {
  constructor(workbook = null) {
    this.workbook = workbook;
    this.sheetNames = workbook ? workbook.SheetNames : [];
  }

  static fromPath(filePath) {
    const workbook = XLSX.readFile(filePath);
    return new DataExtractor(workbook);
  }

  getSheetNames() {
    return this.sheetNames;
  }

  getSheetDataAsObjects(sheetName = null) {
    if (!this.workbook) {
      throw new Error('Workbook not loaded');
    }
    const targetSheet = sheetName || this.workbook.SheetNames[0];
    const worksheet = this.workbook.Sheets[targetSheet];
    return XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  }

  getColumnHeaders(sheetName = null) {
    const data = this.getSheetData(sheetName);
    return data.length > 0 ? data[0] : [];
  }

  getSheetData(sheetName = null) {
    if (!this.workbook) {
      throw new Error('Workbook not loaded');
    }
    const targetSheet = sheetName || this.workbook.SheetNames[0];
    const worksheet = this.workbook.Sheets[targetSheet];
    return XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  }

  getConflictsByLocation(location, sheetName = null) {
    const data = this.getSheetDataAsObjects(sheetName);
    return data.filter(row => 
      row.location && row.location.toLowerCase().includes(location.toLowerCase())
    );
  }

  getConflictsByYear(year, sheetName = null) {
    const data = this.getSheetDataAsObjects(sheetName);
    return data.filter(row => row.year === year);
  }

  getSummaryStats(sheetName = null) {
    const data = this.getSheetDataAsObjects(sheetName);
    const totalConflicts = data.length;
    const totalDeaths = data.reduce((sum, row) => sum + (Number(row.total_deaths) || 0), 0);
    const avgDeaths = totalConflicts > 0 ? (totalDeaths / totalConflicts).toFixed(2) : 0;
    const maxDeaths = Math.max(...data.map(row => Number(row.total_deaths) || 0));
    const minDeaths = Math.min(...data.map(row => Number(row.total_deaths) || Infinity));
    
    return {
      totalConflicts,
      totalDeaths,
      avgDeaths: Number(avgDeaths),
      maxDeaths,
      minDeaths: minDeaths === Infinity ? 0 : minDeaths
    };
  }
}

console.log('=== DataExtractor Test ===\n');

try {
  const filePath = path.join(__dirname, 'data', 'conflicts.xlsx');
  console.log(`Loading file: ${filePath}`);
  
  const extractor = DataExtractor.fromPath(filePath);
  console.log('✓ File loaded successfully');
  
  const sheets = extractor.getSheetNames();
  console.log(`✓ Sheets: ${sheets.join(', ')}`);
  
  const headers = extractor.getColumnHeaders();
  console.log(`✓ Columns: ${headers.length}`);
  
  const data = extractor.getSheetDataAsObjects();
  console.log(`✓ Rows: ${data.length}`);
  
  const stats = extractor.getSummaryStats();
  console.log(`\n✓ Summary Stats:`);
  console.log(`  - Total Conflicts: ${stats.totalConflicts}`);
  console.log(`  - Total Deaths: ${stats.totalDeaths}`);
  console.log(`  - Average Deaths: ${stats.avgDeaths}`);
  console.log(`  - Max Deaths: ${stats.maxDeaths}`);
  console.log(`  - Min Deaths: ${stats.minDeaths}`);
  
  const indiaConflicts = extractor.getConflictsByLocation('India');
  console.log(`\n✓ Filter by location (India): ${indiaConflicts.length} items`);
  
  const conflicts2012 = extractor.getConflictsByYear(2012);
  console.log(`✓ Filter by year (2012): ${conflicts2012.length} items`);
  
  console.log('\n=== All tests passed! ===');
  
} catch (error) {
  console.error('✗ Test failed:', error.message);
  process.exit(1);
}