const app = getApp()

let listData = [
	{ hindex: 0, holename: "第1洞" },
	{ hindex: 1, holename: "第2洞" },
	{ hindex: 2, holename: "第3洞" },
	{ hindex: 3, holename: "第4洞" },
	{ hindex: 4, holename: "第5洞" },
	{ hindex: 5, holename: "第6洞" },
	{ hindex: 6, holename: "第7洞" },
	{ hindex: 7, holename: "第8洞" },
	{ hindex: 8, holename: "第9洞" },
	{ hindex: 9, holename: "第10洞" },
	{ hindex: 10, holename: "第11洞" },
	{ hindex: 11, holename: "第12洞" },
	{ hindex: 12, holename: "第13洞" },
	{ hindex: 13, holename: "第14洞" },
	{ hindex: 14, holename: "第15洞" },
	{ hindex: 15, holename: "第16洞" },
	{ hindex: 16, holename: "第17洞" },
	{ hindex: 17, holename: "第18洞" }
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
