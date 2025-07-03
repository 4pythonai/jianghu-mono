Page({
  data: {
    showKoufen: false,
    showDingdong: false,
    showEatmeat: false,
    koufenValue: '',
    dingdongValue: '',
    eatmeatValue: ''
  },
  // 打开弹窗
  onShowKoufen() { this.setData({ showKoufen: true }); },
  onShowDingdong() { this.setData({ showDingdong: true }); },
  onShowEatmeat() { this.setData({ showEatmeat: true }); },
  // 关闭弹窗
  onCloseKoufen() { this.setData({ showKoufen: false }); },
  onCloseDingdong() { this.setData({ showDingdong: false }); },
  onCloseEatmeat() { this.setData({ showEatmeat: false }); },
  // 保存弹窗
  onKoufenConfirm(e) {
    this.setData({
      koufenValue: e.detail.value,
      showKoufen: false
    });
  },
  onDingdongConfirm(e) {
    this.setData({
      dingdongValue: e.detail.value,
      showDingdong: false
    });
  },
  onEatmeatConfirm(e) {
    this.setData({
      eatmeatValue: e.detail.value,
      showEatmeat: false
    });
  },
  onLoad() {
    // 4人8421规则配置页，后续补充
  }
});
