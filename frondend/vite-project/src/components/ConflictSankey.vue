<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="handleClose">
      <div 
        class="sankey-modal" 
        :style="modalStyle"
        ref="modalRef"
      >
        <div 
          class="modal-header" 
          @mousedown="startDrag"
          @touchstart="startDrag"
        >
          <h2>冲突传导链路分析 - {{ filterLabel }}</h2>
          <button class="modal-close" @click.stop="handleClose">×</button>
        </div>
        <div class="modal-body">
          <div class="sankey-summary">
            <div class="summary-card">
              <div class="summary-value">{{ summaryStats.totalConflicts }}</div>
              <div class="summary-label">冲突总数</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">{{ formatNumber(summaryStats.totalDeaths) }}</div>
              <div class="summary-label">死亡总数</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">{{ summaryStats.avgDeaths }}</div>
              <div class="summary-label">平均死亡</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">{{ summaryStats.maxDeaths }}</div>
              <div class="summary-label">最大单次死亡</div>
            </div>
          </div>
          <div class="sankey-header">
            <div class="legend">
              <div class="legend-item">
                <span class="legend-color" style="background: #D8873F;"></span>
                <span>冲突诱因</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background: #AE2B1E;"></span>
                <span>冲突类型</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background: #CF704A;"></span>
                <span>冲突强度</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background: #AA2F12;"></span>
                <span>伤亡规模</span>
              </div>
            </div>
          </div>
          <div ref="sankeyChart" class="sankey-chart"></div>
          <div v-if="detailVisible" class="detail-popup" :style="detailStyle">
            <div class="detail-header">
              <span>{{ detailTitle }}</span>
              <button class="detail-close" @click="closeDetail">×</button>
            </div>
            <div class="detail-body">
              <div class="detail-stat">
                <span class="stat-label">涉及冲突数：</span>
                <span class="stat-value">{{ detailData.count }}</span>
              </div>
              <div class="detail-conflicts" v-if="detailData.conflicts && detailData.conflicts.length > 0">
                <div class="conflicts-title">详细战争信息：</div>
                <div class="conflicts-list">
                  <div v-for="conflict in detailData.conflicts" :key="conflict.conflict_id" class="conflict-item">
                    <div class="conflict-id">冲突 #{{ conflict.conflict_id }}</div>
                    <div class="conflict-name">{{ conflict.war_name || '未命名战争' }}</div>
                    <div class="conflict-description">
                      <div class="description-label">战争描述：</div>
                      <div class="description-content">{{ conflict.war_description || '暂无描述' }}</div>
                    </div>
                    <div class="conflict-info">
                      <span class="conflict-year">{{ conflict.year }}年</span>
                      <span class="conflict-deaths">{{ formatNumber(conflict.total_deaths) }}人死亡</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div 
          class="resize-handle"
          @mousedown="startResize"
          @touchstart="startResize"
        ></div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed, reactive } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    default: ''
  },
  year: {
    type: Number,
    default: 0
  },
  filterType: {
    type: String,
    default: 'location'
  },
  dataManager: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close']);

const sankeyChart = ref(null);
const modalRef = ref(null);
let chartInstance = null;
const detailVisible = ref(false);
const detailStyle = ref({});
const detailTitle = ref('');
const detailData = ref({ count: 0, conflicts: [] });

const modalState = reactive({
  x: 0,
  y: 0,
  width: 1100,
  height: 700,
  isDragging: false,
  isResizing: false,
  startX: 0,
  startY: 0,
  startWidth: 0,
  startHeight: 0
});

const modalStyle = computed(() => {
  return {
    left: modalState.x + 'px',
    top: modalState.y + 'px',
    width: modalState.width + 'px',
    height: modalState.height + 'px',
    position: 'fixed'
  };
});

const filterLabel = computed(() => {
  if (props.filterType === 'location' && props.location) {
    return props.location;
  } else if (props.filterType === 'year' && props.year) {
    return props.year + '年';
  }
  return '';
});

const filteredData = computed(() => {
  if (!props.dataManager) return [];
  
  if (props.filterType === 'location' && props.location) {
    return props.dataManager.getConflictsByLocation(props.location);
  } else if (props.filterType === 'year' && props.year) {
    return props.dataManager.getConflictsByYear(props.year);
  }
  
  return [];
});

