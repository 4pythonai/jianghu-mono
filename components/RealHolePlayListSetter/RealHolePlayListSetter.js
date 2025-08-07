// RealHolePlayListSetter

Component({
    options: {
        styleIsolation: 'shared',
    },

    properties: {
        // 洞列表数据
        holeList: {
            type: Array,
            value: [],
            observer: function (newVal) {
                if (newVal && newVal.length > 0) {
                    this.initializeData();
                }
            }
        },
        // 起始洞索引
        startHoleindex: {
            type: Number,
            value: null
        },
        // 道路长度（洞数量）
        roadLength: {
            type: Number,
            value: 0
        },
        // 选择类型（start/end）
        selectType: {
            type: String,
            value: null
        },
        // 外部传入的洞顺序字符串
        holePlayListStr: {
            type: String,
            value: '',
            observer: function (newVal) {
                if (newVal) {
                    this.loadExternalHolePlayList(newVal);
                }
            }
        }
    },

    data: {
        holePlayList: [],       // 游戏顺序的洞列表
        displayHoleList: [],    // 用于显示的洞列表（包含所有洞，按顺序排列）
    },

    lifetimes: {
        attached() {
            this.initializeData();
        },
    },

    methods: {
        /**
         * 初始化数据
         */
        initializeData() {
            // 使用传入的 holeList 属性
            const plainHoleList = this.properties.holeList || [];

            // 根据起始洞和道路长度计算洞范围
            const holePlayList = this.calculateHolePlayList(plainHoleList, this.properties.startHoleindex, this.properties.roadLength);

            // 构建显示列表
            const displayHoleList = this.buildDisplayHoleList(plainHoleList, holePlayList);

            this.setData({
                holePlayList: holePlayList,
                displayHoleList: displayHoleList
            });
        },

        /**
         * 根据起始洞和道路长度计算洞范围（环形结构）
         * @param {Array} holeList 所有洞的列表
         * @param {number} startHoleindex 起始洞索引
         * @param {number} roadLength 道路长度
         * @returns {Array} 游戏顺序的洞列表
         */
        calculateHolePlayList(holeList, startHoleindex, roadLength) {
            if (!holeList || holeList.length === 0) {
                return [];
            }

            // 如果没有指定起始洞，使用第一个洞
            const actualStartHoleindex = startHoleindex || holeList[0].hindex;

            // 如果没有指定道路长度，使用所有洞
            const actualRoadLength = roadLength || holeList.length;

            // 找到起始洞在holeList中的位置
            const startIndex = holeList.findIndex(hole => hole.hindex === actualStartHoleindex);
            if (startIndex === -1) {
                console.warn('🕳️ [RealHolePlayListSetter] 找不到起始洞:', actualStartHoleindex);
                return holeList.slice(0, actualRoadLength);
            }

            // 构建环形结构的洞列表
            const result = [];
            for (let i = 0; i < actualRoadLength; i++) {
                const index = (startIndex + i) % holeList.length;
                result.push(holeList[index]);
            }

            return result;
        },

        /**
         * 构建显示列表：包含所有洞，按holePlayList的顺序排列
         * @param {Array} holeList 所有洞的列表
         * @param {Array} holePlayList 游戏顺序的洞列表
         * @returns {Array} 用于显示的洞列表
         */
        buildDisplayHoleList(holeList, holePlayList) {
            if (!holeList || !Array.isArray(holeList)) {
                return [];
            }

            if (!holePlayList || !Array.isArray(holePlayList) || holePlayList.length === 0) {
                // 如果没有holePlayList，按原始顺序显示所有洞
                return holeList.map(hole => ({
                    ...hole,
                    inPlaylist: false
                }));
            }

            // 获取holePlayList中第一个洞的hindex
            const firstHoleHindex = holePlayList[0]?.hindex;

            // 找到第一个洞在holeList中的位置
            const firstHoleIndex = holeList.findIndex(hole => hole.hindex === firstHoleHindex);

            if (firstHoleIndex === -1) {
                // 如果找不到第一个洞，按原始顺序显示
                return holeList.map(hole => ({
                    ...hole,
                    inPlaylist: false
                }));
            }

            // 重新排列holeList，让第一个洞对齐holePlayList的第一个洞
            const reorderedHoleList = [
                ...holeList.slice(firstHoleIndex),
                ...holeList.slice(0, firstHoleIndex)
            ];

            // 构建holePlayList的hindex集合，用于快速判断
            const holePlayListHindexSet = new Set(holePlayList.map(hole => hole.hindex));

            // 为每个洞添加状态标记
            return reorderedHoleList.map(hole => ({
                ...hole,
                inPlaylist: holePlayListHindexSet.has(hole.hindex)
            }));
        },

        onHideModal() {
            this.triggerEvent('cancel');
        },

        onSelectHole(e) {
            const selectType = this.properties.selectType;

            if (selectType === 'start') {
                const hindex = Number(e.currentTarget.dataset.hindex);
                console.log('🕳️ 选择起始洞:', hindex);

                // 重新构建holePlayList，以选中的洞为起始
                const newHolePlayList = this.calculateHolePlayList(this.properties.holeList, hindex, this.properties.roadLength);

                // 重新构建显示列表
                const newDisplayHoleList = this.buildDisplayHoleList(this.properties.holeList, newHolePlayList);

                this.setData({
                    holePlayList: newHolePlayList,
                    displayHoleList: newDisplayHoleList
                });
            }

            if (selectType === 'end') {
                const hindex = Number(e.currentTarget.dataset.hindex);
                console.log('🕳️ 选择终止洞:', hindex);

                // 在displayHoleList中找到终止洞的位置
                const endIndex = this.data.displayHoleList.findIndex(hole => hole.hindex === hindex);

                if (endIndex === -1) {
                    console.warn('🕳️ [RealHolePlayListSetter] 找不到终止洞:', hindex);
                    return;
                }

                // 从displayHoleList中获取从开始到终止洞的所有洞
                const selectedHoles = this.data.displayHoleList.slice(0, endIndex + 1);

                console.log('🕳️ 选择的洞:', selectedHoles.map(h => ({ hindex: h.hindex, holename: h.holename, inPlaylist: h.inPlaylist })));

                // 重新构建显示列表，保持选中状态
                const newDisplayHoleList = this.data.displayHoleList.map((hole, index) => ({
                    ...hole,
                    inPlaylist: index <= endIndex
                }));

                this.setData({
                    holePlayList: selectedHoles,
                    displayHoleList: newDisplayHoleList
                });
            }
        },

        onConfirmHoleOrder() {
            // 触发事件，将结果传递给父组件
            const result = {
                holePlayList: this.data.holePlayList,
                startHoleindex: this.data.holePlayList[0]?.hindex,
                endHoleindex: this.data.holePlayList[this.data.holePlayList.length - 1]?.hindex,
                roadLength: this.data.holePlayList.length
            };

            console.log('🕳️ [RealHolePlayListSetter] 确认洞顺序:', result);

            this.triggerEvent('confirm', result);
            this.triggerEvent('cancel');
        },

        /**
         * 加载外部传入的洞顺序数据
         * @param {string} holePlayListStr 洞顺序字符串
         */
        loadExternalHolePlayList(holePlayListStr) {
            console.log('🕳️ [RealHolePlayListSetter] 加载外部洞顺序数据:', holePlayListStr);

            if (!holePlayListStr || typeof holePlayListStr !== 'string') {
                console.warn('🕳️ [RealHolePlayListSetter] 无效的洞顺序字符串');
                return;
            }

            try {
                // 解析洞索引字符串
                const holeIndexes = holePlayListStr.split(',').map(index => Number.parseInt(index.trim()));

                // 根据索引查找对应的洞数据
                const newHolePlayList = holeIndexes.map(hindex => {
                    const hole = this.properties.holeList.find(h => h.hindex === hindex);
                    if (!hole) {
                        console.warn(`🕳️ [RealHolePlayListSetter] 找不到洞索引 ${hindex} 的数据`);
                        return null;
                    }
                    return hole;
                }).filter(hole => hole);

                // 更新组件内部状态
                const newDisplayHoleList = this.buildDisplayHoleList(this.properties.holeList, newHolePlayList);

                this.setData({
                    holePlayList: newHolePlayList,
                    displayHoleList: newDisplayHoleList
                });

                console.log('🕳️ [RealHolePlayListSetter] 外部洞顺序数据加载完成:', {
                    originalString: holePlayListStr,
                    parsedHoles: newHolePlayList.length
                });

            } catch (error) {
                console.error('🕳️ [RealHolePlayListSetter] 解析外部洞顺序数据失败:', error);
            }
        },

        onCancel() {
            this.triggerEvent('cancel');
        },
    }
}); 