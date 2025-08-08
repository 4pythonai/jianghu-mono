const app = getApp()

let listData = [
	{ hindex: 0, holename: "A1" },
	{ hindex: 1, holename: "A2" },
	{ hindex: 2, holename: "A3" },
	{ hindex: 3, holename: "A4" },
	{ hindex: 4, holename: "A5" },
	{ hindex: 5, holename: "A6" },
	{ hindex: 6, holename: "A7" },
	{ hindex: 7, holename: "A8" },
	{ hindex: 8, holename: "A9" },
	{ hindex: 9, holename: "B1" },
	{ hindex: 10, holename: "B2" },
	{ hindex: 11, holename: "B3" },
	{ hindex: 12, holename: "B4" },
	{ hindex: 13, holename: "B5" },
	{ hindex: 14, holename: "B6" },
	{ hindex: 15, holename: "B7" },
	{ hindex: 16, holename: "B8" },
	{ hindex: 17, holename: "B9" }
];

Page({
	data: {
		isIphoneX: app.globalData.isIphoneX,
		size: 9,
		listData: [],
		extraNodes: [],
		pageMetaScrollTop: 0,
		scrollTop: 0
	},
	sortEnd(e) {
		console.log("sortEnd", e.detail.listData)
		this.setData({
			listData: e.detail.listData
		});
	},
	change(e) {
		console.log("change", e.detail.listData)
	},

	itemClick(e) {
		console.log(e);
	},


	scroll(e) {
		this.setData({
			pageMetaScrollTop: e.detail.scrollTop
		})
	},
	// 页面滚动
	onPageScroll(e) {
		this.setData({
			scrollTop: e.scrollTop
		});
	},
	onLoad() {
		this.drag = this.selectComponent('#drag');
		// 模仿异步加载数据
		setTimeout(() => {
			this.setData({
				listData: listData
			});
			this.drag.init();
		}, 100)
	}
})
