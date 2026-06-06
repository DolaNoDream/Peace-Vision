<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import 'echarts-gl';
import * as XLSX from 'xlsx';
import worldGeoJSON from '../../assets/world.json';

const chartRef = ref(null);
const chartLineRef = ref(null);
const currentYear = ref(1945);
const loadingMsg = ref("正在加载战争数据表，请稍候...");
let myChart = null;
let lineChart = null;

const summaryViewMode = ref('3d');
const selectedCountry = ref(null);
const showSankeyDialog = ref(false);
const dialogCountry = ref('');
const sankeyContainer = ref(null);

// 死亡人数数据（UCDP）
let deathConflictData = [];
let battleDeathData = [];

// 战争次数数据（conflicts.xlsx）
let warCountData = [];

// ---------- 国家名称映射（适配官方 GeoJSON）----------
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
  'Central African Republic': 'Central African Republic',
  'Canada': 'Canada',
  'Switzerland': 'Switzerland',
  'Chile': 'Chile',
  'China': 'China',
  "Côte d'Ivoire": 'Ivory Coast',
  'Cameroon': 'Cameroon',
  'Democratic Republic of the Congo': 'DR Congo (Zaire)',
  'Congo': 'Congo',
  'Colombia': 'Colombia',
  'Costa Rica': 'Costa Rica',
  'Cuba': 'Cuba',
  'Comoros': 'Comoros',
  'Chad': 'Chad',
  'Cyprus': 'Cyprus',
  'Czech Republic': 'Czech Republic',
  'Germany': 'Germany',
  'Djibouti': 'Djibouti',
  'Dominican Republic': 'Dominican Republic',
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
  'Jamaica': 'Jamaica',
  'Jordan': 'Jordan',
  'Japan': 'Japan',
  'Kazakhstan': 'Kazakhstan',
  'Kenya': 'Kenya',
  'Kyrgyzstan': 'Kyrgyzstan',
  'South Korea': 'South Korea',
  'Kuwait': 'Kuwait',
  'Laos': 'Laos',
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
  'North Korea': 'North Korea',
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

