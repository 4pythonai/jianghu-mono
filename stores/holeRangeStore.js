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
    scoreEndIndex: null,
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

        // 设置默认的起始和结束洞索引
        if (normalizedHoles.length > 0) {
            this.scoreStartIndex = normalizedHoles[0].hindex;
            this.scoreEndIndex = normalizedHoles[normalizedHoles.length - 1].hindex;
        }

        console.log('⭕️⭕️ [holeRangeStore] 洞数据初始化完成:⭕️⭕️', {
            holeListLength: this.holeList.length,
            holePlayListLength: this.holePlayList.length,
            scoreStartIndex: this.scoreStartIndex,
            scoreEndIndex: this.scoreEndIndex,
            roadLength: this.roadLength
        });
    }),

    /**
     * 设置洞范围（参与游戏的洞）
     * @param {number} startHoleindex 起始洞索引
     * @param {number} endHoleindex 结束洞索引
     */
    setHoleRange: action(function (startHoleindex, endHoleindex) {
        console.log('⭕️⭕️⭕️⭕️  [holeRangeStore] 设置洞范围:', { startHoleindex, endHoleindex });

        if (startHoleindex === undefined || endHoleindex === undefined) {
            console.warn(' ⭕️⭕️  [holeRangeStore] 无效的洞范围参数');
            return;
        }

        this.scoreStartIndex = Number.parseInt(startHoleindex);
        this.scoreEndIndex = Number.parseInt(endHoleindex);

        // 计算并设置 roadLength - 当前范围内的洞数量
        // const currentRangeHoles = this.getCurrentRangeHoles();

        console.log('⭕️⭕️⭕️⭕️ [holeRangeStore] 洞范围设置完成:', {
            scoreStartIndex: this.scoreStartIndex,
            scoreEndIndex: this.scoreEndIndex,
            roadLength: this.roadLength
        });
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

        // if (!newHolePlayList || !Array.isArray(newHolePlayList)) {
        //     console.warn('⭕️⭕️ ⭕️⭕️ [holeRangeStore] 无效的洞顺序列表');
        //     return;
        // }

        this.holePlayList = [...newHolePlayList];

        // 自动更新 roadLength - 使用洞顺序列表的长度
        this.roadLength = newHolePlayList.length;

        console.log(' ⭕️⭕️ ⭕️⭕️ [holeRangeStore] 洞顺序列表更新完成:', {
            totalHoles: newHolePlayList.length,
            roadLength: this.roadLength
        });
    }),




    /**
     * 获取当前状态
     */
    getState() {
        return {
            holeList: this.holeList,
            holePlayList: this.holePlayList,
            startHoleindex: this.scoreStartIndex,
            endHoleindex: this.scoreEndIndex,
            roadLength: this.roadLength
        };
    }
}); 