const summaryStats = computed(() => {
  const data = filteredData.value;
  const totalConflicts = data.length;
  const totalDeaths = data.reduce((sum, row) => sum + (Number(row.total_deaths) || 0), 0);
  const avgDeaths = totalConflicts > 0 ? Math.round(totalDeaths / totalConflicts) : 0;
  const maxDeaths = Math.max(...data.map(row => Number(row.total_deaths) || 0), 0);
  
  return {
    totalConflicts,
    totalDeaths,
    avgDeaths,
    maxDeaths
  };
});

const formatNumber = (num) => {
  if (!num) return '0';
  return num.toLocaleString();
};

const incompatibilityMap = {
  1: '领土争端',
  2: '政权争夺',
  3: '领土+政权双重争端'
};

const typeOfConflictMap = {
  1: '系统外冲突',
  2: '国家间冲突',
  3: '国内冲突',
  4: '国际化国内冲突'
};

const intensityLevelMap = {
  1: '次要冲突',
  2: '战争'
};

const getDeathScale = (deaths) => {
  const numDeaths = Number(deaths) || 0;
  if (numDeaths >= 200000) return '灾难性伤亡';
  if (numDeaths >= 50000) return '高伤亡';
  if (numDeaths >= 5000) return '中伤亡';
  if (numDeaths >= 500) return '中低伤亡';
  return '低伤亡';
};

const deathScaleOrder = ['低伤亡', '中低伤亡', '中伤亡', '高伤亡', '灾难性伤亡'];

const sankeyColors = {
  level1: {
    '领土争端': '#D8873F',
    '政权争夺': '#8B3A3A',
    '领土+政权双重争端': '#A64B2A'
  },
  level2: {
    '系统外冲突': '#D48363',
    '国家间冲突': '#AE2B1E',
    '国内冲突': '#C04228',
    '国际化国内冲突': '#D48363'
  },
  level3: {
    '次要冲突': '#CF704A',
    '战争': '#A92E1F'
  },
  level4: {
    '低伤亡': '#D68980',
    '中低伤亡': '#CA5D4C',
    '中伤亡': '#C1462D',
    '高伤亡': '#AA2F12',
    '灾难性伤亡': '#7F2318'
  }
};

const generateSankeyData = (conflicts) => {
  const nodes = new Map();
  const links = [];
  
  const level1Prefix = 'level1_';
  const level2Prefix = 'level2_';
  const level3Prefix = 'level3_';
  const level4Prefix = 'level4_';

  conflicts.forEach(conflict => {
    const incompatibility = conflict.incompatibility || 1;
    const typeOfConflict = conflict.type_of_conflict || 1;
    const intensityLevel = conflict.intensity_level || 1;
    const deathScale = getDeathScale(conflict.total_deaths || 0);
    
    const node1 = { name: incompatibilityMap[incompatibility] || '未知', key: level1Prefix + incompatibility };
    const node2 = { name: typeOfConflictMap[typeOfConflict] || '未知', key: level2Prefix + typeOfConflict };
    const node3 = { name: intensityLevelMap[intensityLevel] || '未知', key: level3Prefix + intensityLevel };
    const node4 = { name: deathScale, key: level4Prefix + deathScale };

    if (!nodes.has(node1.key)) nodes.set(node1.key, { name: node1.name, category: 0 });
    if (!nodes.has(node2.key)) nodes.set(node2.key, { name: node2.name, category: 1 });
    if (!nodes.has(node3.key)) nodes.set(node3.key, { name: node3.name, category: 2 });
    if (!nodes.has(node4.key)) nodes.set(node4.key, { name: node4.name, category: 3 });

    const link12Key = node1.key + '|' + node2.key;
    const link23Key = node2.key + '|' + node3.key;
    const link34Key = node3.key + '|' + node4.key;

    updateLink(links, link12Key, node1.key, node2.key, conflict);
    updateLink(links, link23Key, node2.key, node3.key, conflict);
    updateLink(links, link34Key, node3.key, node4.key, conflict);
  });

  const sortedNodes = [];
  [level1Prefix, level2Prefix, level3Prefix, level4Prefix].forEach(prefix => {
    nodes.forEach((node, key) => {
      if (key.startsWith(prefix)) {
        sortedNodes.push(node);
      }
    });
  });

  const finalNodes = [];
  sortedNodes.forEach(node => {
    const color = getNodeColor(node.name, node.category);
    finalNodes.push({
      name: node.name,
      category: node.category,
      itemStyle: { color: color }
    });
  });

  return { nodes: finalNodes, links: sortLinksByLevel(links, nodes) };
};

