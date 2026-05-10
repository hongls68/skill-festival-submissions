const getToday = () => {
  const d = new Date()
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

type ChartRange = '日' | '周' | '月'

type PressurePoint = {
  label: string
  value: number
}

const pressureTrendData: Record<ChartRange, PressurePoint[]> = {
  日: [
    { label: '06:00', value: 26 },
    { label: '09:00', value: 42 },
    { label: '12:00', value: 50 },
    { label: '15:00', value: 68 },
    { label: '18:00', value: 58 },
    { label: '21:00', value: 39 },
    { label: '现在', value: 35 },
  ],
  周: [
    { label: '周一', value: 42 },
    { label: '周二', value: 38 },
    { label: '周三', value: 55 },
    { label: '周四', value: 48 },
    { label: '周五', value: 64 },
    { label: '周六', value: 36 },
    { label: '周日', value: 44 },
  ],
  月: [
    { label: '第1周', value: 51 },
    { label: '第2周', value: 47 },
    { label: '第3周', value: 43 },
    { label: '第4周', value: 39 },
  ],
}

const getPressureSource = (range: string) => pressureTrendData[(range as ChartRange) || '周'] || pressureTrendData['周']

const getPressureLevel = (value: number) => {
  if (value >= 65) return '偏高'
  if (value >= 50) return '关注'
  return '正常'
}

const getPressureColor = (value: number) => {
  if (value >= 65) return '#e8825c'
  if (value >= 50) return '#e8b85c'
  return '#4a7c6f'
}

const getPressureGradient = (value: number) => {
  if (value >= 65) return 'linear-gradient(180deg, #e8825c 0%, #f0a882 100%)'
  if (value >= 50) return 'linear-gradient(180deg, #e8b85c 0%, #f0d18b 100%)'
  return 'linear-gradient(180deg, #4a7c6f 0%, #7ab5a5 100%)'
}

const generateChartData = (range: string) => getPressureSource(range).map((point) => ({
  ...point,
  percent: point.value,
  color: getPressureColor(point.value),
  gradient: getPressureGradient(point.value),
  level: getPressureLevel(point.value),
  isPeak: point.value === Math.max(...getPressureSource(range).map((item) => item.value)),
}))

const generateLinePoints = (range: string) => {
  const source = getPressureSource(range)
  const count = source.length
  const svgWidth = 600
  const svgHeight = 220
  const paddingX = 42
  const paddingY = 24
  const stepX = count > 1 ? (svgWidth - paddingX * 2) / (count - 1) : 0

  const points = source.map((point, i) => {
    const x = paddingX + i * stepX
    const y = svgHeight - paddingY - (point.value / 100) * (svgHeight - paddingY * 2)
    return {
      x: Math.round(x),
      y: Math.round(y),
      value: point.value,
      label: point.label,
      color: getPressureColor(point.value),
    }
  })

  let pathD = `M${points[0].x},${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpx1 = prev.x + stepX * 0.42
    const cpx2 = curr.x - stepX * 0.42
    pathD += ` C${cpx1},${prev.y} ${cpx2},${curr.y} ${curr.x},${curr.y}`
  }

  const areaD = `${pathD} L${points[points.length - 1].x},${svgHeight - paddingY} L${points[0].x},${svgHeight - paddingY} Z`
  const thresholdY = Math.round(svgHeight - paddingY - 60 / 100 * (svgHeight - paddingY * 2))

  return { pathD, areaD, points, svgWidth, svgHeight, thresholdY }
}

const getChartSummary = (range: string) => {
  const source = getPressureSource(range)
  const values = source.map((item) => item.value)
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  const peak = Math.max(...values)
  const lowest = Math.min(...values)
  const peakPoint = source.find((item) => item.value === peak)
  const alertCount = values.filter((value) => value >= 60).length
  const trendDelta = values[values.length - 1] - values[0]

  return {
    avg,
    peak,
    lowest,
    peakLabel: peakPoint ? peakPoint.label : '--',
    alertCount,
    trendDelta: trendDelta > 0 ? `+${trendDelta}` : `${trendDelta}`,
    trendText: trendDelta > 0 ? '较开始升高' : trendDelta < 0 ? '较开始下降' : '整体持平',
  }
}

const aiTips = [
  {
    id: 1,
    text: '根据本周压力数据分析，您的颈部在下午2-4点承受压力最大，建议在该时段开启气囊按摩功能，并每隔45分钟起身活动5分钟，让颈椎得到充分放松。',
    tag: '姿势分析',
  },
  {
    id: 2,
    text: '您的左右压力平衡度为88%，整体较好，但右侧护翼压力略高。这可能与长期右手操作鼠标有关，建议调整办公姿势，适当增加左侧气囊支撑来纠正偏移。',
    tag: '平衡建议',
  },
  {
    id: 3,
    text: '结合您的睡眠数据和晨起颈部状态，建议将睡眠模式的气囊调低10%，过高的夜间支撑可能影响翻身频率。当前翻身6次/夜属于正常范围，优化后有望提升深睡时长。',
    tag: '睡眠优化',
  },
]

const initialChartSummary = getChartSummary('周')

Component({
  data: {
    todayDate: getToday(),
    postureScore: 82,
    wearTime: '3h 24m',
    alertCount: 2,
    avgPressure: 45,
    chartRange: '周',
    chartRanges: ['日', '周', '月'],
    chartData: generateChartData('周'),
    lineChart: generateLinePoints('周'),
    chartAvg: initialChartSummary.avg,
    chartPeak: initialChartSummary.peak,
    chartLowest: initialChartSummary.lowest,
    chartPeakLabel: initialChartSummary.peakLabel,
    chartAlertCount: initialChartSummary.alertCount,
    chartTrendDelta: initialChartSummary.trendDelta,
    chartTrendText: initialChartSummary.trendText,
    sleepQuality: '良好',
    sleepDuration: '7h 32m',
    deepSleep: '2h 15m',
    turnCount: 6,
    neckMorning: '舒适',
    postureDeg: 295,
    leftRightBalance: 88,
    frontBackSupport: 76,
    pressureUniformity: 82,
    healthTips: [
      '今日左侧压力偏高，建议调整坐姿，避免长时间左倾',
      '下午2-4点压力峰值明显，建议定时起身活动',
      '本周睡眠质量较上周提升12%，继续保持当前气囊设置',
      '建议每天佩戴不超过8小时，适当让颈部休息',
    ],
    aiTips: aiTips,
    aiLoading: false,
    aiLoaded: true,
  },
  pageLifetimes: {
    show() {
      if (typeof this.getTabBar === 'function') {
        this.getTabBar().setData({ selected: 2 })
      }
    },
  },
  methods: {
    setChartRange(e: WechatMiniprogram.TouchEvent) {
      const range = e.currentTarget.dataset.range as ChartRange
      const chartData = generateChartData(range)
      const lineChart = generateLinePoints(range)
      const chartSummary = getChartSummary(range)

      this.setData({
        chartRange: range,
        chartData,
        lineChart,
        chartAvg: chartSummary.avg,
        chartPeak: chartSummary.peak,
        chartLowest: chartSummary.lowest,
        chartPeakLabel: chartSummary.peakLabel,
        chartAlertCount: chartSummary.alertCount,
        chartTrendDelta: chartSummary.trendDelta,
        chartTrendText: chartSummary.trendText,
      })
    },

    loadAiTips() {
      this.setData({ aiLoading: true, aiLoaded: false })
      setTimeout(() => {
        this.setData({ aiLoading: false, aiLoaded: true, aiTips })
      }, 1500)
    },
  },
})
