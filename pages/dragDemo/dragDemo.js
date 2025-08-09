Page({
	data: {
		scrollTop: 0,
		pageMetaScrollTop: 0
	},

	// 拖拽排序结束事件处理
	onSortEnd(e) {
		console.log("页面收到排序结果:", e.detail.listData);
		// 这里可以处理排序结果，比如保存到服务器等
	},

	// 滚动事件处理
	onScroll(e) {
		// 页面级别的滚动处理
		console.log("页面收到滚动事件:", e.detail.scrollTop);
		this.setData({
			pageMetaScrollTop: e.detail.scrollTop
		});
	},

	// 页面滚动
	onPageScroll(e) {
		this.setData({
			scrollTop: e.scrollTop
		});
	},

	onLoad() {
		// 页面加载完成
		console.log("拖拽演示页面加载完成");
	}
});