// ---------- 国家经纬度中心点 ----------
const countryCentroids = {
  'Afghanistan': [66.0047, 33.9391],
  'Angola': [17.8739, -11.2027],
  'Albania': [20.1683, 41.1533],
  'United Arab Emirates': [54.0, 24.0],
  'Argentina': [-63.6167, -38.4161],
  'Armenia': [45.0, 40.0],
  'Australia': [133.7751, -25.2744],
  'Austria': [14.5501, 47.5162],
  'Azerbaijan': [47.5769, 40.1431],
  'Burundi': [29.9189, -3.3731],
  'Belgium': [4.4699, 50.5039],
  'Benin': [2.3158, 9.3077],
  'Burkina Faso': [-1.5616, 12.2383],
  'Bangladesh': [90.3563, 23.6850],
  'Bulgaria': [25.4858, 42.7339],
  'Bosnia and Herz.': [17.6791, 44.1688],
  'Bolivia': [-63.5887, -16.2902],
  'Brazil': [-51.9253, -14.2350],
  'Brunei': [114.7277, 4.5353],
  'Botswana': [24.6849, -22.3285],
  'Cambodia': [104.9903, 12.5657],
  'Central African Republic': [20.9394, 6.6111],
  'Canada': [-106.3468, 56.1304],
  'Switzerland': [8.2275, 46.8182],
  'Chile': [-71.5429, -35.6751],
  'China': [104.1954, 35.8617],
  "Côte d'Ivoire": [-5.5471, 7.5399],
  'Cameroon': [12.3547, 7.3697],
  'Democratic Republic of the Congo': [21.7587, -4.0383],
  'Congo': [15.8277, -0.2280],
  'Colombia': [-74.2973, 4.5709],
  'Costa Rica': [-84.2659, 9.7489],
  'Cuba': [-77.7812, 21.5218],
  'Comoros': [43.255, -11.6455],
  'Chad': [18.7322, 15.4542],
  'Cyprus': [33.4299, 35.1264],
  'Czech Republic': [15.4725, 49.8175],
  'Germany': [10.4515, 51.1657],
  'Djibouti': [42.5903, 11.8251],
  'Dominican Republic': [-70.6667, 18.7357],
  'Algeria': [1.6596, 28.0339],
  'Ecuador': [-78.1834, -1.8312],
  'Egypt': [30.8025, 26.8206],
  'Eritrea': [39.7823, 15.1794],
  'El Salvador': [-88.8965, 13.7942],
  'Spain': [-3.7492, 40.4637],
  'Estonia': [25.0136, 58.5953],
  'Ethiopia': [40.4897, 9.1450],
  'Finland': [25.7482, 61.9241],
  'France': [2.2137, 46.6034],
  'Gabon': [11.6094, -0.8037],
  'Georgia': [43.3569, 42.3154],
  'Ghana': [-1.0232, 7.9465],
  'Guinea': [-9.6966, 9.9456],
  'Gambia': [-15.3101, 13.4432],
  'Guinea-Bissau': [-15.1804, 11.8037],
  'Greece': [21.8243, 39.0742],
  'Guatemala': [-90.2308, 15.7835],
  'Grenada': [-61.679, 12.1165],
  'Honduras': [-86.2419, 14.7418],
  'Croatia': [15.2000, 45.1000],
  'Haiti': [-72.2852, 18.9712],
  'Hungary': [19.5033, 47.1625],
  'Indonesia': [113.9213, -0.7893],
  'India': [78.9629, 20.5937],
  'Ireland': [-8.2439, 53.4129],
  'Iran': [53.6880, 32.4279],
  'Iraq': [43.6793, 33.2232],
  'Israel': [34.8516, 31.0461],
  'Italy': [12.5674, 41.8719],
  'Jamaica': [-77.2975, 18.1096],
  'Jordan': [36.2384, 30.5852],
  'Japan': [138.2529, 36.2048],
  'Kazakhstan': [66.9237, 48.0196],
  'Kenya': [37.9062, -0.0236],
  'Kyrgyzstan': [74.7661, 41.2044],
  'South Korea': [127.7669, 35.9078],
  'Kuwait': [47.4818, 29.3117],
  'Laos': [102.4955, 19.8563],
  'Lebanon': [35.8623, 33.8547],
  'Liberia': [-9.4295, 6.4281],
  'Libya': [17.2289, 26.3351],
  'Lesotho': [28.2336, -29.6099],
  'Lithuania': [23.8813, 55.1694],
  'Latvia': [24.6032, 56.8796],
  'Morocco': [-7.0926, 31.7917],
  'Moldova': [28.3699, 47.4116],
  'Madagascar': [46.8693, -18.7669],
  'Malaysia': [101.9758, 4.2105],
  'Mexico': [-102.5528, 23.6345],
  'North Macedonia': [21.7453, 41.6086],
  'Mali': [-3.9962, 17.5707],
  'Myanmar': [95.9562, 21.9162],
  'Montenegro': [19.3744, 42.7087],
  'Mongolia': [103.8467, 46.8625],
  'Mozambique': [35.5296, -18.6657],
  'Mauritania': [-10.9408, 21.0079],
  'Namibia': [18.4904, -22.9576],
  'Niger': [8.0817, 17.6078],
  'Nigeria': [8.6753, 9.0820],
  'Nicaragua': [-85.2072, 12.8654],
  'Netherlands': [5.2913, 52.1326],
  'Norway': [8.4689, 60.4720],
  'Nepal': [84.1240, 28.3949],
  'New Zealand': [172.1300, -40.9006],
  'Oman': [55.9233, 21.4735],
  'Pakistan': [69.3451, 30.3753],
  'Panama': [-80.7821, 8.5380],
  'Peru': [-75.0152, -9.1900],
  'Philippines': [121.7740, 12.8797],
  'Papua New Guinea': [143.9555, -6.3150],
  'Poland': [19.1451, 51.9194],
  'North Korea': [127.5101, 40.3399],
  'Portugal': [-8.2245, 39.3999],
  'Paraguay': [-58.4438, -23.4425],
  'Qatar': [51.1839, 25.3548],
  'Romania': [24.9668, 45.9432],
  'Russia': [105.3188, 61.5240],
  'Rwanda': [29.8739, -1.9403],
  'Saudi Arabia': [45.0792, 23.8859],
  'Sudan': [30.2176, 12.8628],
  'South Sudan': [29.4428, 6.8770],
  'Senegal': [-14.4524, 14.4974],
  'Sierra Leone': [-11.7799, 8.4606],
  'Serbia': [21.0059, 44.0165],
  'Suriname': [-56.0275, 4.0887],
  'Slovakia': [19.6990, 48.6690],
  'Slovenia': [14.9955, 46.1512],
  'Somalia': [46.1996, 5.1521],
  'Sweden': [18.6435, 60.1282],
  'Syria': [38.9968, 34.8021],
  'South Africa': [24.9916, -30.5595],
  'Sri Lanka': [80.7718, 7.8731],
  'Togo': [0.8248, 8.6195],
  'Thailand': [100.9925, 15.8700],
  'Tajikistan': [71.2761, 38.8610],
  'Turkmenistan': [59.5563, 38.9697],
  'Trinidad and Tobago': [-61.2225, 10.6918],
  'Tunisia': [9.5375, 33.8869],
  'Turkey': [35.2433, 38.9637],
  'Taiwan': [120.9605, 23.6978],
  'Tanzania': [34.8888, -6.3690],
  'Uganda': [32.2903, 1.3733],
  'Ukraine': [31.1656, 48.3794],
  'Uruguay': [-56.1645, -32.5228],
  'United Kingdom': [-3.4360, 55.3781],
  'United States of America': [-95.7129, 37.0902],
  'Uzbekistan': [64.5853, 41.3775],
  'Venezuela': [-66.5897, 6.4238],
  'Vietnam': [108.2772, 14.0583],
  'Yemen': [48.5164, 15.5527],
  'Zambia': [27.8493, -13.1339],
  'Zimbabwe': [29.1549, -19.0154]
};

