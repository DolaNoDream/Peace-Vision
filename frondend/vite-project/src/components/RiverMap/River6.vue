<template>
  <div class="war-stream-box">
    <div class="river-header">
      <h2 class="title">生命之河：全球战争频次与伤亡趋势 (1946-2024)</h2>
    </div>
    <div ref="riverChartRef" class="river-chart-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  rawData: { type: Array, default: () => [] }
});

const emit = defineEmits(['click-year']);

const riverChartRef = ref(null);
let myChart = null;

const chartData = ref([]);

const initChart = () => {
  console.log('initChart 被调用', riverChartRef.value, chartData.value);
  if (!riverChartRef.value || chartData.value.length === 0) {
    console.warn('图表容器或数据未准备好');
    return;
  }
  myChart = echarts.init(riverChartRef.value);
  console.log('ECharts 实例已创建');

  // 准备 themeRiver 数据（格式：[年份数字, 数值, 类别]）
  const riverData = [];

  // 按照指定顺序组织数据：
  // 1. 高强度战争（伤亡50000+）
  // 2. 高强度战争（伤亡5000~50000）
  // 3. 高强度战争（伤亡900~5000）
  // 4. intensity_level_1_count
  // 5. 【间隔】
  // 6. intensity_level_2_count
  // 7. 低强度冲突（伤亡0~300）
  // 8. 低强度冲突（伤亡300~1000）
  chartData.value.forEach(item => {
    const year = item.year;
    
    // 按顺序添加数据，中间插入间隔类别
    riverData.push([year, item.high_intensity_50000_plus || 0, '高强度战争（伤亡50000+）']);
    riverData.push([year, item.high_intensity_5000_50000 || 0, '高强度战争（伤亡5000~50000）']);
    riverData.push([year, item.intensity_level_2_count || 0, '高强度战争']);
    riverData.push([year, item.high_intensity_900_5000 || 0, '高强度战争（伤亡900~5000）']);
    riverData.push([year, 1, '间隔']); // 间隔类别，固定小值产生恒定间距
    riverData.push([year, item.low_intensity_0_300 || 0, '低强度冲突（伤亡0~300）']);
    riverData.push([year, item.intensity_level_1_count || 0, '低强度冲突']);
    riverData.push([year, item.low_intensity_300_1000 || 0, '低强度冲突（伤亡300~1000）']);
  });

  console.log('河流图数据:', riverData.slice(0, 10), '...共', riverData.length, '条');

  // 构建 ECharts 主题河流图（themeRiver）配置
  const option = {
    // 悬浮提示：鼠标悬停时显示当前年份各河流的详细信息
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: 'rgba(0,0,0,0.2)',
          width: 1,
          type: 'solid'
        }
      },
      formatter: function(params) {
        if (!params || params.length === 0) return '';

        const year = Math.round(params[0].value[0]);
        let result = `<div style="font-weight:bold;margin-bottom:5px;">${year}年</div>`;

        if (year <= 1988) {
          // 1988年及之前：仅展示"高强度战争"和"低强度冲突"两类汇总数据
          let highIntensityTotal = 0;
          let lowIntensityTotal = 0;

          params.forEach(item => {
            const category = item.value[2];
            const value = item.value[1];
            if (category === '高强度战争') {
              highIntensityTotal += value;
            } else if (category === '低强度冲突') {
              lowIntensityTotal += value;
            }
          });

          if (highIntensityTotal > 0) {
            result += `<div style="display:flex;align-items:center;margin:3px 0;">
              <span style="display:inline-block;width:10px;height:10px;background:#BD2E1F;margin-right:5px;"></span>
              <span>高强度战争: ${highIntensityTotal}</span>
            </div>`;
          }
          if (lowIntensityTotal > 0) {
            result += `<div style="display:flex;align-items:center;margin:3px 0;">
              <span style="display:inline-block;width:10px;height:10px;background:#F0A65A;margin-right:5px;"></span>
              <span>低强度冲突: ${lowIntensityTotal}</span>
            </div>`;
          }
        } else {
          // 1989年及之后：显示细分数据类别
          const categoryColors = {
            '高强度战争（伤亡50000+）': '#731513',
            '高强度战争（伤亡5000~50000）': '#AE2B1E',
            '高强度战争（伤亡900~5000）': '#CD1625',
            '低强度冲突（伤亡0~300）': '#F8B87A',
            '低强度冲突（伤亡300~1000）': '#E66B22'
          };

          // 按类别名称排序，保持一致的显示顺序
          const sortedParams = [...params].sort((a, b) => {
            const orderA = Object.keys(categoryColors).indexOf(a.value[2]);
            const orderB = Object.keys(categoryColors).indexOf(b.value[2]);
            return orderA - orderB;
          });

          sortedParams.forEach(item => {
            const category = item.value[2];
            const value = item.value[1];
            const color = categoryColors[category] || '#999';

            // 只显示细分类别数据
            if (categoryColors[category] && value > 0) {
              result += `<div style="display:flex;align-items:center;margin:3px 0;">
                <span style="display:inline-block;width:10px;height:10px;background:${color};margin-right:5px;"></span>
                <span>${category}: ${value}</span>
              </div>`;
            }
          });
        }

        return result;
      }
    },
    // 图例：显示所有河流类别，竖排显示
    legend: {
      data: ['高强度战争', '低强度冲突', '高强度战争（伤亡50000+）', '高强度战争（伤亡5000~50000）', '高强度战争（伤亡900~5000）', '低强度冲突（伤亡0~300）', '低强度冲突（伤亡300~1000）'],
      orient: 'vertical',
      left: 20,
      top: 10,
      itemGap: 10,
      selectedMode: true,
      textStyle: { fontSize: 11 }
    },
    // 单轴：themeRiver 使用 singleAxis 代替常规的 xAxis/yAxis
    singleAxis: {
      top: 10,
      bottom: 25,
      left: 20,
      right: 50,
      axisTick: {},
      // 坐标轴标签格式化，将数值显示为"年份"
      axisLabel: {
        formatter: function(value) {
          return Math.round(value) + '年';
        }
      },
      type: 'value',
      min: 1946,
      max: 2024,
      interval: 10,
      // 轴指针：跟随鼠标移动，显示当前年份
      axisPointer: {
        animation: true,
        label: {
          show: true,
          backgroundColor: '#731513',
          formatter: function(params) {
            return Math.round(params.value) + '年';
          }
        }
      },
      // 分割线：虚线辅助阅读不同年份区间
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          opacity: 0.2
        }
      }
    },
    // 系列配置：核心的主题河流图
    series: [
      {
        type: 'themeRiver',
        // 不显示数据标签，保持图表简洁
        label: {
          show: false
        },
        // 高亮效果：鼠标悬停时添加阴影，不显示标签
        emphasis: {
          itemStyle: {
            shadowBlur: 20,
            shadowColor: 'rgba(0, 0, 0, 0.8)'
          },
          label: {
            show: false
          }
        },
        // 河流图数据：[年份, 数值, 类别]
        data: riverData,
        // 各河流类别的颜色映射，按数据插入顺序
        // 顺序：50000+ | 5000~50000 | 高强度战争(汇总) | 900~5000 | 间隔 | 0~300 | 低强度冲突(汇总) | 300~1000
        color: ['#731513', '#AE2B1E', '#BD2E1F', '#CD1625', 'transparent', '#F8B87A', '#F0A65A', '#E66B22']
      }
    ]
  };

  myChart.setOption(option);

  // 关键：强制图表适配容器尺寸
  myChart.resize();

  console.log('图表配置已应用');

  myChart.getZr().on('click', (params) => {
    const pixelPoint = [params.offsetX, params.offsetY];
    const year = Math.round(myChart.convertFromPixel({ seriesIndex: 0 }, pixelPoint)[0]);
    if (year >= 1946 && year <= 2024) {
      emit('click-year', year);
    }
  });
};

