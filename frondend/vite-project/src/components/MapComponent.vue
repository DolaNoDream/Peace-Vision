<template>
  <div class="map-container">
    <div class="map-header">
      <h3>全球冲突热力图</h3>
      <div class="map-info">
        <span>点击下方国家卡片查看详细冲突数据</span>
      </div>
    </div>
    <div ref="mapChart" class="map-chart"></div>
    <div class="location-list">
      <div class="list-header">热门冲突地区 (点击选择)</div>
      <div class="list-items">
        <div
          v-for="(item, idx) in topLocations"
          :key="idx"
          :class="['location-card', { active: item.name === selectedLocation }]"
          @click="handleLocationClick(item.name)"
        >
          <div class="location-name">{{ item.name }}</div>
          <div class="location-count">{{ item.count }} 场</div>
        </div>
      </div>
    </div>
    <div v-if="selectedLocation" class="map-selected">
      <div class="selected-header">当前选择</div>
      <div class="selected-location">{{ selectedLocation }}</div>
      <div class="selected-count">{{ locationConflicts.length }} 场冲突</div>
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
  selectedLocation: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['location-select', 'view-sankey']);

const mapChart = ref(null);
let chartInstance = null;

const locationConflicts = computed(() => {
  if (!props.selectedLocation) return [];
  return props.data.filter(c => c.location === props.selectedLocation);
});

const getLocationCounts = () => {
  const counts = {};
  props.data.forEach(c => {
    if (!counts[c.location]) {
      counts[c.location] = { name: c.location, count: 0, deaths: 0 };
    }
    counts[c.location].count++;
    counts[c.location].deaths += c.total_deaths || 0;
  });
  return Object.values(counts).sort((a, b) => b.count - a.count);
};

const topLocations = computed(() => getLocationCounts().slice(0, 10));

const handleLocationClick = (name) => {
  emit('location-select', name);
};

const handleViewDetail = () => {
  emit('view-sankey', {
    type: 'location',
    value: props.selectedLocation,
    data: locationConflicts.value
  });
};

const initChart = () => {
  if (!mapChart.value) return;
  
  chartInstance = echarts.init(mapChart.value);

  window.addEventListener('resize', handleResize);
};

const updateChart = () => {
  if (!chartInstance) return;

  const locationData = getLocationCounts().slice(0, 15);
  const names = locationData.map(d => d.name);
  const counts = locationData.map(d => d.count);
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        color: '#888888'
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        color: '#888888',
        fontSize: 11
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      }
    },
    series: [
      {
        name: '冲突数量',
        type: 'bar',
        data: counts.map((count, idx) => ({
          value: count,
          itemStyle: {
            color: names[idx] === props.selectedLocation 
              ? new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                  { offset: 0, color: '#D8873F' },
                  { offset: 1, color: '#AE2B1E' }
                ])
              : new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                  { offset: 0, color: '#CF704A' },
                  { offset: 1, color: '#AA2F12' }
                ])
          }
        })),
        barWidth: '55%',
        label: {
          show: true,
          position: 'right',
          color: '#666666',
          fontSize: 11
        },
        itemStyle: {
          borderRadius: [0, 4, 4, 0]
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
watch(() => props.selectedLocation, updateChart);

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
.map-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #faf8f5;
  border-radius: 8px;
  padding: 16px;
  box-sizing: border-box;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.map-header h3 {
  margin: 0;
  font-size: 16px;
  color: #666666;
}

.map-info {
  font-size: 12px;
  color: #999999;
}

.map-chart {
  flex: 1;
  width: 100%;
  min-height: 220px;
}

.location-list {
  margin-top: 12px;
}

.list-header {
  font-size: 12px;
  color: #888888;
  margin-bottom: 8px;
  font-weight: 500;
}

.list-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.location-card {
  padding: 8px 12px;
  background: white;
  border: 2px solid #dddddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.location-card:hover {
  border-color: #D8873F;
  transform: translateY(-1px);
}

.location-card.active {
  border-color: #D8873F;
  background: linear-gradient(135deg, #D8873F 0%, #AE2B1E 100%);
}

.location-name {
  font-size: 13px;
  color: #666666;
}

.location-card.active .location-name,
.location-card.active .location-count {
  color: white;
}

.location-count {
  font-size: 11px;
  color: #888888;
  background: #f0f2f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.location-card.active .location-count {
  background: rgba(255, 255, 255, 0.2);
}

.map-selected {
  margin-top: 12px;
  padding: 12px;
  background: linear-gradient(135deg, #D8873F 0%, #AE2B1E 100%);
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

.selected-location {
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
  background: linear-gradient(135deg, #D8873F 0%, #AE2B1E 100%);
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
  box-shadow: 0 4px 12px rgba(245, 87, 108, 0.3);
}
</style>