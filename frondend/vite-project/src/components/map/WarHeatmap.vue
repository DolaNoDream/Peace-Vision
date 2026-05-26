<script setup>
import { ref, onMounted, watch } from 'vue';
import * as echarts from 'echarts';
import * as XLSX from 'xlsx';
import worldGeoJSON from '../../assets/world.json';

const chartRef = ref(null);
const currentYear = ref(1945); // 1945 为 SUMMARY 模式
const loadingMsg = ref("正在加载战争数据表，请稍候...");
let myChart = null;


// 数据存储
let rawConflictData = []; 
let battleDeathData = []; 

// 核心地名映射表 (Key 为地图标准名, Value 为你 Excel 中的名字)
const nameMap = {
  'Afghanistan': 'Afghanistan',
  'Angola': 'Angola',
  'Albania': 'Albania',
  'United Arab Emirates': 'United Arab Emirates',
  'Argentina': 'Argentina',
  'Armenia': 'Armenia',
  'Australia': 'Australia',
  'Austria': 'Austria',
  'Azerbaijan': 'Azerbaijan',
  'Burundi': 'Burundi',
  'Belgium': 'Belgium',
  'Benin': 'Benin',
  'Burkina Faso': 'Burkina Faso',
  'Bangladesh': 'Bangladesh',
  'Bulgaria': 'Bulgaria',
  'Bosnia and Herz.': 'Bosnia-Herzegovina',
  'Bolivia': 'Bolivia',
  'Brazil': 'Brazil',
  'Brunei': 'Brunei',
  'Botswana': 'Botswana',
  'Cambodia': 'Cambodia (Kampuchea)',
  'Central African Rep.': 'Central African Republic',
  'Canada': 'Canada',
  'Switzerland': 'Switzerland',
  'Chile': 'Chile',
  'China': 'China',
  'Ivory Coast': 'Ivory Coast',
  'Cameroon': 'Cameroon',
  'Dem. Rep. Congo': 'DR Congo (Zaire)',
  'Congo': 'Congo',
  'Colombia': 'Colombia',
  'Costa Rica': 'Costa Rica',
  'Cuba': 'Cuba',
  'Comoros': 'Comoros',
  'Chad': 'Chad',
  'Cyprus': 'Cyprus',
  'Czech Rep.': 'Czech Republic',
  'Germany': 'Germany',
  'Djibouti': 'Djibouti',
  'Dominican Rep.': 'Dominican Republic',
  'Algeria': 'Algeria',
  'Ecuador': 'Ecuador',
  'Egypt': 'Egypt',
  'Eritrea': 'Eritrea',
  'El Salvador': 'El Salvador',
  'Spain': 'Spain',
  'Estonia': 'Estonia',
  'Ethiopia': 'Ethiopia',
  'Finland': 'Finland',
  'France': 'France',
  'Gabon': 'Gabon',
  'Georgia': 'Georgia',
  'Ghana': 'Ghana',
  'Guinea': 'Guinea',
  'Gambia': 'Gambia',
  'Guinea-Bissau': 'Guinea-Bissau',
  'Greece': 'Greece',
  'Guatemala': 'Guatemala',
  'Grenada': 'Grenada',
  'Honduras': 'Honduras',
  'Croatia': 'Croatia',
  'Haiti': 'Haiti',
  'Hungary': 'Hungary',
  'Indonesia': 'Indonesia',
  'India': 'India',
  'Ireland': 'Ireland',
  'Iran': 'Iran',
  'Iraq': 'Iraq',
  'Israel': 'Israel',
  'Italy': 'Italy',
  'Côte d\'Ivoire': 'Ivory Coast',
  'Jordan': 'Jordan',
  'Japan': 'Japan',
  'Kazakhstan': 'Kazakhstan',
  'Kenya': 'Kenya',
  'Kyrgyzstan': 'Kyrgyzstan',
  'Korea': 'South Korea',
  'Kuwait': 'Kuwait',
  'Lao PDR': 'Laos',
  'Lebanon': 'Lebanon',
  'Liberia': 'Liberia',
  'Libya': 'Libya',
  'Lesotho': 'Lesotho',
  'Lithuania': 'Lithuania',
  'Latvia': 'Latvia',
  'Morocco': 'Morocco',
  'Moldova': 'Moldova',
  'Madagascar': 'Madagascar (Malagasy)',
  'Malaysia': 'Malaysia',
  'Mexico': 'Mexico',
  'North Macedonia': 'North Macedonia',
  'Mali': 'Mali',
  'Myanmar': 'Myanmar (Burma)',
  'Montenegro': 'Montenegro',
  'Mongolia': 'Mongolia',
  'Mozambique': 'Mozambique',
  'Mauritania': 'Mauritania',
  'Namibia': 'Namibia',
  'Niger': 'Niger',
  'Nigeria': 'Nigeria',
  'Nicaragua': 'Nicaragua',
  'Netherlands': 'Netherlands',
  'Norway': 'Norway',
  'Nepal': 'Nepal',
  'New Zealand': 'New Zealand',
  'Oman': 'Oman',
  'Pakistan': 'Pakistan',
  'Panama': 'Panama',
  'Peru': 'Peru',
  'Philippines': 'Philippines',
  'Papua New Guinea': 'Papua New Guinea',
  'Poland': 'Poland',
  'Dem. Rep. Korea': 'North Korea',
  'Portugal': 'Portugal',
  'Paraguay': 'Paraguay',
  'Qatar': 'Qatar',
  'Romania': 'Romania',
  'Russia': 'Russia (Soviet Union)',
  'Rwanda': 'Rwanda',
  'Saudi Arabia': 'Saudi Arabia',
  'Sudan': 'Sudan',
  'South Sudan': 'South Sudan',
  'Senegal': 'Senegal',
  'Sierra Leone': 'Sierra Leone',
  'Serbia': 'Serbia (Yugoslavia)',
  'Suriname': 'Suriname',
  'Slovakia': 'Slovakia',
  'Slovenia': 'Slovenia',
  'Somalia': 'Somalia',
  'Sweden': 'Sweden',
  'Syria': 'Syria',
  'South Africa': 'South Africa',
  'S. Sudan': 'South Sudan',
  'Sri Lanka': 'Sri Lanka',
  'Togo': 'Togo',
  'Thailand': 'Thailand',
  'Tajikistan': 'Tajikistan',
  'Turkmenistan': 'Turkmenistan',
  'Trinidad and Tobago': 'Trinidad and Tobago',
  'Tunisia': 'Tunisia',
  'Turkey': 'Turkey',
  'Taiwan': 'Taiwan',
  'Tanzania': 'Tanzania',
  'Uganda': 'Uganda',
  'Ukraine': 'Ukraine',
  'Uruguay': 'Uruguay',
  'United Kingdom': 'United Kingdom',
  'United Republic of Tanzania': 'Tanzania',
  'United States of America': 'United States of America',
  'Uzbekistan': 'Uzbekistan',
  'Venezuela': 'Venezuela',
  'Vietnam': 'Vietnam (North Vietnam)',
  'Yemen': 'Yemen (North Yemen)',
  'Zambia': 'Zambia',
  'Zimbabwe': 'Zimbabwe (Rhodesia)'
};

