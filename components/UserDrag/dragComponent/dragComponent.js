/**
 * 版本号比较
 */
const compareVersion = (v1, v2) => {
	const v1Parts = v1.split('.')
	const v2Parts = v2.split('.')
	const len = Math.max(v1Parts.length, v2Parts.length)

	while (v1Parts.length < len) {
		v1Parts.push('0')
	}
	while (v2Parts.length < len) {
		v2Parts.push('0')
	}

	for (let i = 0; i < len; i++) {
		const num1 = Number.parseInt(v1Parts[i])
		const num2 = Number.parseInt(v2Parts[i])

		if (num1 > num2) {
			return 1
		}
		if (num1 < num2) {
			return -1
		}
	}

	return 0
}

Component({
	externalClasses: ['item-wrap-class'],
	options: {
		multipleSlots: true
	},
	properties: {
		extraNodes: {            // 额外节点
			type: Array,
			value: []
		},
		userList: {              // 用户数据源
			type: Array,
			value: []
		},
		columns: {               // 列数
			type: Number,
			value: 1
		},
		topSize: {               // 顶部固定高度
			type: Number,
			value: 0
		},
		bottomSize: {            // 底部固定高度
			type: Number,
			value: 0
		},
		itemHeight: {            // 每个 item 高度, 用于计算 item-wrap 高度
			type: Number,
			value: 0
		},
		scrollTop: {             // 页面滚动高度
			type: Number,
			value: 0
		},
		redBlueConfig: {         // 红蓝分组配置
			type: String,
			value: '4_固拉'
		},
	},
	data: {
		/* 未渲染数据 */
		baseData: {},
		pageMetaSupport: false,                                 // 当前版本是否支持 page-meta 标签
		platform: '',                                           // 平台信息
		listWxs: [],                                            // wxs 传回的最新 list 数据
		rows: 0,                                                // 行数

		/* 渲染数据 */
		wrapStyle: '',                                          // item-wrap 样式
		list: [],                                               // 渲染数据列
		dragging: false,
	},

	observers: {
		'userList': function (newUserList) {
			console.log('🔄 DragComponent userList 变化:', newUserList);
			if (newUserList && newUserList.length > 0) {
				// 直接调用init，让init方法自己处理状态
				this.init();
			}
		}
	},


	methods: {
		vibrate() {
			if (this.data.platform !== "devtools") wx.vibrateShort();
		},
		pageScroll(e) {
			if (this.data.pageMetaSupport) {
				this.triggerEvent("scroll", {
					scrollTop: e.scrollTop
				});
			} else {
				wx.pageScrollTo({
					scrollTop: e.scrollTop,
					duration: 300
				});
			}
		},
		drag(e) {
			this.setData({
				dragging: e.dragging
			})
		},
		listChange(e) {
			this.data.listWxs = e.list;

			// 排序完成后打印数组内容
			if (e.list && e.list.length > 0) {
				console.log('🔄 拖拽排序完成 - 当前数组顺序:');
				e.list.forEach((item, index) => {
					if (!item.extraNode) {
						const userData = item.data || {};
						console.log(`位置${index + 1}: ${userData.nickname || userData.wx_nickname || '未知用户'} (userid: ${userData.userid}) [sortKey:${item.sortKey}]`);
					}
				});
			}
		},
		itemClick(e) {
			const index = e.currentTarget.dataset.index;
			const item = this.data.listWxs[index];

			// 防止 item 为 undefined 导致的错误
			if (!item) {
				console.warn('UserDrag itemClick: item is undefined, index:', index);
				return;
			}

			this.triggerEvent('click', {
				key: item.realKey || '',
				data: item.data || {},
				extra: e.detail
			});
		},
		/**
		 *  初始化获取 dom 信息
		 */
		initDom() {
			const { windowWidth, windowHeight, platform, SDKVersion } = wx.getSystemInfoSync();
			const remScale = (windowWidth || 375) / 375;

			this.data.pageMetaSupport = compareVersion(SDKVersion, '2.9.0') >= 0;
			this.data.platform = platform;

			const baseData = {};
			baseData.windowHeight = windowHeight;
			baseData.realTopSize = this.data.topSize * remScale / 2;
			baseData.realBottomSize = this.data.bottomSize * remScale / 2;
			baseData.columns = this.data.columns;
			baseData.rows = this.data.rows;

			const query = this.createSelectorQuery();
			query.select(".item").boundingClientRect();
			query.select(".item-wrap").boundingClientRect();
			query.exec((res) => {
				baseData.itemWidth = res[0].width;
				baseData.itemHeight = res[0].height;
				baseData.wrapLeft = res[1].left;
				baseData.wrapTop = res[1].top + this.data.scrollTop;
				this.setData({
					baseData
				});
			});
		},
		/**
		 * column 改变时候需要清空 list, 以防页面溢出
		 */
		columnChange() {
			this.setData({
				list: []
			})
			this.init();
		},
		/**
		 *  初始化函数
		 *  {listData, topSize, bottomSize, itemHeight} 参数改变需要手动调用初始化方法
		 */
		init() {
			// 初始必须为true以绑定wxs中的函数
			this.setData({ dragging: true });

			const delItem = (item, extraNode) => ({
				id: item.userid || item.hindex || item.id || Math.random(),
				extraNode: extraNode,
				fixed: item.fixed,
				slot: item.slot,
				data: item
			});

			// 确保使用最新的userList数据
			const userList = this.data.userList || this.properties.userList || [];
			const extraNodes = this.data.extraNodes || this.properties.extraNodes || [];

			console.log('🔄 DragComponent init 开始，userList:', userList);

			const _list = [];
			const _before = [];
			const _after = [];
			const destBefore = [];
			const destAfter = [];

			extraNodes.forEach((item, index) => {
				if (item.type === "before") {
					_before.push(delItem(item, true));
				} else if (item.type === "after") {
					_after.push(delItem(item, true));
				} else if (item.type === "destBefore") {
					destBefore.push(delItem(item, true));
				} else if (item.type === "destAfter") {
					destAfter.push(delItem(item, true));
				}
			});

			// 遍历数据源增加扩展项, 以用作排序使用
			userList.forEach((item, index) => {
				for (const i of destBefore) {
					if (i.data.destKey === index) _list.push(i);
				}
				const processedItem = delItem(item, false);
				_list.push(processedItem);
				for (const i of destAfter) {
					if (i.data.destKey === index) _list.push(i);
				}
			});

			let i = 0;
			const columns = this.data.columns;
			const list = (_before.concat(_list, _after) || []).map((item, index) => {
				item.realKey = item.extraNode ? -1 : i++; // 真实顺序
				item.sortKey = index; // 整体顺序
				item.tranX = `${(item.sortKey % columns) * 100}%`;
				item.tranY = `${Math.floor(item.sortKey / columns) * 100}%`;
				return item;
			});

			this.data.rows = Math.ceil(list.length / columns);

			const wrapHeight = this.data.rows * this.data.itemHeight;

			console.log('🔄 DragComponent init 完成，list:', list);

			this.setData({
				list,
				listWxs: list,
				wrapStyle: `height: ${wrapHeight}rpx`
			});

			if (list.length === 0) {
				return;
			}

			// 异步加载数据时候, 延迟执行 initDom 方法, 防止基础库 2.7.1 版本及以下无法正确获取 dom 信息
			setTimeout(() => this.initDom(), 0);
		}
	},
	ready() {
		this.init();
	}
});