const getCentroid = (countryName) => {
  if (countryCentroids[countryName]) return countryCentroids[countryName];
  const variants = {
    'Russia (Soviet Union)': 'Russia',
    'DR Congo (Zaire)': 'Democratic Republic of the Congo',
    'Ivory Coast': "Côte d'Ivoire",
    'Zimbabwe (Rhodesia)': 'Zimbabwe',
    'Myanmar (Burma)': 'Myanmar',
    'Laos': 'Laos',
    'Cambodia (Kampuchea)': 'Cambodia',
    'Vietnam (North Vietnam)': 'Vietnam',
    'Central African Republic': 'Central African Republic',
    'South Sudan': 'South Sudan',
    'Democratic Republic of the Congo': 'Democratic Republic of the Congo',
    'Congo': 'Congo'
  };
  if (variants[countryName]) {
    const std = variants[countryName];
    if (countryCentroids[std]) return countryCentroids[std];
  }
  for (const [stdName, dataName] of Object.entries(nameMap)) {
    if (dataName === countryName) return countryCentroids[stdName];
  }
  console.warn(`未找到国家坐标: ${countryName}`);
  return [0, 0];
};

// ==================== 死亡人数历史战争修正 ====================
const getHistoricalOverride = (location, year) => {
  const locStr = String(location || "");
  if (locStr.includes("Korea") && year >= 1950 && year <= 1953) return 180000;
  if (locStr.includes("Vietnam") && year >= 1960 && year <= 1975) return 80000;
  if (locStr.includes("China") && year >= 1946 && year <= 1949) return 150000;
  if ((locStr.includes("Iran") || locStr.includes("Iraq")) && year >= 1980 && year <= 1988) return 60000;
  if (locStr.includes("Nigeria") && year >= 1967 && year <= 1970) return 80000;
  if (locStr.includes("Afghanistan") && year >= 1979 && year <= 1988) return 15000;
  return null;
};

const getConflictDeaths = (conf, year) => {
  let deaths = 0;
  if (year >= 1989) {
    const dMatch = battleDeathData.find(d => d.conflict_id == conf.conflict_id && d.year == year);
    deaths = dMatch ? (Number(dMatch.bd_best) || 0) : 0;
  } else {
    const overrideValue = getHistoricalOverride(conf.location, year);
    if (overrideValue !== null) {
      deaths = overrideValue;
    } else {
      const rawDeaths = Number(conf.total_deaths);
      if (!isNaN(rawDeaths) && rawDeaths > 0) {
        deaths = rawDeaths;
      } else {
        deaths = conf.intensity_level == 2 ? 3000 : 100;
      }
    }
  }
  return isNaN(deaths) ? 0 : deaths;
};