const updateLink = (links, key, source, target, conflict) => {
  const existing = links.find(l => l.key === key);
  if (existing) {
    existing.value++;
    existing.conflicts.push(conflict);
  } else {
    links.push({ key, source, target, value: 1, conflicts: [conflict] });
  }
};

const sortLinksByLevel = (links, nodes) => {
  const levelOrder = deathScaleOrder.slice().reverse();
  return links.sort((a, b) => {
    const aIdx = levelOrder.indexOf(nodes.get(a.target)?.name || '');
    const bIdx = levelOrder.indexOf(nodes.get(b.target)?.name || '');
    return aIdx - bIdx;
  }).map(link => ({
    source: nodes.get(link.source).name,
    target: nodes.get(link.target).name,
    value: link.value,
    conflicts: link.conflicts,
    lineStyle: { curveness: 0.5 }
  }));
};

const getCategoryColor = (category) => {
  const colors = ['#D8873F', '#AE2B1E', '#CF704A', '#AA2F12'];
  return colors[category];
};

const getNodeColor = (nodeName, category) => {
  switch (category) {
    case 0:
      return sankeyColors.level1[nodeName] || '#D8873F';
    case 1:
      return sankeyColors.level2[nodeName] || '#AE2B1E';
    case 2:
      return sankeyColors.level3[nodeName] || '#CF704A';
    case 3:
      return sankeyColors.level4[nodeName] || '#AA2F12';
    default:
      return '#D8873F';
  }
};

const initChart = () => {
  if (!sankeyChart.value) return;
  
  chartInstance = echarts.init(sankeyChart.value);
  
  chartInstance.on('click', (params) => {
    handleNodeClick(params);
    showDetail(params);
  });
};

const updateChart = () => {
  if (!chartInstance) return;
  
  const data = filteredData.value;
  if (!data || data.length === 0) {
    chartInstance.clear();
    return;
  }

  const sankeyData = generateSankeyData(data);
  
  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      show: false
    },
    series: [{
      type: 'sankey',
      layout: 'none',
      emphasis: {
        focus: 'adjacency'
      },
      data: sankeyData.nodes,
      links: sankeyData.links,
      levels: [
        { depth: 0, itemStyle: { color: '#D8873F' }, lineStyle: { color: 'source', opacity: 0.4 } },
        { depth: 1, itemStyle: { color: '#AE2B1E' }, lineStyle: { color: 'source', opacity: 0.4 } },
        { depth: 2, itemStyle: { color: '#CF704A' }, lineStyle: { color: 'source', opacity: 0.4 } },
        { depth: 3, itemStyle: { color: '#AA2F12' }, lineStyle: { color: 'source', opacity: 0.4 } }
      ],
      lineStyle: {
        color: 'source',
        curveness: 0.5
      },
      label: {
        color: '#333',
        fontSize: 12,
        fontWeight: 'bold'
      },
      animationDurationUpdate: 300
    }]
  };

  chartInstance.setOption(option, true);
};

const showDetail = (params) => {
  const { dataType, name, data } = params;
  
  let conflicts = [];
  let title = '';
  
  const currentData = filteredData.value;
  
  if (dataType === 'edge') {
    title = `${data.source} → ${data.target}`;
    conflicts = data.conflicts || [];
  } else if (dataType === 'node') {
    title = name;
    const sankeyData = generateSankeyData(currentData);
    conflicts = collectNodeConflicts(name, sankeyData);
  }
  
  detailTitle.value = title;
  detailData.value = {
    count: conflicts.length,
    conflicts: conflicts
  };
  
  const chartRect = sankeyChart.value?.getBoundingClientRect();
  const modalRect = document.querySelector('.sankey-modal')?.getBoundingClientRect();
  
  let left = params.event.event.offsetX + 20;
  let top = params.event.event.offsetY + 20;
  
  if (modalRect) {
    left = Math.min(left, modalRect.width - 400);
    top = Math.min(top, modalRect.height - 300);
  }
  
  detailStyle.value = {
    left: left + 'px',
    top: top + 'px'
  };
  
  detailVisible.value = true;
};

