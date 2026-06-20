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
    const fs = require('fs');
    
    if (typeof XLSX.readFile === 'function') {
      const workbook = XLSX.readFile(filePath);
      return new DataExtractor(workbook);
    } else {
      const data = fs.readFileSync(filePath);
      const workbook = XLSX.read(data, { type: 'buffer' });
      return new DataExtractor(workbook);
    }
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
    const targetYear = Number(year);
    return data.filter(row => Number(row.year) === targetYear);
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
    const years = new Set(data.map(row => Number(row.year)).filter(Boolean));
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

  getAllConflictIds(sheetName = null) {
    const data = this.getSheetDataAsObjects(sheetName);
    const ids = new Set(data.map(row => row.conflict_id).filter(Boolean));
    return Array.from(ids);
  }
}

class ConflictDataManager {
  constructor() {
    this.mainExtractor = null;
    this.yearExtractor = null;
    this.mainData = [];
    this.yearData = [];
    this.conflictMap = new Map();
  }

  async loadMainFile(file) {
    this.mainExtractor = await DataExtractor.fromFile(file);
    this.mainData = this.mainExtractor.getSheetDataAsObjects();
    this._buildConflictMap();
    console.log('Main data loaded:', this.mainData.length, 'records');
  }

  async loadYearFile(file) {
    this.yearExtractor = await DataExtractor.fromFile(file);
    this.yearData = this.yearExtractor.getSheetDataAsObjects();
    console.log('Year data loaded:', this.yearData.length, 'records');
  }

  loadMainFileFromPath(filePath) {
    this.mainExtractor = DataExtractor.fromPath(filePath);
    this.mainData = this.mainExtractor.getSheetDataAsObjects();
    this._buildConflictMap();
  }

  loadYearFileFromPath(filePath) {
    this.yearExtractor = DataExtractor.fromPath(filePath);
    this.yearData = this.yearExtractor.getSheetDataAsObjects();
  }

  _buildConflictMap() {
    this.conflictMap.clear();
    this.mainData.forEach(row => {
      if (row.conflict_id) {
        this.conflictMap.set(row.conflict_id, row);
      }
    });
    console.log('Conflict map built:', this.conflictMap.size, 'entries');
  }

  getConflictsByYear(year) {
    const targetYear = Number(year);
    console.log('getConflictsByYear called with year:', targetYear, 'type:', typeof targetYear);
    
    if (!this.yearExtractor || this.yearData.length === 0) {
      console.log('Year data not loaded, using main extractor');
      return this.mainExtractor.getConflictsByYear(targetYear);
    }

    console.log('Year data available, length:', this.yearData.length);
    
    const yearConflicts = this.yearData.filter(row => Number(row.year) === targetYear);
    console.log('Found', yearConflicts.length, 'records in year table for year', targetYear);
    
    const conflictIds = new Set(yearConflicts.map(row => row.conflict_id));
    console.log('Unique conflict_ids:', conflictIds.size);
    
    const result = [];
    conflictIds.forEach(id => {
      const mainConflict = this.conflictMap.get(id);
      if (mainConflict) {
        const yearRecord = yearConflicts.find(r => r.conflict_id === id);
        result.push({
          ...mainConflict,
          year: yearRecord ? yearRecord.year : mainConflict.year,
          intensity_level: yearRecord && yearRecord.intensity_level ? yearRecord.intensity_level : mainConflict.intensity_level,
          total_deaths: yearRecord && yearRecord.best_est ? yearRecord.best_est : (yearRecord && yearRecord.total_deaths ? yearRecord.total_deaths : mainConflict.total_deaths)
        });
      } else {
        console.log('Conflict not found in main data:', id);
      }
    });
    
    console.log('Final result:', result.length, 'conflicts');
    return result;
  }

  getConflictsByLocation(location) {
    return this.mainExtractor.getConflictsByLocation(location);
  }

  getAllYears() {
    if (!this.yearExtractor || this.yearData.length === 0) {
      return this.mainExtractor.getUniqueYears();
    }
    const years = new Set(this.yearData.map(row => Number(row.year)).filter(Boolean));
    return Array.from(years).sort((a, b) => b - a);
  }

  getAllLocations() {
    return this.mainExtractor.getUniqueLocations();
  }

  getConflictById(conflictId) {
    return this.conflictMap.get(conflictId);
  }

  getSummaryStats() {
    return this.mainExtractor.getSummaryStats();
  }

  getAllMainData() {
    return this.mainData;
  }

  getAllYearData() {
    return this.yearData;
  }
}

export async function extractFromFile(file) {
  return await DataExtractor.fromFile(file);
}

export function extractFromPath(filePath) {
  return DataExtractor.fromPath(filePath);
}

export { DataExtractor, ConflictDataManager };

export default DataExtractor;