// ==================== 统一国家名称（精确映射） ====================
const aliasToStandard = {
  'Afghanistan': 'Afghanistan',
  'Albania': 'Albania',
  'Algeria': 'Algeria',
  'Angola': 'Angola',
  'Argentina': 'Argentina',
  'Armenia': 'Armenia',
  'Australia': 'Australia',
  'Austria': 'Austria',
  'Azerbaijan': 'Azerbaijan',
  'Bangladesh': 'Bangladesh',
  'Belgium': 'Belgium',
  'Benin': 'Benin',
  'Bolivia': 'Bolivia',
  'Bosnia-Herzegovina': 'Bosnia-Herzegovina',
  'Botswana': 'Botswana',
  'Brazil': 'Brazil',
  'Brunei': 'Brunei',
  'Bulgaria': 'Bulgaria',
  'Burkina Faso': 'Burkina Faso',
  'Burundi': 'Burundi',
  'Cambodia': 'Cambodia (Kampuchea)',
  'Cambodia (Kampuchea)': 'Cambodia (Kampuchea)',
  'Cameroon': 'Cameroon',
  'Canada': 'Canada',
  'Central African Republic': 'Central African Republic',
  'Central African Rep.': 'Central African Republic',
  'Chad': 'Chad',
  'Chile': 'Chile',
  'China': 'China',
  'Colombia': 'Colombia',
  'Comoros': 'Comoros',
  'Congo': 'Congo',
  'Costa Rica': 'Costa Rica',
  'Croatia': 'Croatia',
  'Cuba': 'Cuba',
  'Cyprus': 'Cyprus',
  'Czech Republic': 'Czech Republic',
  'Czech Rep.': 'Czech Republic',
  'DR Congo (Zaire)': 'DR Congo (Zaire)',
  'Democratic Republic of the Congo': 'DR Congo (Zaire)',
  'Dem. Rep. Congo': 'DR Congo (Zaire)',
  'Djibouti': 'Djibouti',
  'Dominican Republic': 'Dominican Republic',
  'Dominican Rep.': 'Dominican Republic',
  'Ecuador': 'Ecuador',
  'Egypt': 'Egypt',
  'El Salvador': 'El Salvador',
  'Eritrea': 'Eritrea',
  'Estonia': 'Estonia',
  'Ethiopia': 'Ethiopia',
  'Finland': 'Finland',
  'France': 'France',
  'Gabon': 'Gabon',
  'Gambia': 'Gambia',
  'Georgia': 'Georgia',
  'Germany': 'Germany',
  'Ghana': 'Ghana',
  'Greece': 'Greece',
  'Grenada': 'Grenada',
  'Guatemala': 'Guatemala',
  'Guinea': 'Guinea',
  'Guinea-Bissau': 'Guinea-Bissau',
  'Haiti': 'Haiti',
  'Honduras': 'Honduras',
  'Hungary': 'Hungary',
  'India': 'India',
  'Indonesia': 'Indonesia',
  'Iran': 'Iran',
  'Iraq': 'Iraq',
  'Ireland': 'Ireland',
  'Israel': 'Israel',
  'Italy': 'Italy',
  'Ivory Coast': 'Ivory Coast',
  "Côte d'Ivoire": 'Ivory Coast',
  'Jamaica': 'Jamaica',
  'Japan': 'Japan',
  'Jordan': 'Jordan',
  'Kazakhstan': 'Kazakhstan',
  'Kenya': 'Kenya',
  'Kuwait': 'Kuwait',
  'Kyrgyzstan': 'Kyrgyzstan',
  'Laos': 'Laos',
  'Lao PDR': 'Laos',
  'Latvia': 'Latvia',
  'Lebanon': 'Lebanon',
  'Lesotho': 'Lesotho',
  'Liberia': 'Liberia',
  'Libya': 'Libya',
  'Lithuania': 'Lithuania',
  'Madagascar': 'Madagascar (Malagasy)',
  'Madagascar (Malagasy)': 'Madagascar (Malagasy)',
  'Malaysia': 'Malaysia',
  'Mali': 'Mali',
  'Mauritania': 'Mauritania',
  'Mexico': 'Mexico',
  'Moldova': 'Moldova',
  'Mongolia': 'Mongolia',
  'Montenegro': 'Montenegro',
  'Morocco': 'Morocco',
  'Mozambique': 'Mozambique',
  'Myanmar': 'Myanmar (Burma)',
  'Myanmar (Burma)': 'Myanmar (Burma)',
  'Namibia': 'Namibia',
  'Nepal': 'Nepal',
  'Netherlands': 'Netherlands',
  'New Zealand': 'New Zealand',
  'Nicaragua': 'Nicaragua',
  'Niger': 'Niger',
  'Nigeria': 'Nigeria',
  'North Korea': 'North Korea',
  'Dem. Rep. Korea': 'North Korea',
  'North Macedonia': 'North Macedonia',
  'Norway': 'Norway',
  'Oman': 'Oman',
  'Pakistan': 'Pakistan',
  'Panama': 'Panama',
  'Papua New Guinea': 'Papua New Guinea',
  'Paraguay': 'Paraguay',
  'Peru': 'Peru',
  'Philippines': 'Philippines',
  'Poland': 'Poland',
  'Portugal': 'Portugal',
  'Qatar': 'Qatar',
  'Romania': 'Romania',
  'Russia': 'Russia (Soviet Union)',
  'Russian Federation': 'Russia (Soviet Union)',
  'Russia (Soviet Union)': 'Russia (Soviet Union)',
  'Rwanda': 'Rwanda',
  'Saudi Arabia': 'Saudi Arabia',
  'Senegal': 'Senegal',
  'Serbia': 'Serbia (Yugoslavia)',
  'Serbia (Yugoslavia)': 'Serbia (Yugoslavia)',
  'Sierra Leone': 'Sierra Leone',
  'Slovakia': 'Slovakia',
  'Slovenia': 'Slovenia',
  'Somalia': 'Somalia',
  'South Africa': 'South Africa',
  'South Korea': 'South Korea',
  'Korea': 'South Korea',
  'South Sudan': 'South Sudan',
  'S. Sudan': 'South Sudan',
  'Spain': 'Spain',
  'Sri Lanka': 'Sri Lanka',
  'Sudan': 'Sudan',
  'Suriname': 'Suriname',
  'Sweden': 'Sweden',
  'Switzerland': 'Switzerland',
  'Syria': 'Syria',
  'Taiwan': 'Taiwan',
  'Tajikistan': 'Tajikistan',
  'Tanzania': 'Tanzania',
  'United Republic of Tanzania': 'Tanzania',
  'Thailand': 'Thailand',
  'Togo': 'Togo',
  'Trinidad and Tobago': 'Trinidad and Tobago',
  'Tunisia': 'Tunisia',
  'Turkey': 'Turkey',
  'Turkmenistan': 'Turkmenistan',
  'Uganda': 'Uganda',
  'Ukraine': 'Ukraine',
  'United Arab Emirates': 'United Arab Emirates',
  'United Kingdom': 'United Kingdom',
  'United States of America': 'United States of America',
  'Uruguay': 'Uruguay',
  'Uzbekistan': 'Uzbekistan',
  'Venezuela': 'Venezuela',
  'Vietnam': 'Vietnam (North Vietnam)',
  'Vietnam (North Vietnam)': 'Vietnam (North Vietnam)',
  'Vietnam (South Vietnam)': 'Vietnam (North Vietnam)',
  'Yemen': 'Yemen (North Yemen)',
  'Yemen (North Yemen)': 'Yemen (North Yemen)',
  'Yemen (South Yemen)': 'Yemen (North Yemen)',
  'Zambia': 'Zambia',
  'Zimbabwe': 'Zimbabwe (Rhodesia)',
  'Zimbabwe (Rhodesia)': 'Zimbabwe (Rhodesia)',
};

