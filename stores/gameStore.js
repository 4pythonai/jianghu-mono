import { observable, action } from 'mobx-miniprogram'
import gameApi from '../api/modules/game' // 导入整个默认导出的对象
import {
    normalizePlayer,
    normalizeHole,
    normalizeScore,
    createDefaultScore,
    normalizeScoreCards,
    formatScore,
    formatPutts,
    formatDiff,
    getScoreClass
} from '../utils/gameUtils'
import { scoreStore } from './scoreStore'


export const gameStore = observable({

    gameid: null,
    groupId: null,
    gameData: null,      // 原始游戏数据
    players: [],         // 玩家列表
    holeList: [],           // 洞信息列表
    holePlayList: [],
    loading: false,      // 加载状态
    error: null,         // 错误信息
    isSaving: false,     // 保存状态
    startHoleindex: null,
    endHoleindex: null,



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
        const holeList = (gameInfo.holeList || []).map(h => normalizeHole(h));

        const scoreMap = new Map();
        for (const s of gameInfo.scores || []) {
            const key = `${s.userid}_${s.holeid}`;
            scoreMap.set(key, normalizeScore(s));
        }

        // 只为当前分组的玩家创建分数矩阵
        const scores = players.map(player => {
            return holeList.map(hole => {
                const key = `${player.userid}_${hole.holeid}`;
                return scoreMap.get(key) || createDefaultScore();
            });
        });

        // 标准化score_cards中的数据
        if (gameInfo.score_cards) {
            normalizeScoreCards(gameInfo.score_cards);
        }

        // 用清洗过的数据更新状态
        this.gameData = gameInfo;
        this.players = players;  // 注意:这里是过滤后的玩家
        this.holeList = holeList;
        this.holePlayList = JSON.parse(JSON.stringify(holeList));
        this.groupId = groupId;  // 存储当前分组ID
        // 新增: 初始化并同步分数到 scoreStore
        scoreStore.initializeScores(players.length, holeList.length);
        scoreStore.scores = scores;
    }),


    setSaving: action(function (status) {
        this.isSaving = status;
    }),

    // 从API获取并初始化游戏数据
    fetchGameDetail: action(async function (gameId, groupId = null) {
        if (this.loading) return; // 防止重复加载

        console.log('📦 [Store] 开始获取比赛详情:', { gameId, groupId });
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
            } else {
                throw new Error(res?.msg || '获取比赛详情失败');
            }
        } catch (err) {
            console.error('❌ [Store] 获取比赛详情失败:', err);
            this.error = err.message || '获取数据失败';
        } finally {
            this.loading = false;
            console.log('�� [Store] 获取流程结束');
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
            holeList: this.holeList,
            holePlayList: this.holePlayList,
            players: this.players,
            scores: this.scores,
            gameData: this.gameData,
            groupId: this.groupId,
            gameid: this.gameid,
            loading: this.loading,
            error: this.error,
            startHoleindex: this.startHoleindex,
            endHoleindex: this.endHoleindex,
        };
    },


    get getHoleList() {
        return this.holeList;
    },

    get getHolePlayList() {
        return this.holePlayList;
    },

}); 