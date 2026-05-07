import * as XLSX from 'xlsx';

class DataExtractor {
  constructor(workbook = null) {
    this.workbook = workbook;
    this.sheetNames = workbook ? workbook.SheetNames : [];
  }

  static async fromFile(file) {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    return new DataExtractor(workbook);
  }

  static fromPath(filePath) {
    const workbook = XLSX.readFile(filePath);
    return new DataExtractor(workbook);
  }

  getSheetNames() {
    return this.sheetNames;
  }

  getSheetData(sheetName = null) {
    if (!this.workbook) {
      throw new Error('Workbook not loaded');
    }
    const targetSheet = sheetName || this.workbook.SheetNames[0];
    const worksheet = this.workbook.Sheets[targetSheet];
    return XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
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

  getDataByColumn(columnName, sheetName = null) {
    const data = this.getSheetDataAsObjects(sheetName);
    return data.map(row => row[columnName]);
  }

  getFilteredData(filterFn, sheetName = null) {
    const data = this.getSheetDataAsObjects(sheetName);
    return data.filter(filterFn);
  }

  getRowCount(sheetName = null) {
    const data = this.getSheetData(sheetName);
    return data.length > 0 ? data.length - 1 : 0;
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

  getConflictsByIntensity(intensityLevel, sheetName = null) {
    const data = this.getSheetDataAsObjects(sheetName);
    return data.filter(row => row.intensity_level === intensityLevel);
  }

  getConflictsByType(type, sheetName = null) {
    const data = this.getSheetDataAsObjects(sheetName);
    return data.filter(row => row.type_of_conflict === type);
  }

  getTotalDeathsByLocation(location, sheetName = null) {
    const conflicts = this.getConflictsByLocation(location, sheetName);
    return conflicts.reduce((sum, row) => sum + (Number(row.total_deaths) || 0), 0);
  }

  getConflictById(conflictId, sheetName = null) {
    const data = this.getSheetDataAsObjects(sheetName);
    return data.find(row => row.conflict_id === conflictId);
  }

  getUniqueLocations(sheetName = null) {
    const data = this.getSheetDataAsObjects(sheetName);
    const locations = new Set(data.map(row => row.location).filter(Boolean));
    return Array.from(locations);
  }

  getUniqueYears(sheetName = null) {
    const data = this.getSheetDataAsObjects(sheetName);
    const years = new Set(data.map(row => row.year).filter(Boolean));
    return Array.from(years).sort((a, b) => a - b);
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
      minDeaths: minDeaths === Infinity ? 0 : minDeaths,
      uniqueLocations: this.getUniqueLocations(sheetName).length,
      uniqueYears: this.getUniqueYears(sheetName).length
    };
  }
}

export async function extractFromFile(file) {
  return await DataExtractor.fromFile(file);
}

export function extractFromPath(filePath) {
  return DataExtractor.fromPath(filePath);
}

export async function extractAllData(file) {
  const extractor = await DataExtractor.fromFile(file);
  return {
    sheets: extractor.getSheetNames(),
    data: extractor.getSheetDataAsObjects()
  };
}

export default DataExtractor;