const normalizeDeathCountryNames = () => {
  deathConflictData.forEach(conf => {
    if (!conf.location) return;
    const parts = String(conf.location).split(',');
    const normalized = parts.map(p => {
      const trimmed = p.trim();
      return aliasToStandard[trimmed] || trimmed;
    });
    conf.location = normalized.join(',');
  });
};

const normalizeWarCountCountryNames = () => {
  warCountData.forEach(conf => {
    if (!conf.location) return;
    const parts = String(conf.location).split(',');
    const normalized = parts.map(p => {
      const trimmed = p.trim();
      return aliasToStandard[trimmed] || trimmed;
    });
    conf.location = normalized.join(',');
  });
};

// ==================== 折线图数据（基于死亡数据） ====================
const getCountryYearlyDeaths = (countryName) => {
  if (countryName === 'United States of America') {
    const result = [];
    for (let y = 1946; y <= 2024; y++) {
      result.push({ year: y, deaths: 0 });
    }
    return result;
  }

  const yearlyMap = new Map();
  for (let y = 1946; y <= 2024; y++) yearlyMap.set(y, 0);
  deathConflictData.forEach(conf => {
    const confYear = Number(conf.year);
    if (isNaN(confYear) || confYear < 1946 || confYear > 2024) return;
    const locations = String(conf.location || "").split(',');
    if (locations.some(loc => loc.trim() === countryName)) {
      const deaths = getConflictDeaths(conf, confYear);
      yearlyMap.set(confYear, (yearlyMap.get(confYear) || 0) + deaths);
    }
  });
  const result = [];
  for (let y = 1946; y <= 2024; y++) {
    result.push({ year: y, deaths: yearlyMap.get(y) || 0 });
  }
  return result;
};

