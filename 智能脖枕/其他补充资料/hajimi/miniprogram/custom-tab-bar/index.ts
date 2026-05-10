Component({
  data: {
    selected: 0,
    list: [
      { pagePath: "/pages/index/index", text: "首页", icon: "home" },
      { pagePath: "/pages/control/control", text: "控制", icon: "control" },
      { pagePath: "/pages/health/health", text: "健康", icon: "health" },
      { pagePath: "/pages/profile/profile", text: "我的", icon: "user" },
    ],
  },
  methods: {
    switchTab(e: WechatMiniprogram.TouchEvent) {
      const idx = e.currentTarget.dataset.index
      const url = this.data.list[idx].pagePath
      wx.switchTab({ url })
    },
  },
})
