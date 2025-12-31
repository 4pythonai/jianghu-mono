// holeRangeStore - 洞范围管理 Store
import { observable, action } from 'mobx-miniprogram'
import { normalizeHole } from '../utils/gameUtils'

/**
 * 洞范围管理 Store
 * 负责管理洞信息、洞顺序、洞范围等所有洞相关的状态
 */
export const holeRangeStore = observable({
    // ---- 洞相关状态 ----
    holeList: [],           // 洞信息列表（原始洞数据）
    scoreStartIndex: null,
    roadLength: 0,

    /**
     * 初始化洞数据
     * @param {Array} holeList 原始洞数据
     */
    initializeHoles: action(function (holeList) {
        console.log('🕳️ [holeRangeStore] 初始化洞数据:', holeList?.length);

        if (!holeList || !Array.isArray(holeList)) {
            console.warn('🕳️ [holeRangeStore] 无效的洞数据');
            return;
        }

        // 标准化洞数据
        const normalizedHoles = holeList.map((h, index) => normalizeHole(h, index + 1));

        this.holeList = normalizedHoles;
        this.roadLength = normalizedHoles.length;


        if (normalizedHoles.length > 0) {
            this.scoreStartIndex = normalizedHoles[0].hindex;
        }
    }),

    /**
     * 设置洞范围（参与游戏的洞）
     * @param {number} startHoleindex 起始洞索引
     */
    setStartIndex: action(function (startHoleindex) {
        console.log('🕳️ [holeRangeStore] 设置起始洞:', startHoleindex);
        this.scoreStartIndex = Number.parseInt(startHoleindex);
    }),

    setRoadLength: action(function (roadLength) {
        console.log('⭕️⭕️⭕️⭕️ [holeRangeStore] 设置道路长度:', { roadLength });
        this.roadLength = roadLength;
    }),



    resetHoleRange: action(function () {
        console.log('🕳️ [holeRangeStore] 重置洞范围到默认状态');

        if (this.holeList.length > 0) {
            this.scoreStartIndex = this.holeList[0].hindex;
            this.roadLength = this.holeList.length;
        } else {
            this.scoreStartIndex = null;
            this.roadLength = 0;
        }
    }),

    /**
     * 清空洞数据
     */
    clear: action(function () {
        this.holeList = []
        this.scoreStartIndex = null
        this.roadLength = 0
    }),

    /**
     * 获取当前状态
     */
    getState() {
        return {
            holeList: this.holeList,
            startHoleindex: this.scoreStartIndex,
            roadLength: this.roadLength
        };
    }
}); 