// 渲染主函数
const renderMap = (mapData, isSummary = false) => {
  if (!myChart) return;

  const option = {
    backgroundColor: '#FDFBF7',
    title: {
      text: isSummary ? '1946-2024 全球战争死亡数据汇总' : `全球战争伤亡演变 (${currentYear.value}年)`,
      subtext: isSummary ? '数据由历年明细动态累加计算' : '颜色深浅代表当年估计死亡人数',
      left: 'center', top: 20,
      textStyle: { color: '#2C2B28', fontSize: 24, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        //const val = params.data ? params.data.value : 0;
        const val = Number(params.data?.value) || 0;
        return `<b>${params.name}</b><br/>${isSummary ? '历史累计' : '当年'}估计死亡: ${Math.round(val).toLocaleString()} 人`;
      }
    },
    visualMap: {
      type: 'piecewise',
      left: '5%', bottom: '15%',
      pieces: isSummary ? [
        // 历史累计的总量区间
        { min: 500000, label: '>50万', color: '#4E0E0C' },
        { min: 100000, max: 499999, color: '#731513' },
        { min: 10000, max: 99999, color: '#96281B' },
        { min: 1000, max: 9999, color: '#BD2E1F' },
        { min: 1, max: 999, color: '#F8B87A' },
        { value: 0, label: '和平/无数据', color: '#ECE8E3' }
      ] : [
        // 单年区间
        { min: 10000, label: '>1万', color: '#731513' },
        { min: 1000, max: 9999, color: '#96281B' },
        { min: 500, max: 999, color: '#BD2E1F' },
        { min: 100, max: 499, color: '#E66B22' },
        { min: 1, max: 99, color: '#F8B87A' },
        { value: 0, label: '和平', color: '#ECE8E3' }
      ],
      outOfRange: { color: '#ECE8E3' }
    },
    series: [
      {
        name: '热力层',
        type: 'map',
        map: 'world',
        roam: true,
        nameMap: nameMap,
        selectedMode: false,
        itemStyle: { areaColor: '#ECE8E3', borderColor: '#D1CDC3' },
        emphasis: { itemStyle: { areaColor: '#E1BC85' } },
        data: mapData
      }
    ]
  };
  myChart.setOption(option, true);
};
// 著名历史战争伤亡特定修正器 (针对 1989 年以前粗颗粒度数据的精细化修正)
const getHistoricalOverride = (location, year) => {
  const locStr = String(location || "");
  
  // 1. 朝鲜战争 (1950 - 1953) -> 历史统计年均战斗伤亡约 15~20 万
  if (locStr.includes("Korea") && year >= 1950 && year <= 1953) {
    return 180000;
  }
  // 2. 越南战争高峰期 (1960 - 1975) -> 历史统计年均战斗伤亡约 5~10 万
  if (locStr.includes("Vietnam") && year >= 1960 && year <= 1975) {
    return 80000;
  }
  // 3. 国共内战后期 (1946 - 1949) -> 历史统计年均战斗伤亡约 15 万左右
  if (locStr.includes("China") && year >= 1946 && year <= 1949) {
    return 150000;
  }
  // 4. 两伊战争 (1980 - 1988) -> 历史统计年均战斗伤亡约 5~8 万
  if ((locStr.includes("Iran") || locStr.includes("Iraq")) && year >= 1980 && year <= 1988) {
    return 60000;
  }
  // 5. 尼日利亚内战/比亚法拉战争 (1967 - 1970) -> 历史估算战死年均约 8 万
  if (locStr.includes("Nigeria") && year >= 1967 && year <= 1970) {
    return 80000;
  }
  // 6. 苏联入侵阿富汗战争 (1979 - 1989) -> 估算年均战死约 1.5 万
  if (locStr.includes("Afghanistan") && year >= 1979 && year <= 1988) {
    return 15000;
  }
  return null; // 其他冲突返回 null，进入默认计算流
};

