# ConflictSankey.vue 组件使用说明

## 组件概述

`ConflictSankey.vue` 是一个基于 ECharts 桑基图的模态框组件，用于展示冲突数据的传导链路分析。组件通过四层结构展示数据流向：

1. **冲突诱因**（领土争端、政权争夺、领土+政权双重争端）
2. **冲突类型**（系统外冲突、国家间冲突、国内冲突、国际化国内冲突）
3. **冲突强度**（次要冲突、战争）
4. **伤亡规模**（低伤亡、中低伤亡、中伤亡、高伤亡、灾难性伤亡）

## 组件 Props

| 属性名 | 类型 | 默认值 | 必填 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `visible` | Boolean | false | 是 | 控制模态框的显示与隐藏 |
| `location` | String | '' | 否 | 按地理位置过滤数据（配合 filterType='location' 使用） |
| `year` | Number | 0 | 否 | 按年份过滤数据（配合 filterType='year' 使用） |
| `filterType` | String | 'location' | 是 | 过滤类型，可选值：'location' 或 'year' |
| `dataManager` | Object | null | 是 | 数据管理器实例，提供数据查询方法 |

## 组件 Events

| 事件名 | 说明 | 回调参数 |
| :--- | :--- | :--- |
| `close` | 用户点击关闭按钮时触发 | 无 |

## 数据要求

### dataManager 接口要求

`dataManager` 对象需要实现以下方法：

```javascript
{
  // 根据地理位置获取冲突数据
  getConflictsByLocation(location: string): Array<Conflict>
  
  // 根据年份获取冲突数据
  getConflictsByYear(year: number): Array<Conflict>
}
```

### Conflict 数据结构

每个冲突数据对象应包含以下字段：

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `conflict_id` | Number/String | 冲突唯一标识 |
| `incompatibility` | Number | 冲突诱因类型（1=领土争端，2=政权争夺，3=双重争端） |
| `type_of_conflict` | Number | 冲突类型（1=系统外，2=国家间，3=国内，4=国际化国内） |
| `intensity_level` | Number | 冲突强度（1=次要冲突，2=战争） |
| `total_deaths` | Number | 死亡人数 |
| `year` | Number | 年份 |
| `location` | String | 地理位置 |
| `war_name` | String | 战争名称（可选） |
| `war_description` | String | 战争描述（可选） |

## 父组件使用示例

### 基础用法

在父组件中引入并使用 `ConflictSankey` 组件：

```vue
<template>
  <div class="parent-component">
    <!-- 其他图表组件 -->
    <MapComponent
      :data="allData"
      @view-sankey="handleViewSankey"
    />
    
    <!-- 桑基图模态框组件 -->
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
import { ref } from 'vue';
import ConflictSankey from './components/ConflictSankey.vue';

// 响应式状态
const sankeyVisible = ref(false);
const sankeyLocation = ref('');
const sankeyYear = ref(0);
const sankeyFilterType = ref('location');

// 数据管理器实例
const dataManager = ref(new ConflictDataManager());

// 打开桑基图模态框
const handleViewSankey = (params) => {
  sankeyFilterType.value = params.type;
  sankeyLocation.value = params.type === 'location' ? params.value : '';
  sankeyYear.value = params.type === 'year' ? params.value : 0;
  sankeyVisible.value = true;
};

// 关闭桑基图模态框
const handleSankeyClose = () => {
  sankeyVisible.value = false;
};
</script>
```

### 与其他图表联动

其他图表组件通过触发 `view-sankey` 事件来打开桑基图：

```vue
<!-- MapComponent.vue 示例 -->
<script setup>
const emit = defineEmits(['location-select', 'view-sankey']);

const handleViewDetail = () => {
  emit('view-sankey', {
    type: 'location',
    value: props.selectedLocation
  });
};
</script>
```

```vue
<!-- RiverComponent.vue 示例 -->
<script setup>
const emit = defineEmits(['year-select', 'view-sankey']);

const handleViewDetail = () => {
  emit('view-sankey', {
    type: 'year',
    value: Number(props.selectedYear)
  });
};
</script>
```

## App.vue 完整使用示例

```vue
<template>
  <div class="app-container">
    <!-- 顶部区域：地图和河流图 -->
    <div class="top-section">
      <div class="map-panel">
        <MapComponent
          :data="allData"
          :selected-location="selectedLocation"
          @location-select="handleLocationSelect"
          @view-sankey="handleViewSankey"
        />
      </div>
      <div class="river-panel">
        <RiverComponent
          :data="allData"
          :selected-year="selectedYear"
          :all-years="availableYears"
          @year-select="handleYearSelect"
          @view-sankey="handleViewSankey"
        />
      </div>
    </div>

    <!-- 桑基图模态框 -->
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
import { ref, onMounted } from 'vue';
import MapComponent from './components/MapComponent.vue';
import RiverComponent from './components/RiverComponent.vue';
import ConflictSankey from './components/ConflictSankey.vue';
import { ConflictDataManager } from './utils/DataExtractor.js';

// 数据状态
const allData = ref([]);
const dataLoaded = ref(false);
const dataManager = ref(new ConflictDataManager());

// 筛选状态
const selectedLocation = ref('');
const selectedYear = ref(0);
const availableYears = ref([]);

// 桑基图状态
const sankeyVisible = ref(false);
const sankeyLocation = ref('');
const sankeyYear = ref(0);
const sankeyFilterType = ref('location');

// 加载数据
const loadData = async () => {
  try {
    // 加载并初始化数据
    const response = await fetch('/conflicts.xlsx');
    const blob = await response.blob();
    await dataManager.value.loadFromBlob(blob);
    allData.value = dataManager.value.getAllConflicts();
    availableYears.value = dataManager.value.getAvailableYears();
    dataLoaded.value = true;
  } catch (error) {
    console.error('数据加载失败:', error);
  }
};

// 处理位置选择
const handleLocationSelect = (location) => {
  selectedLocation.value = location;
};

// 处理年份选择
const handleYearSelect = (year) => {
  selectedYear.value = Number(year);
};

// 打开桑基图
const handleViewSankey = (params) => {
  sankeyFilterType.value = params.type;
  sankeyLocation.value = params.type === 'location' ? params.value : '';
  sankeyYear.value = params.type === 'year' ? params.value : 0;
  sankeyVisible.value = true;
};

// 关闭桑基图
const handleSankeyClose = () => {
  sankeyVisible.value = false;
};

onMounted(() => {
  loadData();
});
</script>
```

## 联动流程图

```
┌─────────────────┐      @view-sankey      ┌─────────────────┐
│  MapComponent   │ ──────────────────────→│     App.vue     │
│   (地图组件)     │                        │ handleViewSankey │
└─────────────────┘                        └────────┬────────┘
                                                    │
┌─────────────────┐      @view-sankey               │
│ RiverComponent  │ ────────────────────────────────┘
│  (河流图组件)    │         │
└─────────────────┘         ▼
                   ┌─────────────────┐
                   │ ConflictSankey  │
                   │   (桑基图组件)   │
                   └─────────────────┘
```

## 注意事项

1. **数据初始化顺序**：确保 `dataManager` 在组件挂载前已完成数据加载
2. **类型转换**：年份参数需要转换为 `Number` 类型
3. **过滤条件互斥**：`location` 和 `year` 根据 `filterType` 选择性生效
4. **样式兼容性**：组件使用 `Teleport to="body"`，确保全局样式不冲突