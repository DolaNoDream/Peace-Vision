<template>
  <div class="river-container">
    <div class="river-header">
      <h3>冲突时间河流图</h3>
      <div class="river-info">
        <span>点击时间点查看当年冲突数据</span>
      </div>
    </div>
    <div ref="riverChart" class="river-chart"></div>
    <div v-if="selectedYear" class="river-selected">
      <div class="selected-header">当前选择</div>
      <div class="selected-year">{{ selectedYear }}年</div>
      <div class="selected-count">{{ yearConflicts.length }} 场冲突</div>
      <button class="view-detail-btn" @click="handleViewDetail">
        🔍 查看桑基图
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  selectedYear: {
    type: Number,
    default: 0
  },
  allYears: {
    type: Array,
    default: () => []
  },
  dataManager: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['year-select', 'view-sankey']);

const riverChart = ref(null);
let chartInstance = null;

const yearConflicts = computed(() => {
  if (!props.selectedYear) return [];
  if (props.dataManager) {
    return props.dataManager.getConflictsByYear(props.selectedYear);
  }
  return props.data.filter(c => c.year === props.selectedYear);
});

const getYearStats = () => {
  const yearMap = {};
  
  if (props.dataManager && props.allYears.length > 0) {
    props.allYears.forEach(year => {
      const conflicts = props.dataManager.getConflictsByYear(year);
      const count = conflicts.length;
      const deaths = conflicts.reduce((sum, c) => sum + (Number(c.total_deaths) || 0), 0);
      yearMap[year] = { year, count, deaths };
    });
  } else {
    props.data.forEach(c => {
      if (!yearMap[c.year]) {
        yearMap[c.year] = { year: c.year, count: 0, deaths: 0 };
      }
      yearMap[c.year].count++;
      yearMap[c.year].deaths += c.total_deaths || 0;
    });
  }
  
  const result = Object.values(yearMap).sort((a, b) => a.year - b.year);
  return result;
};

const handleViewDetail = () => {
  const yearValue = Number(props.selectedYear);
  console.log('handleViewDetail called, year:', yearValue, 'type:', typeof yearValue);
  emit('view-sankey', {
    type: 'year',
    value: yearValue
  });
};

const initChart = () => {
  if (!riverChart.value) return;
  
  chartInstance = echarts.init(riverChart.value);
  
  chartInstance.on('click', (params) => {
    if (params.componentType === 'series' && params.seriesType === 'bar') {
      const yearValue = Number(params.name);
      console.log('Chart clicked, year:', yearValue, 'type:', typeof yearValue);
      emit('year-select', yearValue);
    }
  });

  window.addEventListener('resize', handleResize);
};

const updateChart = () => {
  if (!chartInstance) return;

  const yearStats = getYearStats();
  const years = yearStats.map(d => d.year);
  const counts = yearStats.map(d => d.count);
  const deaths = yearStats.map(d => d.deaths);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params) => {
        const year = params[0].name;
        const count = params[0].data;
        const death = params[1]?.data || 0;
        return `<div><b>${year}年</b></div>
                <div>冲突数量: ${count}场</div>
                <div>死亡人数: ${death.toLocaleString()}人</div>`;
      }
    },
    legend: {
      data: ['冲突数量', '死亡人数'],
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '60',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: years,
      axisLabel: {
        color: '#333'
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '冲突数量',
        position: 'left',
        axisLabel: {
          color: '#5470c6'
        },
        axisLine: {
          lineStyle: {
            color: '#5470c6'
          }
        }
      },
      {
        type: 'value',
        name: '死亡人数',
        position: 'right',
        axisLabel: {
          color: '#ee6666'
        },
        axisLine: {
          lineStyle: {
            color: '#ee6666'
          }
        }
      }
    ],
    series: [
      {
        name: '冲突数量',
        type: 'bar',
        data: counts.map((count, idx) => ({
          value: count,
          itemStyle: {
            color: years[idx] === props.selectedYear ? '#f4a460' : '#5470c6'
          }
        })),
        itemStyle: {
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '死亡人数',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: deaths,
        itemStyle: {
          color: '#ee6666'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(238, 102, 102, 0.3)' },
            { offset: 1, color: 'rgba(238, 102, 102, 0.05)' }
          ])
        }
      }
    ]
  };

  chartInstance.setOption(option, true);
};

const handleResize = () => {
  chartInstance?.resize();
};

watch(() => props.data, updateChart, { immediate: true, deep: true });
watch(() => props.selectedYear, updateChart);
watch(() => props.allYears, updateChart);

onMounted(() => {
  initChart();
  updateChart();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
});
</script>

<style scoped>
.river-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  box-sizing: border-box;
}

.river-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.river-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.river-info {
  font-size: 12px;
  color: #888;
}

.river-chart {
  flex: 1;
  width: 100%;
  min-height: 300px;
}

.river-selected {
  margin-top: 12px;
  padding: 12px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 8px;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.selected-header {
  font-size: 12px;
  opacity: 0.9;
}

.selected-year {
  font-size: 18px;
  font-weight: bold;
}

.selected-count {
  font-size: 12px;
  opacity: 0.9;
}

.view-detail-btn {
  margin-top: 12px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.view-detail-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
</style>