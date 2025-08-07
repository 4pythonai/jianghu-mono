// HoleRangeSelector 组件 - 起点洞与终点洞选择器

import { holeRangeStore } from '../../../../stores/holeRangeStore';
import { gameStore } from '../../../../stores/gameStore';
import { autorun } from 'mobx-miniprogram';
import { toJS } from 'mobx-miniprogram';

Component({
    properties: {
        // 道路长度
        roadLength: {
            type: null, // 允许任何类型
            value: 0,
            observer: function (newVal, oldVal) {
                console.log('🕳️ [HoleRangeSelector] roadLength 属性变化:', { newVal, oldVal, type: typeof newVal });
                // 直接更新组件数据
                if (newVal !== oldVal) {
                    const numVal = newVal ? Number(newVal) : 0;
                    this.setData({ roadLength: numVal });
                    // 重新更新洞显示
                    this.updateHoleDisplayFromProperties();
                }
            }
        },
        // 起始洞索引
        startHoleindex: {
            type: null, // 允许任何类型
            value: null,
            observer: function (newVal, oldVal) {
                console.log('🕳️ [HoleRangeSelector] startHoleindex 属性变化:', { newVal, oldVal, type: typeof newVal });
                // 直接更新组件数据
                if (newVal !== oldVal) {
                    const numVal = newVal ? Number(newVal) : null;
                    this.setData({ startHoleindex: numVal });
                    // 重新更新洞显示
                    this.updateHoleDisplayFromProperties();
                }
            }
        }
    },

    lifetimes: {
        attached() {
            console.log('🕳️ [HoleRangeSelector] 组件初始化，属性值:', {
                roadLength: this.properties.roadLength,
                startHoleindex: this.properties.startHoleindex
            });

            // 直接从 gameStore 获取洞数据
            const holeList = gameStore.gameData?.holeList || [];
            console.log("🕳️ [HoleRangeSelector] 从 gameStore 获取的 holeList:", toJS(holeList));

            // 直接从 properties 获取参数，并确保类型转换
            const startHoleindex = this.properties.startHoleindex ? Number(this.properties.startHoleindex) : null;
            const roadLength = this.properties.roadLength ? Number(this.properties.roadLength) : 0;

            this.updateHoleDisplay(holeList, startHoleindex, roadLength);

            this.disposer = autorun(() => {
                // 直接从 gameStore 获取最新的洞数据
                const currentHoleList = gameStore.gameData?.holeList || [];
                // 从 properties 获取最新的参数值，并确保类型转换
                const currentStartHoleindex = this.properties.startHoleindex ? Number(this.properties.startHoleindex) : null;
                const currentRoadLength = this.properties.roadLength ? Number(this.properties.roadLength) : 0;
                this.updateHoleDisplay(currentHoleList, currentStartHoleindex, currentRoadLength);
            });
        },
        detached() {
            this.disposer?.();
        }
    },
    data: {
        holeList: [],
        ifShowModal: false,
        startHoleindex: null,
        endHoleindex: null,
        selectType: null, // 新增：记录当前选择类型（start/end）
        startHole: null,  // 起始洞信息
        endHole: null,     // 终止洞信息
        roadLength: 0
    },
    methods: {
        /**
         * 更新洞显示信息
         * @param {Array} holeList 洞列表
         * @param {number} startHoleindex 起始洞索引
         * @param {number} roadLength 长度
         */
        updateHoleDisplay(holeList, startHoleindex, roadLength) {
            // 确保参数是数字类型
            const numStartHoleindex = startHoleindex ? Number(startHoleindex) : null;
            const numRoadLength = roadLength ? Number(roadLength) : 0;

            console.log("🕳️ [HoleRangeSelector] updateHoleDisplay 参数:", {
                startHoleindex: numStartHoleindex,
                roadLength: numRoadLength,
                holeListLength: holeList?.length,
                holeList: holeList?.slice(0, 3) // 只显示前3个洞的信息
            });

            // 检查 holeList 的结构
            if (holeList && holeList.length > 0) {
                console.log("🕳️ [HoleRangeSelector] 第一个洞的结构:", holeList[0]);
                console.log("🕳️ [HoleRangeSelector] 所有洞的 hindex:", holeList.map(h => h.hindex));
            }

            const startHole = numStartHoleindex && holeList.length ?
                holeList.find(hole => hole.hindex === numStartHoleindex) : null;

            console.log("🕳️ [HoleRangeSelector] 找到的 startHole:", startHole);

            // 将 holeList 当作环形结构，从 startHoleindex 开始往后寻找第 roadLength 个洞作为 endHole
            let endHole = null;
            if (numStartHoleindex && holeList.length && numRoadLength > 0) {
                const startIndex = holeList.findIndex(hole => hole.hindex === numStartHoleindex);
                console.log("🕳️ [HoleRangeSelector] startIndex:", startIndex);
                if (startIndex !== -1) {
                    // 计算结束洞的索引（环形结构）
                    const endIndex = (startIndex + numRoadLength - 1) % holeList.length;
                    endHole = holeList[endIndex];
                    console.log("🕳️ [HoleRangeSelector] endIndex:", endIndex, "endHole:", endHole);
                }
            }

            // 保留当前的 ifShowModal 状态，避免被覆盖
            const currentIfShowModal = this.data.ifShowModal;

            console.log("🕳️ [HoleRangeSelector] 设置数据:", {
                startHole: startHole?.holename,
                endHole: endHole?.holename,
                roadLength: numRoadLength,
                ifShowModal: currentIfShowModal
            });

            this.setData({
                holeList,
                startHoleindex: numStartHoleindex,
                startHole,
                endHole,
                roadLength: numRoadLength,
                ifShowModal: currentIfShowModal // 保持模态框状态
            });
        },

        onSlectStartModal(e) {
            // 获取点击的data-type
            const dataType = e.currentTarget.dataset.type;

            // 从 properties 获取当前的起始洞和道路长度，并确保类型转换
            const startHoleindex = this.properties.startHoleindex ? Number(this.properties.startHoleindex) : null;
            const roadLength = this.properties.roadLength ? Number(this.properties.roadLength) : 0;

            console.log('🕳️ [HoleRangeSelector] 点击起始洞，设置模态框:', {
                ifShowModal: true,
                startHoleindex,
                selectType: dataType,
                roadLength
            });

            // 强制设置模态框为显示状态
            this.setData({
                ifShowModal: true,
                startHoleindex,
                selectType: dataType,
                roadLength
            });

            // 添加调试信息
            console.log('🕳️ [HoleRangeSelector] setData 后检查 ifShowModal:', this.data.ifShowModal);
        },

        onSelectEndModal(e) {
            // 获取点击的data-type
            const dataType = e.currentTarget.dataset.type;

            // 从 properties 获取当前的起始洞和道路长度，并确保类型转换
            const startHoleindex = this.properties.startHoleindex ? Number(this.properties.startHoleindex) : null;
            const roadLength = this.properties.roadLength ? Number(this.properties.roadLength) : 0;

            console.log('🕳️ [HoleRangeSelector] 点击终止洞，设置模态框:', {
                ifShowModal: true,
                startHoleindex,
                selectType: dataType,
                roadLength
            });

            // 强制设置模态框为显示状态
            this.setData({
                ifShowModal: true,
                startHoleindex,
                selectType: dataType,
                roadLength
            });

            // 添加调试信息
            console.log('🕳️ [HoleRangeSelector] setData 后检查 ifShowModal:', this.data.ifShowModal);
        },

        onModalCancel(e) {
            this.setData({ ifShowModal: false });
        },

        /**
         * 处理RealHolePlayListSetter的确认事件
         * @param {Object} e 事件对象
         */
        onModalConfirm(e) {
            const result = e.detail;
            console.log('🕳️ [HoleRangeSelector] 收到洞顺序确认:', result);

            // 更新holeRangeStore
            if (result.holePlayList) {
                holeRangeStore.updateHolePlayList(result.holePlayList);
            }
            if (result.roadLength) {
                holeRangeStore.setRoadLength(result.roadLength);
            }
            if (result.startHoleindex && result.endHoleindex) {
                holeRangeStore.setHoleRange(result.startHoleindex, result.endHoleindex);
            }

            this.setData({ ifShowModal: false });
        },

        // 从属性更新洞显示
        updateHoleDisplayFromProperties() {
            // 直接从 gameStore 获取洞数据
            const holeList = gameStore.gameData?.holeList || [];

            // 从 properties 获取最新的参数值，并确保类型转换
            const startHoleindex = this.properties.startHoleindex ? Number(this.properties.startHoleindex) : null;
            const roadLength = this.properties.roadLength ? Number(this.properties.roadLength) : 0;

            console.log('🕳️ [HoleRangeSelector] updateHoleDisplayFromProperties:', {
                startHoleindex,
                roadLength,
                holeListLength: holeList.length
            });

            this.updateHoleDisplay(holeList, startHoleindex, roadLength);
        },

        // 获取当前配置（用于外部收集配置）
        getConfig() {
            const { startHoleindex, endHoleindex } = this.data;

            // 从 holeRangeStore 获取 holePlayListStr
            const { holePlayList } = holeRangeStore.getState();
            const holePlayListStr = holePlayList.map(hole => hole.hindex).join(',');

            return {
                startHoleindex: startHoleindex,
                endHoleindex: endHoleindex,
                holePlayListStr: holePlayListStr
            };
        }
    }
}); 