Component({
  data: {
    activeMode: '',
    modes: [
      { id: 'office', name: '办公', desc: '轻度支撑', emoji: '💻' },
      { id: 'sleep', name: '睡眠', desc: '柔和包裹', emoji: '🌙' },
      { id: 'travel', name: '旅行', desc: '稳固贴合', emoji: '✈️' },
      { id: 'relax', name: '放松', desc: '按摩舒缓', emoji: '☕' },
    ],
    airbags: [
      { id: 'leftWing', name: '左侧护翼', value: 50 },
      { id: 'rightWing', name: '右侧护翼', value: 50 },
      { id: 'cervical', name: '后颈承托', value: 60 },
      { id: 'leftBase', name: '左下承托', value: 45 },
      { id: 'rightBase', name: '右下承托', value: 45 },
    ],
    massageOn: false,
    massageMode: 'knead',
    massageModes: [
      { id: 'knead', name: '揉捏' },
      { id: 'tap', name: '敲击' },
      { id: 'vibrate', name: '振动' },
      { id: 'pulse', name: '脉冲' },
    ],
    intensity: 3,
    timerMinutes: 0,
    timerOptions: [15, 30, 45],
    heatingOn: false,
    currentTemp: 28,
    targetTemp: 38,
    tempPresets: [36, 38, 40, 42],
  },
  pageLifetimes: {
    show() {
      if (typeof this.getTabBar === 'function') {
        this.getTabBar().setData({ selected: 1 })
      }
    },
  },
  methods: {
    selectMode(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id
      const modePresets: Record<string, number[]> = {
        office: [40, 40, 55, 35, 35],
        sleep: [60, 60, 70, 50, 50],
        travel: [70, 70, 80, 60, 60],
        relax: [30, 30, 40, 25, 25],
      }
      const preset = modePresets[id] || [50, 50, 60, 45, 45]
      const airbags = this.data.airbags.map((bag, i) => ({
        ...bag,
        value: preset[i],
      }))

      this.setData({
        activeMode: this.data.activeMode === id ? '' : id,
        airbags,
        massageOn: id === 'relax',
        massageMode: id === 'relax' ? 'knead' : this.data.massageMode,
      })
    },

    onAirbagChange(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id
      const value = e.detail.value
      const airbags = this.data.airbags.map((bag) =>
        bag.id === id ? { ...bag, value } : bag
      )
      this.setData({ airbags, activeMode: '' })
    },

    resetAirbags() {
      const airbags = this.data.airbags.map((bag) => ({ ...bag, value: 0 }))
      this.setData({ airbags, activeMode: '' })
    },

    autoAdjust() {
      const airbags = this.data.airbags.map((bag) => ({
        ...bag,
        value: 40 + Math.round(Math.random() * 30),
      }))
      this.setData({ airbags, activeMode: '' })
      wx.showToast({ title: '已根据压力数据智能调节', icon: 'none' })
    },

    toggleMassage(e: WechatMiniprogram.TouchEvent) {
      this.setData({ massageOn: e.detail.value })
    },

    selectMassageMode(e: WechatMiniprogram.TouchEvent) {
      this.setData({ massageMode: e.currentTarget.dataset.id })
    },

    setIntensity(e: WechatMiniprogram.TouchEvent) {
      this.setData({ intensity: e.currentTarget.dataset.level })
    },

    setTimer(e: WechatMiniprogram.TouchEvent) {
      const min = e.currentTarget.dataset.min
      this.setData({ timerMinutes: this.data.timerMinutes === min ? 0 : min })
    },

    toggleHeating(e: WechatMiniprogram.TouchEvent) {
      this.setData({ heatingOn: e.detail.value })
    },

    onTempChange(e: WechatMiniprogram.TouchEvent) {
      this.setData({ targetTemp: e.detail.value })
    },

    setTempPreset(e: WechatMiniprogram.TouchEvent) {
      this.setData({ targetTemp: e.currentTarget.dataset.temp })
    },
  },
})
