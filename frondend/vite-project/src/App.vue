<template>
  <div class="app-container">
    <header class="app-header">
      <h1> Peace-Vision 全球冲突数据分析平台</h1>
      <div class="header-actions">
        <div v-if="loading" class="loading-status">
          正在加载数据...
        </div>
        <div v-else-if="dataLoaded" class="data-status">
          数据已加载
        </div>
        <div v-else class="error-status">
          ❌ 数据加载失败
        </div>
      </div>
    </header>

    <div class="app-content" v-if="dataLoaded">
      <!-- 第一模块：热力图 -->
      <section class="module-section map-section">
        <WarHeatmap />
      </section>
      
      <!-- 第二模块：河流图 -->
      <section class="module-section river-section">
        <RiverChart @click-year="handleRiverClickYear" />
      </section>
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
import ConflictSankey from './components/ConflictSankey.vue';
import RiverChart from './components/RiverMap/River6.vue';
import WarHeatmap from './components/map/WarHeatmap.vue';
import { ConflictDataManager } from './utils/DataExtractor.js';

const dataLoaded = ref(false);
const loading = ref(true);

const sankeyVisible = ref(false);
const sankeyLocation = ref('');
const sankeyYear = ref(0);
const sankeyFilterType = ref('location');

const dataManager = ref(new ConflictDataManager());

const loadData = async () => {
  loading.value = true;
  dataLoaded.value = false;
  
  try {
    const mainResponse = await fetch('/data/conflicts.xlsx');
    if (!mainResponse.ok) {
      throw new Error('主数据文件加载失败');
    }
    const mainBlob = await mainResponse.blob();
    await dataManager.value.loadMainFile(mainBlob);

    const yearResponse = await fetch('/data/UcdpPrioConflict_v25_1.xlsx');
    if (yearResponse.ok) {
      const yearBlob = await yearResponse.blob();
      await dataManager.value.loadYearFile(yearBlob);
    }

    dataLoaded.value = true;
  } catch (error) {
    console.error('数据加载失败:', error);
    dataLoaded.value = false;
  } finally {
    loading.value = false;
  }
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

const handleRiverClickYear = (year) => {
  console.log('River6 clicked, year:', year);
  handleViewSankey({
    type: 'year',
    value: year
  });
};

onMounted(() => {
  loadData();
  
  // 监听热力图的桑基图请求事件
  window.addEventListener('sankey-render-request', (event) => {
    const { country } = event.detail;
    console.log('热力图点击国家:', country);
    if (country) {
      handleViewSankey({
        type: 'location',
        value: country
      });
    }
  });
});
</script>

<style>
body {
  background-color: #514747;
  margin: 0;
  padding: 0;
  font-family: 'Inter', sans-serif;
}
</style>

<style scoped>
.app-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #731513 0%, #96281B 100%);
  color: #F9F6F0;
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
  margin: 0;
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

.module-section {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.map-section {
  min-height: 60vh;
}

.river-section {
  min-height: 40vh;
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
  border: 4px solid rgba(115, 21, 19, 0.2);
  border-top-color: #731513;
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
  color: #F9F6F0;
}

.empty-content h2 {
  font-size: 28px;
  color: #F9F6F0;
  margin-bottom: 12px;
}

.empty-content p {
  font-size: 16px;
  color: #E2DFD7;
  margin-bottom: 30px;
}

.retry-btn {
  display: inline-block;
  padding: 12px 24px;
  background: linear-gradient(135deg, #731513 0%, #96281B 100%);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(115, 21, 19, 0.3);
}
</style>