const closeDetail = () => {
  detailVisible.value = false;
};

const collectNodeConflicts = (nodeName, sankeyData) => {
  const conflicts = new Map();
  
  sankeyData.links.forEach(link => {
    if (link.source === nodeName || link.target === nodeName) {
      (link.conflicts || []).forEach(c => {
        conflicts.set(c.conflict_id, c);
      });
    }
  });
  
  return Array.from(conflicts.values());
};

const handleNodeClick = (params) => {
  if (params.dataType !== 'node') return;
  
  const nodeName = params.name;
  const currentData = filteredData.value;
  
  const sankeyData = generateSankeyData(currentData);
  
  const connectedNodes = new Set([nodeName]);
  const connectedLinks = new Set();
  
  let changed = true;
  while (changed) {
    changed = false;
    sankeyData.links.forEach((link, idx) => {
      if (connectedNodes.has(link.source) && !connectedNodes.has(link.target)) {
        connectedNodes.add(link.target);
        connectedLinks.add(idx);
        changed = true;
      }
      if (connectedNodes.has(link.target) && !connectedNodes.has(link.source)) {
        connectedNodes.add(link.source);
        connectedLinks.add(idx);
        changed = true;
      }
    });
  }
  
  const option = {
    series: [{
      data: sankeyData.nodes.map(node => ({
        ...node,
        itemStyle: {
          opacity: connectedNodes.has(node.name) ? 1 : 0.1
        },
        label: {
          opacity: connectedNodes.has(node.name) ? 1 : 0.3
        }
      })),
      links: sankeyData.links.map((link, idx) => ({
        ...link,
        lineStyle: {
          opacity: connectedLinks.has(idx) ? 0.6 : 0.05,
          curveness: 0.5
        }
      }))
    }]
  };
  
  chartInstance.setOption(option);
};

const handleClose = () => {
  detailVisible.value = false;
  emit('close');
};

const handleResize = () => {
  chartInstance?.resize();
};

const startDrag = (e) => {
  const event = e.touches ? e.touches[0] : e;
  modalState.isDragging = true;
  modalState.startX = event.clientX - modalState.x;
  modalState.startY = event.clientY - modalState.y;
  
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('touchmove', handleDrag);
  document.addEventListener('touchend', stopDrag);
};

const handleDrag = (e) => {
  if (!modalState.isDragging) return;
  
  const event = e.touches ? e.touches[0] : e;
  const newX = event.clientX - modalState.startX;
  const newY = event.clientY - modalState.startY;
  
  modalState.x = Math.max(0, Math.min(newX, window.innerWidth - modalState.width));
  modalState.y = Math.max(0, Math.min(newY, window.innerHeight - modalState.height));
};

const stopDrag = () => {
  modalState.isDragging = false;
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('touchmove', handleDrag);
  document.removeEventListener('touchend', stopDrag);
};

const startResize = (e) => {
  e.stopPropagation();
  const event = e.touches ? e.touches[0] : e;
  modalState.isResizing = true;
  modalState.startX = event.clientX;
  modalState.startY = event.clientY;
  modalState.startWidth = modalState.width;
  modalState.startHeight = modalState.height;
  
  document.addEventListener('mousemove', handleResizeEvent);
  document.addEventListener('mouseup', stopResize);
  document.addEventListener('touchmove', handleResizeEvent);
  document.addEventListener('touchend', stopResize);
};

const handleResizeEvent = (e) => {
  if (!modalState.isResizing) return;
  
  const event = e.touches ? e.touches[0] : e;
  const deltaX = event.clientX - modalState.startX;
  const deltaY = event.clientY - modalState.startY;
  
  const minWidth = 600;
  const minHeight = 500;
  const maxWidth = window.innerWidth - 40;
  const maxHeight = window.innerHeight - 40;
  
  modalState.width = Math.max(minWidth, Math.min(modalState.startWidth + deltaX, maxWidth));
  modalState.height = Math.max(minHeight, Math.min(modalState.startHeight + deltaY, maxHeight));
  
  setTimeout(() => {
    chartInstance?.resize();
  }, 0);
};