// onMounted 钩子在组件挂载完成后同步执行（内部异步操作会延后执行）
onMounted(async () => {
  try {
    // 1. 从 public/result2.json 获取数据
    const res = await fetch('/result2.json');
    const data = await res.json();
    console.log('加载的数据:', data);
    
    // 2. 将数据存入响应式变量
    chartData.value = data;
    
    // 3. 使用 setTimeout 确保 DOM 已渲染后再初始化
    setTimeout(() => {
      initChart();
    }, 0);
    
    // 4. 监听窗口 resize 事件
    window.addEventListener('resize', () => myChart && myChart.resize());
  } catch (error) {
    console.error('加载数据失败:', error);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', () => myChart && myChart.resize());
  if (myChart) myChart.dispose();
});

watch(() => props.rawData, (newData) => {
  if (newData?.length) {
    chartData.value = newData;
    if (myChart) initChart();
  }
}, { deep: true });
</script>

<style scoped>
.war-stream-box {
  --bg-global: #FDFBF7;
  --bg-container: #EFEBE7;
  --text-primary: #2C2B28;
  --text-secondary: #7A7A77;
  --border-color: #E2DFD7;
  width: 100%;
  height: 80vh;              /* 固定高度，便于内部 flex 子项计算 */
  padding: 10px 0 0 0;
  box-sizing: border-box;
  background-color: var(--bg-global);
  display: flex;
  flex-direction: column;
}

.river-header {
  text-align: center;
  margin-bottom: 10px;
  padding: 0 10px;
  flex-shrink: 0;           /* 防止标题被压缩 */
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.river-chart-container {
  flex: 1 1 auto;           /* 占据剩余高度 */
  width: 100%;
  min-height: 0;            /* 防止 flex 溢出，允许收缩 */
  background-color: var(--bg-container);
  border: none;
  border-radius: 0;
  overflow: hidden;         /* 确保子元素不溢出边界 */
  margin: 20px;
  padding: 10px;            /* 内边距，使河流图在容器内缩小，避免显示不全 */
  box-sizing: border-box;
}
</style>