// 计算指定冲突在特定年份的死亡人数
const getConflictDeaths = (conf, year) => {
  /*
  if (year >= 1989) {
    const dMatch = battleDeathData.find(d => d.conflict_id == conf.conflict_id && d.year == year);
    return dMatch ? (Number(dMatch.bd_best) || 0) : 0;
  } else {
    // 1989 年前：尝试取 total_deaths 字段，若缺失则根据烈度兜底
    //return Number(conf.total_deaths) || (conf.intensity_level == 2 ? 1000 : 25);
    // 1989 年以前：
    // 步骤 A: 优先尝试命中著名大型战争的历史学修正数值
    const overrideValue = getHistoricalOverride(conf.location, year);
    if (overrideValue !== null) {
      return overrideValue;
    }
    // 步骤 B: 其次尝试直接提取表格中可能携带的 total_deaths 字段
    const rawDeaths = Number(conf.total_deaths);
    if (!isNaN(rawDeaths) && rawDeaths > 0) {
      return rawDeaths;
    }
  }*/
  let deaths = 0;

  if (year >= 1989) {

    // 1989 后：使用 BattleDeaths 精确数据
    const dMatch = battleDeathData.find(
      d => d.conflict_id == conf.conflict_id && d.year == year
    );

    deaths = dMatch ? (Number(dMatch.bd_best) || 0) : 0;

  } else {

    // ===== 1989 前 =====

    // 1. 优先使用历史大战修正值
    const overrideValue = getHistoricalOverride(conf.location, year);

    if (overrideValue !== null) {

      deaths = overrideValue;

    } else {

      // 2. 尝试读取 total_deaths
      const rawDeaths = Number(conf.total_deaths);

      if (!isNaN(rawDeaths) && rawDeaths > 0) {

        deaths = rawDeaths;

      } else {

        // 3. 最后的烈度兜底
        deaths = conf.intensity_level == 2 ? 3000 : 100;
      }
    }
  }
  return isNaN(deaths) ? 0 : deaths;
  return deaths;
};

