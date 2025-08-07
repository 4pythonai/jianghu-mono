import { observable, action } from 'mobx-miniprogram'
import gameApi from '../api/modules/game' // 导入整个默认导出的对象
import {
    normalizePlayer,
    normalizeHole,
    normalizeScore,
    normalizeScoreCards,
    formatScore,
    formatPutts,
    formatDiff,
    getScoreClass
} from '../utils/gameUtils'
import { scoreStore } from './scoreStore'
import { holeRangeStore } from './holeRangeStore'


export const gameStore = observable({

    gameid: null,
    groupId: null,
    gameData: null,      // 原始游戏数据
    players: [],         // 玩家列表
    red_blue: [],        // 红蓝分组数据
    kickConfigs: [], // 新增：运行时倍数数据

    loading: false,      // 加载状态
    error: null,         // 错误信息
    isSaving: false,     // 保存状态

    // holePlayList: [],



    // 根据 groupId 过滤玩家
    _filterPlayersByGroup: action((players, groupId) => {
        if (!groupId) {
            console.log(' [Store] 无 groupId, 返回所有玩家');
            return players;
        }

        const filteredPlayers = players.filter(player => {
            const playerGroupId = String(player.groupid);
            const targetGroupId = String(groupId);
            return playerGroupId === targetGroupId;
        });

        return filteredPlayers;
    }),


    _processGameData: action(function (gameInfo, groupId = null) {

        const allPlayers = (gameInfo.players || []).map(p => normalizePlayer(p));
        const players = this._filterPlayersByGroup(allPlayers, groupId);
        const holeList = (gameInfo.holeList || []).map((h, index) => normalizeHole(h, index + 1));
        const scoreMap = new Map();
        for (const s of gameInfo.scores || []) {
            const key = `${s.userid}_${s.holeid}`;
            scoreMap.set(key, normalizeScore(s));
        }

        scoreStore.scores = gameInfo.scores || [];


        // 标准化score_cards中的数据
        if (gameInfo.score_cards) {
            normalizeScoreCards(gameInfo.score_cards);
        }


        // 先更新基础数据
        this.gameData = gameInfo;
        this.players = players;  // 注意:这里是过滤后的玩家
        this.groupId = groupId;  // 存储当前分组ID

        // 初始化 holeRangeStore 的洞数据
        holeRangeStore.initializeHoles(holeList);
    }),


    setSaving: action(function (status) {
        this.isSaving = status;
    }),

    // 更新运行时倍数配置
    updateRuntimeMultipliers: action(function (configId, kickConfig) {
        console.log('[gameStore] 更新运行时倍数配置:', { configId, kickConfig });
        console.log('[gameStore] 更新前的 kickConfigs:', this.kickConfigs);

        // 查找匹配的配置项
        const existingIndex = this.kickConfigs.findIndex(runtime =>
            String(runtime.runtime_id) === String(configId)
        );

        console.log('[gameStore] 查找结果 - existingIndex:', existingIndex);

        if (existingIndex !== -1) {
            // 更新现有配置
            this.kickConfigs[existingIndex].kickConfig = kickConfig;
            console.log('[gameStore] 更新现有配置:', this.kickConfigs[existingIndex]);
        } else {
            // 新增配置
            this.kickConfigs.push({
                runtime_id: configId,
                kickConfig: kickConfig
            });
            console.log('[gameStore] 新增配置:', this.kickConfigs[this.kickConfigs.length - 1]);
        }

        console.log('[gameStore] 更新后的 kickConfigs:', this.kickConfigs);
    }),

    // 从API获取并初始化游戏数据
    fetchGameDetail: action(async function (gameId, groupId = null) {
        if (this.loading) return; // 防止重复加载

        this.loading = true;
        this.error = null;
        this.gameid = gameId;
        this.groupId = groupId;  // 存储分组ID

        try {
            // 构建请求参数
            const params = { gameId };
            params.groupId = groupId;

            const res = await gameApi.getGameDetail(params, {
                loadingTitle: '加载比赛详情...',
                loadingMask: true
            });

            if (res?.code === 200 && res.game_detail) {
                // ** 调用私有方法处理数据 **
                this._processGameData(res.game_detail, groupId);
                this.red_blue = res.red_blue || [];
                this.kickConfigs = res.kickConfigs || []; // 存储运行时倍数


                return res; // 关键：返回原始接口数据，包含red_blue
            }

            throw new Error(res?.msg || '获取比赛详情失败');
        } catch (err) {
            console.error('❌ [Store] 获取比赛详情失败:', err);
            this.error = err.message || '获取数据失败';
            throw err;
        } finally {
            this.loading = false;
            console.log(' [Store] 获取流程结束');
        }
    }),



    // 格式化分数显示
    formatScore: action((score, par) => {
        return formatScore(score, par);
    }),

    // 格式化推杆显示
    formatputts: action((putts) => {
        return formatPutts(putts);
    }),

    // 格式化差值显示
    formatDiff: action((score, par) => {
        return formatDiff(score, par);
    }),

    // 计算分数样式类
    getScoreClass: action((diff) => {
        return getScoreClass(diff);
    }),

    getState() {
        return {
            players: this.players,
            scores: this.scores,
            gameData: this.gameData,
            groupId: this.groupId,
            gameid: this.gameid,
            loading: this.loading,
            error: this.error,
            red_blue: this.red_blue,
            kickConfigs: this.kickConfigs,
            // 从 holeRangeStore 获取洞相关数据
            ...holeRangeStore.getState()
        };
    },


    // 洞相关的 getter 方法，从 holeRangeStore 获取
    get getHoleList() {
        return holeRangeStore.holeList;
    },

    get getHolePlayList() {
        return holeRangeStore.holePlayList;
    },

}); 