# DataExtractor 工具类使用说明

## 概述

`DataExtractor` 是一个用于提取 Excel 文件（.xlsx）数据的工具类，专门针对 `conflicts.xlsx` 文件结构进行优化。该工具类提供了丰富的方法来提取、过滤和分析冲突数据。

## 文件结构

```
├── data/
│   └── conflicts.xlsx        # 冲突数据文件
├── frondend/
│   └── vite-project/
│       └── src/
│           └── utils/
│               └── DataExtractor.js  # 工具类
└── doc/
    └── DataExtractor.md      # 本说明文档
```

## 数据结构

`conflicts.xlsx` 文件包含以下字段：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| conflict_id | Number | 冲突唯一标识 |
| location | String | 冲突发生地点 |
| side_a | String | A方名称 |
| side_a_id | Number | A方ID |
| side_a_2nd | String | A方第二方 |
| side_b | String | B方名称 |
| side_b_id | Number | B方ID |
| side_b_2nd | String | B方第二方 |
| incompatibility | Number | 不兼容类型 |
| territory_name | String | 领土名称 |
| year | Number | 年份 |
| intensity_level | Number | 强度等级 |
| cumulative_intensity | Number | 累积强度 |
| type_of_conflict | Number | 冲突类型 |
| start_date | Number | 开始日期 |
| start_prec | Number | 开始日期精度 |
| start_date2 | Number | 第二开始日期 |
| start_prec2 | Number | 第二开始日期精度 |
| ep_end | Number | 结束标志 |
| ep_end_date | Number | 结束日期 |
| ep_end_prec | String | 结束日期精度 |
| gwno_a | Number | A方GWN编号 |
| gwno_a_2nd | String | A方第二方GWN编号 |
| gwno_b | String | B方GWN编号 |
| gwno_b_2nd | String | B方第二方GWN编号 |
| gwno_loc | Number | 地点GWN编号 |
| region | Number | 地区编号 |
| version | Number | 数据版本 |
| total_deaths | Number | 死亡总数 |

## 安装依赖

```bash
cd frondend/vite-project
npm install xlsx
```

## 使用方法

### 方式一：从文件对象加载（前端上传）

```javascript
import DataExtractor from '@/utils/DataExtractor';

const fileInput = document.getElementById('file-input');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const extractor = await DataExtractor.fromFile(file);
  
  // 获取所有数据
  const data = extractor.getSheetDataAsObjects();
  console.log(data);
});
```

### 方式二：从文件路径加载（Node.js 环境）

```javascript
import { extractFromPath } from '@/utils/DataExtractor';

const extractor = extractFromPath('../data/conflicts.xlsx');
const data = extractor.getSheetDataAsObjects();
```

### 方式三：快速提取全部数据

```javascript
import { extractAllData } from '@/utils/DataExtractor';

const { sheets, data } = await extractAllData(file);
console.log('工作表:', sheets);
console.log('数据:', data);
```

## API 方法

### 基础方法

| 方法 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| `getSheetNames()` | 获取所有工作表名称 | 无 | String[] |
| `getSheetData(sheetName)` | 获取原始数组格式数据 | sheetName: String (可选) | Array[] |
| `getSheetDataAsObjects(sheetName)` | 获取对象数组格式数据 | sheetName: String (可选) | Object[] |
| `getColumnHeaders(sheetName)` | 获取列标题 | sheetName: String (可选) | String[] |
| `getDataByColumn(columnName, sheetName)` | 按列名提取数据 | columnName: String, sheetName: String (可选) | Array |
| `getFilteredData(filterFn, sheetName)` | 自定义过滤 | filterFn: Function, sheetName: String (可选) | Object[] |
| `getRowCount(sheetName)` | 获取数据行数 | sheetName: String (可选) | Number |

### 冲突数据专用方法

| 方法 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| `getConflictsByLocation(location, sheetName)` | 按地点筛选冲突 | location: String, sheetName: String (可选) | Object[] |
| `getConflictsByYear(year, sheetName)` | 按年份筛选冲突 | year: Number, sheetName: String (可选) | Object[] |
| `getConflictsByIntensity(intensityLevel, sheetName)` | 按强度等级筛选 | intensityLevel: Number, sheetName: String (可选) | Object[] |
| `getConflictsByType(type, sheetName)` | 按冲突类型筛选 | type: Number, sheetName: String (可选) | Object[] |
| `getConflictById(conflictId, sheetName)` | 按ID查找冲突 | conflictId: Number, sheetName: String (可选) | Object |
| `getTotalDeathsByLocation(location, sheetName)` | 计算地点死亡总数 | location: String, sheetName: String (可选) | Number |
| `getUniqueLocations(sheetName)` | 获取所有唯一地点 | sheetName: String (可选) | String[] |
| `getUniqueYears(sheetName)` | 获取所有唯一年份 | sheetName: String (可选) | Number[] |
| `getSummaryStats(sheetName)` | 获取统计摘要 | sheetName: String (可选) | Object |

## 示例

### 示例 1：获取统计摘要

```javascript
const extractor = await DataExtractor.fromFile(file);
const stats = extractor.getSummaryStats();
console.log(stats);
// {
//   totalConflicts: 303,
//   totalDeaths: 123456,
//   avgDeaths: 407.45,
//   maxDeaths: 9999,
//   minDeaths: 0,
//   uniqueLocations: 50,
//   uniqueYears: 10
// }
```

### 示例 2：按地点筛选

```javascript
const indiaConflicts = extractor.getConflictsByLocation('India');
console.log('印度冲突数量:', indiaConflicts.length);
```

### 示例 3：按年份筛选

```javascript
const conflicts2012 = extractor.getConflictsByYear(2012);
console.log('2012年冲突:', conflicts2012);
```

### 示例 4：计算特定地点死亡总数

```javascript
const deathsInSudan = extractor.getTotalDeathsByLocation('Sudan');
console.log('苏丹死亡总数:', deathsInSudan);
```

### 示例 5：获取唯一地点列表

```javascript
const locations = extractor.getUniqueLocations();
console.log('所有冲突地点:', locations);
```

### 示例 6：自定义过滤

```javascript
const highIntensityConflicts = extractor.getFilteredData(row => 
  row.intensity_level >= 2 && row.total_deaths > 100
);
console.log('高强度高死亡冲突:', highIntensityConflicts);
```

## 注意事项

1. **文件格式**：仅支持 `.xlsx` 格式文件
2. **异步加载**：`fromFile()` 方法返回 Promise，需要使用 `await`
3. **路径加载**：`fromPath()` 仅在 Node.js 环境可用，浏览器环境请使用 `fromFile()`
4. **空值处理**：空值会被转换为空字符串 `''`
5. **日期格式**：日期字段以 Excel 序列号形式返回，如需转换请使用相应的日期处理库

## 版本历史

| 版本 | 更新内容 | 日期 |
|------|----------|------|
| 1.0.0 | 初始版本，支持基础数据提取 | 2026-05-07 |