const updateView = (year) => {
  if (!rawConflictData.length) return;

  if (year === 1945) {
    // --- 动态汇总模式 ---
    // 直接循环累加 1946-2024 所有冲突数据，保证与单年数据的计算规则完全一致
    const countrySummary = new Map();

    rawConflictData.forEach(conf => {
      const confYear = Number(conf.year);
      if (isNaN(confYear) || confYear < 1946 || confYear > 2024) return;

      const deaths = getConflictDeaths(conf, confYear);

      String(conf.location || "").split(',').forEach(loc => {
        const name = loc.trim();
        if (name) {
          countrySummary.set(name, (countrySummary.get(name) || 0) + deaths);
        }
      });
    });

    const mapData = Array.from(countrySummary).map(([name, value]) => ({ name, value }));
    renderMap(mapData, true);
  } else {
    // --- 单年热力模式 ---
    const yearly = rawConflictData.filter(c => c.year == year);
    const countryValues = new Map();

    yearly.forEach(conf => {
      const deaths = getConflictDeaths(conf, year);
      String(conf.location || "").split(',').forEach(loc => {
        const name = loc.trim();
        if (name) {
          countryValues.set(name, (countryValues.get(name) || 0) + deaths);
        }
      });
    });

    //const mapData = Array.from(countryValues).map(([name, value]) => ({ name, value }));
    const mapData = Array.from(countryValues)
    .filter(([_, value]) => !isNaN(value))
    .map(([name, value]) => ({ name, value }));
    renderMap(mapData, false);
  }
};

watch(currentYear, (val) => updateView(val));

onMounted(async () => {
  echarts.registerMap('world', worldGeoJSON);
  
  myChart = echarts.init(chartRef.value);

  const loadExcel = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`文件未找到: ${url}`);
    const ab = await res.arrayBuffer();
    const wb = XLSX.read(ab, { type: 'array' });
    return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  };

  try {
    // 不再加载 conflicts.xlsx 静态汇总表，减少请求开销
    const [prio, deaths] = await Promise.all([
      loadExcel('/data/UcdpPrioConflict_v25_1.xlsx'),
      loadExcel('/data/BattleDeaths_v25_1_conf.xlsx')
    ]);
    rawConflictData = prio;
    battleDeathData = deaths;
    loadingMsg.value = "";
    updateView(1945); // 加载完成后直接进入汇总
  } catch (err) {
    loadingMsg.value = "错误: " + err.message;
    console.error(err);
  }
});
</script>

<template>
  <div class="war-heatmap-box">
    <div v-if="loadingMsg" class="loading-overlay">{{ loadingMsg }}</div>
    <div ref="chartRef" class="map-canvas"></div>
    <div class="time-control-panel">
      <div class="year-num">{{ currentYear === 1945 ? '1946-2024 历史累计' : currentYear }}</div>
      <input type="range" v-model.number="currentYear" min="1945" max="2024" step="1" class="time-slider" />
      <div class="slider-labels">
        <span :class="{active: currentYear === 1945}">SUMMARY</span>
        <span>1946</span>
        <span>2024</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.war-heatmap-box { width: 100%; height: 85vh; position: relative; background-color: #FDFBF7; }
.map-canvas { width: 100%; height: 100%; }
.loading-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); z-index: 10; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
.time-control-panel { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); width: 70%; background: rgba(255,255,255,0.95); padding: 20px 40px; border-radius: 50px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; border: 1px solid #E2DFD7; }
.year-num { font-size: 32px; font-weight: 900; color: #731513; margin-bottom: 5px; }
.time-slider { width: 100%; height: 10px; cursor: pointer; accent-color: #731513; }
.slider-labels { display: flex; justify-content: space-between; margin-top: 5px; color: #7A7A77; font-size: 12px; }
.active { color: #731513; font-weight: bold; }
</style>