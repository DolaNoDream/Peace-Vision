import fs from 'fs';

// 读取 result.json
const resultData = JSON.parse(fs.readFileSync('./public/result.json', 'utf8'));

// River7.vue 中的数据 (1989-2024)
const post1989Data = {
  1989: { high_50000: 0, high_5000_50000: 3, high_900_5000: 7, low_0_300: 20, low_300_1000: 11 },
  1990: { high_50000: 0, high_5000_50000: 2, high_900_5000: 12, low_0_300: 26, low_300_1000: 9 },
  1991: { high_50000: 0, high_5000_50000: 4, high_900_5000: 9, low_0_300: 32, low_300_1000: 8 },
  1992: { high_50000: 0, high_5000_50000: 1, high_900_5000: 13, low_0_300: 30, low_300_1000: 7 },
  1993: { high_50000: 0, high_5000_50000: 2, high_900_5000: 7, low_0_300: 27, low_300_1000: 8 },
  1994: { high_50000: 0, high_5000_50000: 1, high_900_5000: 9, low_0_300: 32, low_300_1000: 8 },
  1995: { high_50000: 0, high_5000_50000: 2, high_900_5000: 7, low_0_300: 25, low_300_1000: 7 },
  1996: { high_50000: 0, high_5000_50000: 0, high_900_5000: 10, low_0_300: 26, low_300_1000: 5 },
  1997: { high_50000: 0, high_5000_50000: 2, high_900_5000: 7, low_0_300: 24, low_300_1000: 6 },
  1998: { high_50000: 0, high_5000_50000: 1, high_900_5000: 11, low_0_300: 22, low_300_1000: 6 },
  1999: { high_50000: 0, high_5000_50000: 2, high_900_5000: 10, low_0_300: 20, low_300_1000: 8 },
  2000: { high_50000: 1, high_5000_50000: 1, high_900_5000: 10, low_0_300: 24, low_300_1000: 4 },
  2001: { high_50000: 0, high_5000_50000: 0, high_900_5000: 9, low_0_300: 22, low_300_1000: 8 },
  2002: { high_50000: 0, high_5000_50000: 0, high_900_5000: 7, low_0_300: 18, low_300_1000: 8 },
  2003: { high_50000: 0, high_5000_50000: 1, high_900_5000: 5, low_0_300: 19, low_300_1000: 8 },
  2004: { high_50000: 0, high_5000_50000: 0, high_900_5000: 7, low_0_300: 20, low_300_1000: 6 },
  2005: { high_50000: 0, high_5000_50000: 0, high_900_5000: 5, low_0_300: 26, low_300_1000: 2 },
  2006: { high_50000: 0, high_5000_50000: 0, high_900_5000: 6, low_0_300: 20, low_300_1000: 7 },
  2007: { high_50000: 0, high_5000_50000: 1, high_900_5000: 3, low_0_300: 23, low_300_1000: 8 },
  2008: { high_50000: 0, high_5000_50000: 2, high_900_5000: 3, low_0_300: 23, low_300_1000: 10 },
  2009: { high_50000: 0, high_5000_50000: 3, high_900_5000: 3, low_0_300: 19, low_300_1000: 12 },
  2010: { high_50000: 0, high_5000_50000: 2, high_900_5000: 2, low_0_300: 20, low_300_1000: 7 },
  2011: { high_50000: 0, high_5000_50000: 1, high_900_5000: 6, low_0_300: 25, low_300_1000: 5 },
  2012: { high_50000: 1, high_5000_50000: 1, high_900_5000: 4, low_0_300: 20, low_300_1000: 7 },
  2013: { high_50000: 1, high_5000_50000: 1, high_900_5000: 5, low_0_300: 24, low_300_1000: 8 },
  2014: { high_50000: 1, high_5000_50000: 3, high_900_5000: 9, low_0_300: 31, low_300_1000: 2 },
  2015: { high_50000: 0, high_5000_50000: 5, high_900_5000: 6, low_0_300: 36, low_300_1000: 7 },
  2016: { high_50000: 0, high_5000_50000: 4, high_900_5000: 8, low_0_300: 35, low_300_1000: 7 },
  2017: { high_50000: 0, high_5000_50000: 4, high_900_5000: 6, low_0_300: 32, low_300_1000: 11 },
  2018: { high_50000: 0, high_5000_50000: 2, high_900_5000: 4, low_0_300: 34, low_300_1000: 12 },
  2019: { high_50000: 0, high_5000_50000: 2, high_900_5000: 5, low_0_300: 40, low_300_1000: 10 },
  2020: { high_50000: 0, high_5000_50000: 4, high_900_5000: 4, low_0_300: 35, low_300_1000: 14 },
  2021: { high_50000: 1, high_5000_50000: 2, high_900_5000: 2, low_0_300: 35, low_300_1000: 14 },
  2022: { high_50000: 2, high_5000_50000: 0, high_900_5000: 6, low_0_300: 31, low_300_1000: 17 },
  2023: { high_50000: 1, high_5000_50000: 2, high_900_5000: 6, low_0_300: 40, low_300_1000: 10 },
  2024: { high_50000: 1, high_5000_50000: 1, high_900_5000: 9, low_0_300: 39, low_300_1000: 11 }
};

// 处理数据
const processedData = resultData.map(item => {
  const year = item.year;
  
  if (year <= 1988) {
    // 1988年及之前：保留原有的 intensity_level_1_count 和 intensity_level_2_count，其他新字段置为0
    return {
      ...item,
      high_intensity_50000_plus: 0,
      high_intensity_5000_50000: 0,
      high_intensity_900_5000: 0,
      low_intensity_0_300: 0,
      low_intensity_300_1000: 0
    };
  } else {
    // 1989年及之后：使用 River7.vue 的数据，intensity_level_1_count 和 intensity_level_2_count 置为0
    const yearData = post1989Data[year];
    if (yearData) {
      return {
        ...item,
        high_intensity_50000_plus: yearData.high_50000,
        high_intensity_5000_50000: yearData.high_5000_50000,
        high_intensity_900_5000: yearData.high_900_5000,
        intensity_level_1_count: 0,
        intensity_level_2_count: 0,
        low_intensity_0_300: yearData.low_0_300,
        low_intensity_300_1000: yearData.low_300_1000
      };
    }
    return item;
  }
});

// 写入新文件
fs.writeFileSync('./public/result2.json', JSON.stringify(processedData, null, 2));
console.log('数据处理完成！');
console.log('样例数据（1988年）:', processedData.find(d => d.year === 1988));
console.log('样例数据（1989年）:', processedData.find(d => d.year === 1989));
console.log('样例数据（2024年）:', processedData.find(d => d.year === 2024));
