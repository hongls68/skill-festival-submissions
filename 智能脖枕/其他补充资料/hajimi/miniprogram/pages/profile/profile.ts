Component({
  data: {
    useDays: 28,
    totalWear: '86h',
    totalMassage: 34,
    improvement: '23%',
    batteryLevel: 78,
    bodyInfo: [
      { label: '身高', value: '170 cm' },
      { label: '体重', value: '65 kg' },
      { label: '颈围', value: '36 cm' },
      { label: '颈椎状况', value: '轻度不适' },
    ],
    settings: [
      { label: '提醒设置', icon: 'bell' },
      { label: '蓝牙管理', icon: 'bluetooth' },
      { label: '数据隐私', icon: 'shield' },
      { label: '帮助与反馈', icon: 'help' },
      { label: '关于产品', icon: 'info' },
    ],
  },
  pageLifetimes: {
    show() {
      if (typeof this.getTabBar === 'function') {
        this.getTabBar().setData({ selected: 3 })
      }
    },
  },
  methods: {
    onEditBody() {
      wx.showToast({ title: '编辑功能开发中', icon: 'none' })
    },
    onSettingTap() {
      wx.showToast({ title: '设置页面开发中', icon: 'none' })
    },
  },
})
