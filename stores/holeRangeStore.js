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
        this.holePlayList = JSON.parse(JSON.stringify(normalizedHoles));
        this.roadLength = normalizedHoles.length;


        if (normalizedHoles.length > 0) {
            this.scoreStartIndex = normalizedHoles[0].hindex;
        }
    }),

    /**
     * 设置洞范围（参与游戏的洞）
     * @param {number} startHoleindex 起始洞索引
     */
    setHoleRange: action(function (startHoleindex) {
        console.log('🕳️ [holeRangeStore] 设置起始洞:', startHoleindex);
        this.scoreStartIndex = Number.parseInt(startHoleindex);
    }),

    setRoadLength: action(function (roadLength) {
        console.log('⭕️⭕️⭕️⭕️ [holeRangeStore] 设置道路长度:', { roadLength });
        this.roadLength = roadLength;
    }),

    /**
     * 更新洞顺序列表（用于拖拽排序后）
     * @param {Array} newHolePlayList 新的洞顺序列表
     */
    updateHolePlayList: action(function (newHolePlayList) {
        this.holePlayList = [...newHolePlayList];
        this.roadLength = newHolePlayList.length;
    }),

    /**
     * 从字符串解析并设置洞顺序列表
     * @param {string} holePlayListStr 洞顺序字符串，格式："1,2,3,4"
     */
    setHolePlayListFromString: action(function (holePlayListStr) {
        console.log('🕳️ [holeRangeStore] 从字符串解析洞顺序:', holePlayListStr);

        if (!holePlayListStr || typeof holePlayListStr !== 'string') {
            console.warn('🕳️ [holeRangeStore] 无效的洞顺序字符串');
            return;
        }

        try {
            // 解析洞索引字符串
            const holeIndexes = holePlayListStr.split(',').map(index => Number.parseInt(index.trim()));

            // 根据索引查找对应的洞数据
            const newHolePlayList = holeIndexes.map(hindex => {
                const hole = this.holeList.find(h => h.hindex === hindex);
                if (!hole) {
                    console.warn(`🕳️ [holeRangeStore] 找不到洞索引 ${hindex} 的数据`);
                    return null;
                }
                return hole;
            }).filter(hole => hole);

            // 更新洞顺序列表
            this.updateHolePlayList(newHolePlayList);

            console.log('🕳️ [holeRangeStore] 洞顺序解析完成:', {
                originalString: holePlayListStr,
                parsedHoles: newHolePlayList.length,
                roadLength: this.roadLength
            });

        } catch (error) {
            console.error('🕳️ [holeRangeStore] 解析洞顺序字符串失败:', error);
        }
    }),

    /**
     * 重置洞范围到默认状态
     */
    resetHoleRange: action(function () {
        console.log('🕳️ [holeRangeStore] 重置洞范围到默认状态');

        if (this.holeList.length > 0) {
            this.scoreStartIndex = this.holeList[0].hindex;
            this.roadLength = this.holeList.length;
            this.holePlayList = JSON.parse(JSON.stringify(this.holeList));
        } else {
            this.scoreStartIndex = null;
            this.roadLength = 0;
            this.holePlayList = [];
        }
    }),

    /**
     * 获取当前状态
     */
    getState() {
        return {
            holeList: this.holeList,
            holePlayList: this.holePlayList,
            startHoleindex: this.scoreStartIndex,
            roadLength: this.roadLength
        };
    }
}); 