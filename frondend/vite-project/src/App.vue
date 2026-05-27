<template>
  <div class="app-container">
    <header class="app-header">
      <h1> Peace-Vision 全球冲突数据分析平台</h1>
      <div class="header-actions">
        <div v-if="loading" class="loading-status">
          正在加载数据...
        </div>
        <div v-else-if="dataLoaded" class="data-status">
          数据已加载: {{ allData.length }} 条记录
        </div>
        <div v-else class="error-status">
          ❌ 数据加载失败
        </div>
      </div>
    </header>

    <div class="app-content" v-if="dataLoaded">
      <div class="top-section">
        <div class="map-panel">
          
        </div>
        <div class="river-panel">

        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-content">
        <div class="empty-icon">
          <div v-if="loading" class="loader">
            <div class="loader-ring"></div>
            <div class="loader-text">加载中...</div>
          </div>
          <div v-else>❌</div>
        </div>
        <h2>{{ loading ? '正在加载数据...' : '数据加载失败' }}</h2>
        <p v-if="!loading">无法加载冲突数据文件，请检查文件是否存在</p>
        <div v-if="!loading" class="retry-btn" @click="loadData">
          🔄 重试加载
        </div>
      </div>
    </div>

    <ConflictSankey
      :visible="sankeyVisible"
      :location="sankeyLocation"
      :year="sankeyYear"
      :filter-type="sankeyFilterType"
      :data-manager="dataManager"
      @close="handleSankeyClose"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import MapComponent from './components/MapComponent.vue';
import RiverComponent from './components/RiverComponent.vue';
import ConflictSankey from './components/ConflictSankey.vue';
import { ConflictDataManager } from './utils/DataExtractor.js';

import '@/styles/app.css';

const allData = ref([]);
const dataLoaded = ref(false);
const loading = ref(true);
const selectedLocation = ref('');
const selectedYear = ref(0);
const availableYears = ref([]);

const sankeyVisible = ref(false);
const sankeyLocation = ref('');
const sankeyYear = ref(0);
const sankeyFilterType = ref('location');

const dataManager = ref(new ConflictDataManager());

const loadData = async () => {
  loading.value = true;
  dataLoaded.value = false;
  
  try {
    const mainResponse = await fetch('/conflicts.xlsx');
    if (!mainResponse.ok) {
      throw new Error('主数据文件加载失败');
    }
    const mainBlob = await mainResponse.blob();
    await dataManager.value.loadMainFile(mainBlob);

    const yearResponse = await fetch('/UcdpPrioConflict_v25_1.xlsx');
    if (yearResponse.ok) {
      const yearBlob = await yearResponse.blob();
      await dataManager.value.loadYearFile(yearBlob);
    }

    allData.value = dataManager.value.getAllMainData();
    dataLoaded.value = true;
    
    if (allData.value.length > 0) {
      availableYears.value = dataManager.value.getAllYears();
      const locations = dataManager.value.getAllLocations();
      
      if (availableYears.value.length > 0) {
        selectedYear.value = availableYears.value[0];
      }
      if (locations.length > 0) {
        selectedLocation.value = locations[0];
      }
    }
  } catch (error) {
    console.error('数据加载失败:', error);
    dataLoaded.value = false;
  } finally {
    loading.value = false;
  }
};

const handleLocationSelect = (location) => {
  selectedLocation.value = location;
};

const handleYearSelect = (year) => {
  const yearValue = Number(year);
  console.log('handleYearSelect called, year:', yearValue, 'type:', typeof yearValue);
  selectedYear.value = yearValue;
};

const handleViewSankey = (params) => {
  sankeyFilterType.value = params.type;
  sankeyLocation.value = params.type === 'location' ? params.value : '';
  sankeyYear.value = params.type === 'year' ? params.value : 0;
  sankeyVisible.value = true;
};

const handleSankeyClose = () => {
  sankeyVisible.value = false;
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.app-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.app-header h1 {
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 1px;
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.loading-status,
.data-status,
.error-status {
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
}

.loading-status {
  background: rgba(255,255,255,0.15);
}

.data-status {
  background: rgba(255,255,255,0.15);
}

.error-status {
  background: rgba(238, 102, 102, 0.2);
}

.app-content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.top-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  height: 450px;
}

.map-panel,
.river-panel {
  height: 100%;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.empty-content {
  text-align: center;
  max-width: 500px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loader-ring {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(102, 126, 234, 0.2);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loader-text {
  font-size: 16px;
  color: #667eea;
}

.empty-content h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 12px;
}

.empty-content p {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
}

.retry-btn {
  display: inline-block;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
</style>