const stopResize = () => {
  modalState.isResizing = false;
  document.removeEventListener('mousemove', handleResizeEvent);
  document.removeEventListener('mouseup', stopResize);
  document.removeEventListener('touchmove', handleResizeEvent);
  document.removeEventListener('touchend', stopResize);
};

const resetModalPosition = () => {
  const width = Math.min(1100, window.innerWidth - 40);
  const height = Math.min(700, window.innerHeight - 100);
  
  modalState.width = width;
  modalState.height = height;
  modalState.x = (window.innerWidth - width) / 2;
  modalState.y = (window.innerHeight - height) / 2;
};

watch(() => props.visible, (newVal) => {
  if (newVal) {
    resetModalPosition();
    setTimeout(() => {
      initChart();
      updateChart();
    }, 100);
  } else {
    detailVisible.value = false;
  }
});

watch([() => props.filterType, () => props.location, () => props.year], () => {
  if (props.visible) {
    updateChart();
  }
});

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.sankey-modal {
  background: white;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  min-width: 600px;
  min-height: 500px;
  max-width: calc(100vw - 40px);
  max-height: calc(100vh - 40px);
}

.modal-header {
  padding: 20px 24px;
  background: linear-gradient(135deg, #7F1A1A, 0%, #7F1A1A 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 12px 12px 0 0;
  cursor: move;
  user-select: none;
  -webkit-user-select: none;
}

.modal-header:active {
  cursor: grabbing;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  cursor: default;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-body {
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
  overflow-x: hidden;
}

.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, #7F1A1A 0%, #7F1A1A 100%);
  border-radius: 0 0 12px 0;
  cursor: se-resize;
  opacity: 0.6;
  transition: opacity 0.3s;
}

.resize-handle:hover {
  opacity: 1;
}

.resize-handle::before {
  content: '';
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 8px;
  height: 8px;
  border-right: 2px solid rgba(255, 255, 255, 0.8);
  border-bottom: 2px solid rgba(255, 255, 255, 0.8);
}

.sankey-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  box-sizing: border-box;
}

.sankey-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.sankey-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.sankey-chart {
  flex: 1;
  width: 100%;
  min-height: 350px;
  position: relative;
}

.detail-popup {
  position: absolute;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  z-index: 100;
  width: 420px;
  max-height: 500px;
  display: flex;
  flex-direction: column;
  border: 1px solid #e0e0e0;
}

.detail-header {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #7F1A1A 0%, #7F1A1A 100%);
  color: white;
  border-radius: 8px 8px 0 0;
}

.detail-close {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.detail-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.detail-body {
  font-size: 12px;
  padding: 12px 16px;
  overflow-y: auto;
  max-height: 430px;
}

.detail-body::-webkit-scrollbar {
  width: 6px;
}

.detail-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.detail-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.detail-body::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.detail-stat {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.stat-label {
  color: #666;
}

.stat-value {
  color: #7F1A1A;
  font-weight: bold;
  font-size: 16px;
}

.detail-conflicts {
  max-height: 360px;
  overflow-y: auto;
  overflow-x: hidden;
}

.detail-conflicts::-webkit-scrollbar {
  width: 6px;
}

.detail-conflicts::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.detail-conflicts::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.detail-conflicts::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.conflicts-title {
  color: #666;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 500;
}

.conflicts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.conflict-item {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 6px;
  border-left: 3px solid #7F1A1A;
}

.conflict-id {
  font-size: 11px;
  color: #999;
  margin-bottom: 6px;
}

.conflict-name {
  color: #333;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
}

.conflict-description {
  margin-bottom: 8px;
}

.description-label {
  font-size: 11px;
  color: #999;
  margin-bottom: 4px;
}

.description-content {
  color: #555;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.conflict-info {
  display: flex;
  justify-content: space-between;
  color: #888;
  font-size: 11px;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
}

.sankey-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.summary-card {
  padding: 12px;
  background: white;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
  color: #7F1A1A;
}

.summary-label {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .sankey-modal {
    min-width: 90vw;
    min-height: 60vh;
  }
  
  .sankey-summary {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .detail-popup {
    width: calc(100% - 40px);
    left: 20px !important;
  }
}
</style>