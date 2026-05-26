<script setup>
import WarHeatmap from './components/map/WarHeatmap.vue';
</script>

<template>
  <div class="app-container">
    <header>
      <h1>Peace Vision - 二战以来战争数据可视化</h1>
    </header>
    
    <main>
      <!-- 第一模块：热力图 -->
      <section class="module-section">
        <WarHeatmap />
      </section>
      
      <!-- 这里预留给其他小组的河流图和桑基图 -->
    </main>
  </div>
</template>

<style>
/* 引入全局规范中的背景色 */
body {
  background-color: #514747; /* 规范：页面背景色 */
  margin: 0;
  padding: 0;
  font-family: 'Inter', sans-serif;
}

.app-container {
  padding: 20px;
}

header h1 {
  color: #F9F6F0;
  text-align: center;
  margin-bottom: 40px;
}
</style>