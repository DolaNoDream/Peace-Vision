# 🌍 Peace-Vision 战争地理可视化项目

本项目为基于 Vue3 + ECharts 的全球战争数据可视化系统，用于展示 1946–2024 年全球冲突的时空分布与伤亡情况。

---

## 📌 项目功能概述

- 🌍 全球战争热力地图（按国家展示冲突死亡人数）
- 📅 时间轴滑动（1946–2024 单年 / 汇总模式）
- 📊 历史累计战争伤亡统计
- 🔥 战争烈度与死亡人数映射可视化
- 📦 基于 UCDP / Battle Deaths 数据集

---

## 🗺️ 地图模块说明（核心功能）

地图模块位于：src/components/map/WarHeatmap.vue


### ✨ 主要功能

- 使用 ECharts world map 渲染全球地理分布
- 支持：
  - 单年战争伤亡可视化
  - 全历史累计（SUMMARY 模式）
- 数据根据国家维度聚合显示
- 支持时间滑动更新视图

---

## 📊 数据来源

数据存放在：public/data/


### 主要数据文件：

| 文件 | 说明 |
|------|------|
| UcdpPrioConflict_v25_1.xlsx | 冲突事件基础数据（时间/地点/烈度） |
| BattleDeaths_v25_1_conf.xlsx | 精确战斗死亡人数数据 |
| conflicts.xlsx | 辅助冲突信息 |

---

## 🧠 数据处理逻辑

核心逻辑在 `WarHeatmap.vue` 中：

### 1️⃣ 单年模式

- 根据 slider 选中的年份筛选冲突
- 调用 `getConflictDeaths(conf, year)`
- 按国家累加死亡人数

---

### 2️⃣ 汇总模式（SUMMARY）

- 遍历 1946–2024 所有冲突
- 按年份逐条计算死亡人数
- 按国家累加形成历史总量

---

### 3️⃣ 死亡人数计算规则

优先级如下：
1989年以后：
使用 BattleDeaths 精确数据

1989年以前：
① 历史战争 override 修正（如朝鲜战争 / 越南战争）
② total_deaths 字段
③ 烈度兜底估算值


---

## 🧩 关键函数说明

### getConflictDeaths(conf, year)

负责返回某个冲突在某一年死亡人数。

### getHistoricalOverride(location, year)

用于修正历史著名战争的粗粒度数据，例如：

- 朝鲜战争
- 越南战争
- 两伊战争
- 阿富汗战争
- 国共内战后期

---

## 🗺️ 地图文件
src/assets/world.json

用于 ECharts 世界地图 GeoJSON 数据。

---

## 🎨 可视化技术栈

- Vue 3（Composition API）
- ECharts（地图可视化）
- XLSX（Excel 数据解析）
- JavaScript（数据处理逻辑）

---

## 🚀 运行方式

```bash
npm install
npm install echarts
npm run dev

---

## 📁 项目结构（地图相关）
src/
 ├── components/
 │    └── map/
 │         └── WarHeatmap.vue   # 核心地图组件
 ├── assets/
 │    └── world.json            # 世界地图数据
public/
 └── data/                      # 战争数据集