const renderLineChart = async (countryName) => {
  await nextTick();
  if (!chartLineRef.value) return;
  if (lineChart && lineChart.getDom() && lineChart.getDom() !== chartLineRef.value) {
    lineChart.dispose();
    lineChart = null;
  }
  if (!lineChart) lineChart = echarts.init(chartLineRef.value);
  const yearlyData = getCountryYearlyDeaths(countryName);
  const years = yearlyData.map(d => d.year);
  const deaths = yearlyData.map(d => d.deaths);
  lineChart.setOption({
    title: { text: `${countryName} 战争死亡人数趋势 (1946-2024)`, left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis', valueFormatter: (value) => value?.toLocaleString() + ' 人' },
    xAxis: { type: 'category', data: years, name: '年份', axisLabel: { rotate: 45 } },
    yAxis: { type: 'value', name: '死亡人数', axisLabel: { formatter: (val) => val.toLocaleString() } },
    series: [{ data: deaths, type: 'line', smooth: false, lineStyle: { color: '#731513', width: 2 }, areaStyle: { opacity: 0.1, color: '#BD2E1F' }, symbol: 'circle', symbolSize: 4, itemStyle: { color: '#731513' } }],
    grid: { containLabel: true, bottom: 30, top: 50, left: 60, right: 30 }
  });
};

const clearLineChart = () => {
  if (lineChart) {
    lineChart.dispose();
    lineChart = null;
  }
  selectedCountry.value = null;
};

const openSankeyDialog = async (countryName, year = null) => {
  dialogCountry.value = countryName;
  showSankeyDialog.value = true;
  await nextTick();
  if (sankeyContainer.value) {
    sankeyContainer.value.innerHTML = '';
    const placeholder = document.createElement('div');
    placeholder.style.cssText = 'display: flex; justify-content: center; align-items: center; height: 100%; color: #999; font-size: 16px;';
    placeholder.textContent = '桑基图正在开发中，敬请期待...';
    sankeyContainer.value.appendChild(placeholder);
    const event = new CustomEvent('sankey-render-request', {
      detail: { country: countryName, year: year, container: sankeyContainer.value }
    });
    window.dispatchEvent(event);
  }
};

const closeSankeyDialog = () => {
  showSankeyDialog.value = false;
  dialogCountry.value = '';
};

// ==================== 2D 热力图渲染（基于死亡数据） ====================
const renderMap = (mapData, isSummary = false) => {
  if (!myChart) return;
  const option = {
    backgroundColor: '#FDFBF7',
    title: {
      text: isSummary ? '1946-2024 全球战争死亡数据汇总 (累计死亡人数)' : `全球战争伤亡演变 (${currentYear.value}年)`,
      subtext: isSummary ? '点击国家显示年度死亡趋势及详细桑基图' : '点击国家显示该年桑基图',
      left: 'center', top: 20,
      textStyle: { color: '#2C2B28', fontSize: 24, fontWeight: 'bold' }
    },
    tooltip: { trigger: 'item', formatter: (params) => { const val = Number(params.data?.value) || 0; return `<b>${params.name}</b><br/>${isSummary ? '历史累计死亡' : '当年估计死亡'}: ${Math.round(val).toLocaleString()} 人`; } },
    visualMap: {
      type: 'piecewise', left: '5%', bottom: '15%',
      pieces: isSummary ? [
        { min: 500000, label: '>50万', color: '#4E0E0C' },
        { min: 100000, max: 499999, label: '10万-49.9万', color: '#731513' },
        { min: 10000, max: 99999, label: '1万-9.9万', color: '#96281B' },
        { min: 1000, max: 9999, label: '1千-9.9千', color: '#BD2E1F' },
        { min: 1, max: 999, label: '1-999', color: '#F8B87A' },
        { value: 0, label: '和平/无数据', color: '#ECE8E3' }
      ] : [
        { min: 10000, label: '>1万', color: '#731513' },
        { min: 1000, max: 9999, label: '1千-9.9千', color: '#96281B' },
        { min: 500, max: 999, label: '500-999', color: '#BD2E1F' },
        { min: 100, max: 499, label: '100-499', color: '#E66B22' },
        { min: 1, max: 99, label: '1-99', color: '#F8B87A' },
        { value: 0, label: '和平', color: '#ECE8E3' }
      ],
      outOfRange: { color: '#ECE8E3' }
    },
    series: [{ type: 'map', map: 'world', roam: true, nameMap: nameMap, itemStyle: { areaColor: '#ECE8E3', borderColor: '#D1CDC3' }, emphasis: { itemStyle: { areaColor: '#E1BC85' } }, data: mapData }]
  };
  myChart.setOption(option, true);
  
  if (myChart && !(currentYear.value === 1945 && summaryViewMode.value === '3d')) {
    myChart.off('click');
    myChart.on('click', async (params) => {
      if (params.componentType === 'series' && params.seriesType === 'map') {
        const country = params.name;
        if (country) {
          if (currentYear.value === 1945) {
            selectedCountry.value = country;
            await nextTick();
            await renderLineChart(country);
            await openSankeyDialog(country, null);
          } else {
            await openSankeyDialog(country, currentYear.value);
          }
        }
      }
    });
  } else {
    if (myChart) myChart.off('click');
    clearLineChart();
    closeSankeyDialog();
  }
};

// ==================== 3D 柱状图渲染（使用 warCountData） ====================
const render3DSummaryMap = (countryWarCounts) => {
  if (!myChart) return;
  if (myChart) myChart.off('click');
  clearLineChart();
  closeSankeyDialog();
  
  const barData = [];
  for (const [countryName, warCount] of countryWarCounts.entries()) {
    if (!warCount || warCount <= 0) continue;
    const centroid = getCentroid(countryName);
    if (centroid[0] === 0 && centroid[1] === 0) continue;
    const height = Math.log(warCount + 1) * 1.5;
    barData.push({ name: countryName, value: [centroid[0], centroid[1], height], warCount });
  }
  const option = {
    backgroundColor: '#FDFBF7',
    title: { text: '1946-2024 全球战争总数统计 (3D柱状图)', subtext: '柱体高度代表战争场次数（对数缩放） | 鼠标左键旋转，右键拖拽平移', left: 'center', top: 20, textStyle: { color: '#2C2B28', fontSize: 24, fontWeight: 'bold' } },
    tooltip: { trigger: 'item', formatter: (params) => { if (params.componentType === 'series' && params.seriesType === 'bar3D') { const data = params.data; return `<b>${data.name}</b><br/>战争总数: ${data.warCount.toLocaleString()} 场`; } return params.name; } },
    geo3D: {
      map: 'world',
      roam: true,
      boxWidth: 150,
      boxHeight: 30,
      regionHeight: 1,
      environment: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#FDFBF7' }, { offset: 1, color: '#E8E4DF' }], false),
      itemStyle: { areaColor: '#D1CDC3', borderColor: '#B8B4AC', borderWidth: 0.5 },
      label: { show: false },
      emphasis: { label: { show: false }, itemStyle: { areaColor: '#C2BDAE' } },
      viewControl: {
        alpha: 45,
        beta: 0,
        distance: 180,
        autoRotate: false,
        animation: true,
        pan: { enabled: true },
        zoom: { enabled: true },
        rotate: { enabled: true }
      }
    },
    series: [{ type: 'bar3D', coordinateSystem: 'geo3D', data: barData, barSize: 0.8, minHeight: 0.3, shading: 'realistic', label: { show: true, formatter: (params) => params.data.name, position: 'top', distance: 5, textStyle: { fontSize: 10, color: '#333', backgroundColor: 'rgba(255,255,255,0.7)', padding: [2,4,2,4], borderRadius: 4 } }, itemStyle: { color: (params) => { const c = params.data.warCount; if (c > 500) return '#731513'; if (c > 100) return '#BD2E1F'; if (c > 30) return '#E66B22'; if (c > 5) return '#F8B87A'; return '#C9B99A'; }, borderWidth: 0, opacity: 0.92 } }]
  };
  myChart.setOption(option, true);
};

// ==================== 视图更新入口 ====================
const updateView = (year) => {
  if (!deathConflictData.length) return;
  
  if (year === 1945) {
    const countrySummaryDeaths = new Map();
    deathConflictData.forEach(conf => {
      const confYear = Number(conf.year);
      if (isNaN(confYear) || confYear < 1946 || confYear > 2024) return;
      const deaths = getConflictDeaths(conf, confYear);
      const locations = String(conf.location || "").split(',');
      locations.forEach(loc => { const name = loc.trim(); if (name) { countrySummaryDeaths.set(name, (countrySummaryDeaths.get(name) || 0) + deaths); } });
    });
    countrySummaryDeaths.set('United States of America', 0);
    
    let countrySummaryWarCounts = new Map();
    if (warCountData.length) {
      warCountData.forEach(conf => {
        const confYear = Number(conf.year);
        if (isNaN(confYear) || confYear < 1946 || confYear > 2024) return;
        const locations = String(conf.location || "").split(',');
        locations.forEach(loc => { const name = loc.trim(); if (name) { countrySummaryWarCounts.set(name, (countrySummaryWarCounts.get(name) || 0) + 1); } });
      });
    }
    
    if (summaryViewMode.value === '3d') {
      render3DSummaryMap(countrySummaryWarCounts);
    } else {
      const mapData = Array.from(countrySummaryDeaths).filter(([_, v]) => !isNaN(v)).map(([n, v]) => ({ name: n, value: v }));
      renderMap(mapData, true);
      // 不再自动恢复折线图，selectedCountry 已经为 null（从 else 分支回来时清空了）
    }
  } else {
    // 离开 Summary 时，销毁折线图并清空选中状态
    if (lineChart) {
      lineChart.dispose();
      lineChart = null;
    }
    selectedCountry.value = null;  // 关键修改：清空选中，回到 Summary 后不显示折线图
    
    const yearly = deathConflictData.filter(c => c.year == year);
    const countryValues = new Map();
    yearly.forEach(conf => {
      const deaths = getConflictDeaths(conf, year);
      String(conf.location || "").split(',').forEach(loc => { const name = loc.trim(); if (name) countryValues.set(name, (countryValues.get(name) || 0) + deaths); });
    });
    countryValues.set('United States of America', 0);
    const mapData = Array.from(countryValues).filter(([_, v]) => !isNaN(v)).map(([n, v]) => ({ name: n, value: v }));
    renderMap(mapData, false);
  }
};

watch(currentYear, (val) => updateView(val));
watch(summaryViewMode, () => {
  if (currentYear.value === 1945) {
    updateView(1945);
  } else {
    clearLineChart();
    closeSankeyDialog();
  }
});

onMounted(async () => {
  echarts.registerMap('world', worldGeoJSON);
  myChart = echarts.init(chartRef.value);
  const loadExcel = async (url) => { const res = await fetch(url); if (!res.ok) throw new Error(`文件未找到: ${url}`); const ab = await res.arrayBuffer(); const wb = XLSX.read(ab, { type: 'array' }); return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]); };
  try {
    const [prio, deaths] = await Promise.all([
      loadExcel('/data/UcdpPrioConflict_v25_1.xlsx'),
      loadExcel('/data/BattleDeaths_v25_1_conf.xlsx')
    ]);
    deathConflictData = prio;
    battleDeathData = deaths;
    normalizeDeathCountryNames();
    
    try {
      const warCountRaw = await loadExcel('/data/conflicts.xlsx');
      warCountData = warCountRaw;
      normalizeWarCountCountryNames();
    } catch (err) {
      console.warn('加载 conflicts.xlsx 失败，3D 柱状图将无法显示战争次数', err);
    }
    
    loadingMsg.value = "";
    updateView(1945);
  } catch (err) {
    loadingMsg.value = "错误: " + err.message;
    console.error(err);
  }
});
</script>

