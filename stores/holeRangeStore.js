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
    holePlayList: [],       // 洞顺序列表（按游戏顺序排列）
    rangeHolePlayList: [],  // 参与游戏的洞顺序列表（选中的洞范围）
    startHoleindex: null,   // 参与游戏的第一个洞索引
    endHoleindex: null,     // 参与游戏的最后一个洞索引



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
        this.holePlayList = JSON.parse(JSON.stringify(normalizedHoles));
        this.rangeHolePlayList = JSON.parse(JSON.stringify(normalizedHoles));

        // 设置默认的起始和结束洞索引
        if (normalizedHoles.length > 0) {
            this.startHoleindex = normalizedHoles[0].hindex;
            this.endHoleindex = normalizedHoles[normalizedHoles.length - 1].hindex;
        }

        console.log('🕳️ [holeRangeStore] 洞数据初始化完成:', {
            holeListLength: this.holeList.length,
            holePlayListLength: this.holePlayList.length,
            startHoleindex: this.startHoleindex,
            endHoleindex: this.endHoleindex
        });
    }),

    /**
     * 根据 holePlayListStr 重新设置洞顺序
     * @param {string} holePlayListStr 洞顺序字符串，如 "3,4,5,6,7,8,9,1,2"
     */
    setHolePlayListFromString: action(function (holePlayListStr) {
        console.log('🕳️ [holeRangeStore] 根据字符串设置洞顺序:', holePlayListStr);

        if (!holePlayListStr || !this.holeList.length) {
            console.warn('🕳️ [holeRangeStore] 无效的 holePlayListStr 或 holeList 为空');
            return;
        }

        try {
            // 解析洞索引字符串
            const holeIndexes = holePlayListStr.split(',').map(index => Number.parseInt(index.trim()));

            // 根据索引重新排序洞列表
            const newHolePlayList = holeIndexes.map(hindex => {
                const hole = this.holeList.find(h => h.hindex === hindex);
                return hole || { hindex, holename: `B${hindex}` };
            }).filter(hole => hole);

            this.holePlayList = newHolePlayList;

            console.log('🕳️ [holeRangeStore] 洞顺序设置完成:', {
                holeIndexes,
                newHolePlayList: newHolePlayList.map(h => ({ hindex: h.hindex, holename: h.holename }))
            });
        } catch (error) {
            console.error('🕳️ [holeRangeStore] 解析 holePlayListStr 失败:', error);
        }
    }),

    /**
     * 设置洞范围（参与游戏的洞）
     * @param {number} startHoleindex 起始洞索引
     * @param {number} endHoleindex 结束洞索引
     */
    setHoleRange: action(function (startHoleindex, endHoleindex) {
        console.log('🕳️ [holeRangeStore] 设置洞范围:', { startHoleindex, endHoleindex });

        if (startHoleindex === undefined || endHoleindex === undefined) {
            console.warn('🕳️ [holeRangeStore] 无效的洞范围参数');
            return;
        }

        this.startHoleindex = Number.parseInt(startHoleindex);
        this.endHoleindex = Number.parseInt(endHoleindex);

        // 确保 startHoleindex <= endHoleindex
        const minIndex = Math.min(this.startHoleindex, this.endHoleindex);
        const maxIndex = Math.max(this.startHoleindex, this.endHoleindex);

        // 从 holePlayList 中找到对应范围的洞
        const rangeHolePlayList = this.holePlayList.filter(hole => {
            const hindex = hole.hindex;
            return hindex >= minIndex && hindex <= maxIndex;
        });

        this.rangeHolePlayList = rangeHolePlayList;

        console.log('🕳️ [holeRangeStore] 洞范围设置完成:', {
            startHoleindex: this.startHoleindex,
            endHoleindex: this.endHoleindex,
            rangeHolePlayList: rangeHolePlayList.map(h => ({ hindex: h.hindex, holename: h.holename }))
        });
    }),

    /**
     * 更新洞顺序列表（用于拖拽排序后）
     * @param {Array} newHolePlayList 新的洞顺序列表
     */
    updateHolePlayList: action(function (newHolePlayList) {
        console.log('🕳️ [holeRangeStore] 更新洞顺序列表:', newHolePlayList);

        if (!newHolePlayList || !Array.isArray(newHolePlayList)) {
            console.warn('🕳️ [holeRangeStore] 无效的洞顺序列表');
            return;
        }

        this.holePlayList = [...newHolePlayList];

        // 重新计算 rangeHolePlayList（基于当前的 startHoleindex 和 endHoleindex）
        if (this.startHoleindex !== null && this.endHoleindex !== null) {
            const minIndex = Math.min(this.startHoleindex, this.endHoleindex);
            const maxIndex = Math.max(this.startHoleindex, this.endHoleindex);

            const rangeHolePlayList = this.holePlayList.filter(hole => {
                const hindex = hole.hindex;
                return hindex >= minIndex && hindex <= maxIndex;
            });

            this.rangeHolePlayList = rangeHolePlayList;
        }

        console.log('🕳️ [holeRangeStore] 洞顺序列表更新完成:', {
            holePlayListLength: this.holePlayList.length,
            rangeHolePlayListLength: this.rangeHolePlayList.length
        });
    }),

    /**
     * 重置洞范围到默认状态
     */
    resetHoleRange: action(function () {
        console.log('🕳️ [holeRangeStore] 重置洞范围');

        if (this.holeList.length > 0) {
            this.holePlayList = JSON.parse(JSON.stringify(this.holeList));
            this.rangeHolePlayList = JSON.parse(JSON.stringify(this.holeList));
            this.startHoleindex = this.holeList[0].hindex;
            this.endHoleindex = this.holeList[this.holeList.length - 1].hindex;
        }
    }),

    /**
     * 清空所有洞数据
     */
    clear: action(function () {
        console.log('🕳️ [holeRangeStore] 清空洞数据');

        this.holeList = [];
        this.holePlayList = [];
        this.rangeHolePlayList = [];
        this.startHoleindex = null;
        this.endHoleindex = null;
    }),

    /**
     * 获取当前状态
     */
    getState() {
        return {
            holeList: this.holeList,
            holePlayList: this.holePlayList,
            rangeHolePlayList: this.rangeHolePlayList,
            startHoleindex: this.startHoleindex,
            endHoleindex: this.endHoleindex
        };
    },


}); 