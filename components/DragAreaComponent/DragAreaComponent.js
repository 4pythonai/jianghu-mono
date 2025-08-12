/**
 * 
 * https://github.com/wxp-ui/wxp-ui
 * 
 * 
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
		arrayData: {              // 数据源
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
		uniqueKeyName: {         // 数组中唯一性键的名称
			type: String,
			value: 'id'
		},
		redBlueConfig: {         // 红蓝配置参数
			type: String,
			value: ''
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

			// 如果拖拽结束，确保状态完全重置
			if (!e.dragging) {
				// 延迟重置，确保wxs中的状态也同步
				setTimeout(() => {
					this.setData({
						dragging: false
					});
				}, 50);
			}
		},

		listChange(e) {
			console.log("🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️", e.list)
			console.log("🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️🅰️", this.data.list)
			// this.data.listWxs = e.list;

			const updatedList = e.list.map((item, index) => {
				if (!item.extraNode) {
					// 对于非额外节点，重新计算 abcd 为 realKey
					item.abcd = String(item.realKey + 1);
				}
				return item;
			});

			this.setData({
				list: e.list,        // 更新渲染用的 list
				listWxs: e.list      // 更新 WXS 用的 listWxs
			});
		},

		itemClick(e) {
			const index = e.currentTarget.dataset.index;
			const item = this.data.listWxs[index];

			this.triggerEvent('click', {
				key: item.realKey,
				data: item.data,
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
					dragging: false,
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
		 *  {arrayData, topSize, bottomSize, itemHeight} 参数改变需要手动调用初始化方法
		 */
		init() {
			// 初始必须为true以绑定wxs中的函数,
			this.setData({ dragging: true });

			const delItem = (item, extraNode) => {
				// 确保item存在且是对象
				if (!item || typeof item !== 'object') {
					console.warn('DragAreaComponent: 无效的item数据:', item);
					return null;
				}

				return {
					id: item[this.data.uniqueKeyName] || `item_${Date.now()}_${Math.random()}`,
					extraNode: extraNode,
					fixed: item.fixed || false,
					slot: item.slot || false,
					data: item, // 保存完整的原始数据
					originalIndex: item.originalIndex !== undefined ? item.originalIndex : item.index
				};
			};

			const { arrayData, extraNodes } = this.data;
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
			arrayData.forEach((item, index) => {
				// 为每个item添加原始索引信息
				const itemWithIndex = { ...item, originalIndex: index };

				for (const i of destBefore) {
					if (i?.data?.destKey === index) _list.push(i);
				}

				const processedItem = delItem(itemWithIndex, false);
				if (processedItem) {
					_list.push(processedItem);
				}

				for (const i of destAfter) {
					if (i?.data?.destKey === index) _list.push(i);
				}
			});

			// 过滤掉无效的item
			const validList = _list.filter(item => item !== null);

			let i = 0;
			const columns = this.data.columns;
			const list = (_before.concat(validList, _after) || []).map((item, index) => {
				if (!item) return null;

				item.realKey = item.extraNode ? -1 : i++; // 真实顺序
				item.abcd = String(item.realKey + 1)
				item.sortKey = index; // 整体顺序
				item.tranX = `${(item.sortKey % columns) * 100}%`;
				item.tranY = `${Math.floor(item.sortKey / columns) * 100}%`;
				return item;
			}).filter(item => item !== null);

			this.data.rows = Math.ceil(list.length / columns);

			this.setData({
				list,
				listWxs: list,
				wrapStyle: `height: ${this.data.rows * this.data.itemHeight}rpx`
			});
			if (list.length === 0) return;

			// 异步加载数据时候, 延迟执行 initDom 方法, 防止基础库 2.7.1 版本及以下无法正确获取 dom 信息
			setTimeout(() => this.initDom(), 0);
		},

		// 强制重置拖拽状态
		forceResetDragState() {
			this.setData({
				dragging: false
			});

			// 重新初始化
			setTimeout(() => {
				this.init();
			}, 100);
		},

		// 拖拽结束后的状态同步
		syncDragEndState() {
			// 确保拖拽状态正确重置
			setTimeout(() => {
				this.setData({
					dragging: false
				});
			}, 300);
		}
	},
	ready() {
		this.init();
	}
});