<template>
  <div class="war-heatmap-container">
    <div class="war-heatmap-box">
      <div v-if="loadingMsg" class="loading-overlay">{{ loadingMsg }}</div>
      <div ref="chartRef" class="map-canvas"></div>
      
      <div v-if="!(currentYear === 1945 && summaryViewMode === '3d')" class="time-control-panel">
        <div class="year-num">{{ currentYear === 1945 ? '1946-2024 历史累计' : currentYear }}</div>
        <input type="range" v-model.number="currentYear" min="1945" max="2024" step="1" class="time-slider" />
        <div class="slider-labels">
          <span :class="{active: currentYear === 1945}">SUMMARY</span>
          <span>1946</span>
          <span>2024</span>
        </div>
      </div>
      
      <div v-if="currentYear === 1945" class="view-toggle">
        <button :class="{ active: summaryViewMode === '3d' }" @click="summaryViewMode = '3d'">3D 柱状图</button>
        <button :class="{ active: summaryViewMode === '2d' }" @click="summaryViewMode = '2d'">2D 热力图</button>
      </div>
    </div>
    <div v-if="currentYear === 1945 && summaryViewMode === '2d' && selectedCountry" class="line-chart-container">
      <div ref="chartLineRef" class="line-chart"></div>
    </div>
    <Teleport to="body">
      <div v-if="showSankeyDialog" class="sankey-dialog-overlay" @click.self="closeSankeyDialog">
        <div class="sankey-dialog">
          <div class="sankey-dialog-header">
            <span>{{ dialogCountry }} - 冲突流向桑基图</span>
            <button class="sankey-dialog-close" @click="closeSankeyDialog">×</button>
          </div>
          <div class="sankey-dialog-body">
            <div ref="sankeyContainer" class="sankey-container"></div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.war-heatmap-container { width: 100%; display: flex; flex-direction: column; background-color: #FDFBF7; }
.war-heatmap-box { width: 100%; height: 70vh; position: relative; background-color: #FDFBF7; }
.map-canvas { width: 100%; height: 100%; }
.loading-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); z-index: 10; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
.time-control-panel { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); width: 70%; background: rgba(255,255,255,0.95); padding: 20px 40px; border-radius: 50px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; border: 1px solid #E2DFD7; }
.year-num { font-size: 32px; font-weight: 900; color: #731513; margin-bottom: 5px; }
.time-slider { width: 100%; height: 10px; cursor: pointer; accent-color: #731513; }
.slider-labels { display: flex; justify-content: space-between; margin-top: 5px; color: #7A7A77; font-size: 12px; }
.active { color: #731513; font-weight: bold; }
.view-toggle { position: absolute; top: 20px; right: 20px; z-index: 20; display: flex; gap: 8px; background: rgba(255,255,255,0.9); padding: 4px 8px; border-radius: 32px; backdrop-filter: blur(4px); box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
.view-toggle button { padding: 4px 12px; border: none; border-radius: 24px; cursor: pointer; font-size: 12px; font-weight: 500; background-color: #ECE8E3; color: #4a4a47; transition: all 0.2s ease; }
.view-toggle button.active { background-color: #731513; color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
.view-toggle button:hover:not(.active) { background-color: #D1CDC3; }
.line-chart-container { width: 100%; height: 30vh; padding: 20px; background: #FDFBF7; border-top: 1px solid #E2DFD7; box-sizing: border-box; }
.line-chart { width: 100%; height: 100%; }
.sankey-dialog-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.sankey-dialog { background: white; border-radius: 12px; width: 80%; max-width: 1200px; height: 70%; box-shadow: 0 10px 30px rgba(0,0,0,0.2); display: flex; flex-direction: column; overflow: hidden; }
.sankey-dialog-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: #731513; color: white; font-weight: bold; font-size: 18px; }
.sankey-dialog-close { background: none; border: none; color: white; font-size: 28px; cursor: pointer; line-height: 1; }
.sankey-dialog-body { flex: 1; padding: 16px; overflow: auto; }
.sankey-container { width: 100%; height: 100%; min-height: 400px; }
</style>
