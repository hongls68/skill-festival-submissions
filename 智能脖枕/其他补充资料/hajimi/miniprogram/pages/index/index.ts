type ZoneTemplate = {
  id: string
  name: string
  left: number
  top: number
  width: number
  height: number
}

type PressureMap = Record<string, number>

const zoneTemplates: ZoneTemplate[] = [
  { id: 'leftWing', name: '左侧护翼', left: 76, top: 94, width: 148, height: 216 },
  { id: 'rightWing', name: '右侧护翼', left: 396, top: 94, width: 148, height: 216 },
  { id: 'cervical', name: '后颈承托', left: 218, top: 248, width: 184, height: 110 },
  { id: 'leftBase', name: '左下承托', left: 144, top: 274, width: 148, height: 114 },
  { id: 'rightBase', name: '右下承托', left: 328, top: 274, width: 148, height: 114 },
]

let simulationTimer: number | null = null
let simulationStep = 0
let currentPressureMap: PressureMap = {}
let targetPressureMap: PressureMap = {}

const pad = (value: number) => `${value}`.padStart(2, '0')

const formatTime = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`

const clampPressure = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  if (hour < 22) return '晚上好'
  return '夜深了'
}

const getStrengthLabel = (pressure: number) => {
  if (pressure >= 85) return '偏紧'
  if (pressure >= 55) return '适中'
  if (pressure > 0) return '舒适'
  return '无压力'
}

const getDotColor = (pressure: number) => {
  if (pressure >= 85) return '#e8825c'
  if (pressure >= 55) return '#e8b85c'
  if (pressure > 0) return '#4a7c6f'
  return '#d4d4d4'
}

const getBarColor = (pressure: number) => {
  if (pressure >= 85) return 'linear-gradient(90deg, #e8b85c, #e8825c)'
  if (pressure >= 55) return 'linear-gradient(90deg, #4a7c6f, #e8b85c)'
  if (pressure > 0) return 'linear-gradient(90deg, #7ab5a5, #4a7c6f)'
  return '#e8e8e8'
}

const buildZoneStyle = (zone: ZoneTemplate, pressure: number) => {
  if (pressure >= 85) {
    const alpha = (0.2 + pressure / 100 * 0.5).toFixed(2)
    return [
      `left:${zone.left}rpx`, `top:${zone.top}rpx`,
      `width:${zone.width}rpx`, `height:${zone.height}rpx`,
      `opacity:1`,
      `background:radial-gradient(circle at center, rgba(232,130,92,${alpha}) 0%, rgba(232,130,92,0.08) 65%, rgba(232,130,92,0) 100%)`,
      `box-shadow:0 0 ${16 + Math.round(pressure / 6)}rpx rgba(232,130,92,${alpha})`,
      `border:2rpx solid rgba(232,130,92,${(parseFloat(alpha) * 0.6).toFixed(2)})`,
    ].join(';')
  }
  if (pressure >= 55) {
    const alpha = (0.16 + pressure / 100 * 0.4).toFixed(2)
    return [
      `left:${zone.left}rpx`, `top:${zone.top}rpx`,
      `width:${zone.width}rpx`, `height:${zone.height}rpx`,
      `opacity:1`,
      `background:radial-gradient(circle at center, rgba(232,184,92,${alpha}) 0%, rgba(232,184,92,0.08) 65%, rgba(232,184,92,0) 100%)`,
      `box-shadow:0 0 ${12 + Math.round(pressure / 8)}rpx rgba(232,184,92,${alpha})`,
      `border:2rpx solid rgba(232,184,92,${(parseFloat(alpha) * 0.5).toFixed(2)})`,
    ].join(';')
  }
  if (pressure > 0) {
    const alpha = (0.12 + pressure / 100 * 0.3).toFixed(2)
    return [
      `left:${zone.left}rpx`, `top:${zone.top}rpx`,
      `width:${zone.width}rpx`, `height:${zone.height}rpx`,
      `opacity:1`,
      `background:radial-gradient(circle at center, rgba(74,124,111,${alpha}) 0%, rgba(74,124,111,0.06) 65%, rgba(74,124,111,0) 100%)`,
      `box-shadow:0 0 ${8 + Math.round(pressure / 10)}rpx rgba(74,124,111,${alpha})`,
      `border:2rpx solid rgba(74,124,111,${(parseFloat(alpha) * 0.4).toFixed(2)})`,
    ].join(';')
  }
  return [
    `left:${zone.left}rpx`, `top:${zone.top}rpx`,
    `width:${zone.width}rpx`, `height:${zone.height}rpx`,
    `opacity:0.12`,
    `background:radial-gradient(circle at center, rgba(180,180,180,0.1) 0%, transparent 65%)`,
  ].join(';')
}

const getInsightText = (strongestZoneName: string, avgPressure: number, balance: number) => {
  if (avgPressure >= 82) return `${strongestZoneName}压力偏高，建议稍微放松支撑力度`
  if (balance < 78) return '左右压力有些不均，建议调整头颈位置保持居中'
  if (avgPressure >= 55) return '当前支撑力度适中，颈部承托状态比较稳定'
  if (avgPressure > 0) return '压力分布较轻柔，适合日常放松佩戴'
  return ''
}

const createInitialPressureMap = () => zoneTemplates.reduce<PressureMap>((map, zone) => {
  map[zone.id] = clampPressure(22 + Math.random() * 26)
  return map
}, {})

const createTargetPressureMap = (baseMap: PressureMap = currentPressureMap) => {
  const lean = Math.random() * 18 - 9
  const neckLoad = 42 + Math.random() * 30
  const baseLoad = 32 + Math.random() * 26
  const nextMap: PressureMap = {}

  zoneTemplates.forEach((zone) => {
    const current = baseMap[zone.id] || 35
    const sideOffset = zone.id.includes('left') ? lean : zone.id.includes('right') ? -lean : 0
    const areaBase = zone.id === 'cervical' ? neckLoad : zone.id.includes('Base') ? baseLoad : 36 + Math.random() * 26
    const microMove = Math.random() * 12 - 6
    nextMap[zone.id] = clampPressure(current * 0.35 + areaBase * 0.65 + sideOffset + microMove)
  })

  return nextMap
}

const createRealtimePressureMap = () => {
  const nextMap: PressureMap = {}

  zoneTemplates.forEach((zone) => {
    const current = currentPressureMap[zone.id] || 0
    const target = targetPressureMap[zone.id] || current
    const sensorNoise = Math.random() * 3 - 1.5
    const eased = current + (target - current) * 0.28 + sensorNoise
    nextMap[zone.id] = clampPressure(eased)
  })

  currentPressureMap = nextMap
  return nextMap
}

const createZones = (pressureMap: PressureMap = {}) => zoneTemplates.map((zone) => {
  const pressure = clampPressure(pressureMap[zone.id] || 0)
  return {
    ...zone,
    pressure,
    active: pressure > 0,
    strengthLabel: getStrengthLabel(pressure),
    style: buildZoneStyle(zone, pressure),
    dotColor: getDotColor(pressure),
    barColor: getBarColor(pressure),
  }
})

Component({
  data: {
    greeting: getGreeting(),
    isSimulating: true,
    lastUpdated: '--:--:--',
    maxPressure: 0,
    activeCount: 0,
    postureScore: '--',
    highlightedZone: '等待信号',
    zones: createZones(),
    insightText: '',
  },
  lifetimes: {
    attached() {
      this.resetSimulationSignal()
      this.startSimulation()
    },
    detached() {
      this.stopSimulation()
    },
  },
  pageLifetimes: {
    show() {
      if (typeof this.getTabBar === 'function') {
        this.getTabBar().setData({ selected: 0 })
      }
      if (!simulationTimer && this.data.isSimulating) {
        this.startSimulation()
      }
    },
    hide() {
      this.stopSimulation()
    },
  },
  methods: {
    applyPressureSignal(pressureMap: PressureMap) {
      const zones = createZones(pressureMap)
      const activeZones = zones.filter((z) => z.active)
      const sortedZones = [...activeZones].sort((a, b) => b.pressure - a.pressure)
      const strongestZone = sortedZones[0]

      const avgPressure = activeZones.length
        ? Math.round(activeZones.reduce((s, z) => s + z.pressure, 0) / activeZones.length)
        : 0

      let postureScore = '--'
      let balance = 100
      if (activeZones.length > 0) {
        const leftPressure = (pressureMap['leftWing'] || 0) + (pressureMap['leftBase'] || 0)
        const rightPressure = (pressureMap['rightWing'] || 0) + (pressureMap['rightBase'] || 0)
        balance = Math.max(0, 100 - Math.abs(leftPressure - rightPressure) / 2)
        const comfort = Math.max(0, 100 - avgPressure * 0.5)
        postureScore = Math.round((balance * 0.6 + comfort * 0.4)).toString()
      }

      this.setData({
        zones,
        lastUpdated: formatTime(new Date()),
        maxPressure: strongestZone ? strongestZone.pressure : 0,
        activeCount: activeZones.length,
        postureScore,
        highlightedZone: strongestZone ? strongestZone.name : '等待信号',
        insightText: strongestZone ? getInsightText(strongestZone.name, avgPressure, balance) : '',
      })
    },

    resetSimulationSignal() {
      currentPressureMap = createInitialPressureMap()
      targetPressureMap = createTargetPressureMap(currentPressureMap)
      simulationStep = 0
      this.applyPressureSignal(currentPressureMap)
    },

    generateMockSignal() {
      targetPressureMap = createTargetPressureMap(currentPressureMap)
      this.applyPressureSignal(createRealtimePressureMap())
    },

    startSimulation() {
      if (simulationTimer !== null) return
      this.setData({ isSimulating: true })
      simulationTimer = setInterval(() => {
        simulationStep += 1
        if (simulationStep % 8 === 0) {
          targetPressureMap = createTargetPressureMap(currentPressureMap)
        }
        this.applyPressureSignal(createRealtimePressureMap())
      }, 500)
    },

    stopSimulation() {
      if (simulationTimer !== null) {
        clearInterval(simulationTimer)
        simulationTimer = null
      }
      this.setData({ isSimulating: false })
    },

    toggleSimulation() {
      if (this.data.isSimulating) {
        this.stopSimulation()
        return
      }
      this.generateMockSignal()
      this.startSimulation()
    },

    onDeviceTap() {
      wx.showToast({ title: '设备连接功能开发中', icon: 'none' })
    },
  },
})
