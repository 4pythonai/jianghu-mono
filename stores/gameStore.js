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


export const gameStore = observable({

    gameData: null,      // 原始游戏数据

    players: [],         // 玩家列表
    holeList: [],           // 洞信息列表
    holePlayList: [],
    scores: [],          // 分数矩阵 [playerIndex][holeIndex]
    loading: false,      // 加载状态
    error: null,         // 错误信息
    isSaving: false,     // 保存状态
    gameid: null,        // 当前游戏ID
    groupId: null,       // 当前分组ID
    startHoleindex: null,
    endHoleindex: null,

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

    // 为单个玩家初始化所有洞的分数
    _initializePlayerScores: action((holeList) => {
        return holeList.map(() => createDefaultScore());
    }),


    // 根据 groupId 过滤玩家
    _filterPlayersByGroup: action((players, groupId) => {
        if (!groupId) {
            console.log(' [Store] 无 groupId, 返回所有玩家');
            return players;
        }

        const filteredPlayers = players.filter(player => {
            const playerGroupId = String(player.groupid || player.group_id || '');
            const targetGroupId = String(groupId);
            return playerGroupId === targetGroupId;
        });

        return filteredPlayers;
    }),

    _processGameData: action(function (gameData, groupId = null) {

        const allPlayers = (gameData.players || []).map(p => normalizePlayer(p));
        const players = this._filterPlayersByGroup(allPlayers, groupId);
        const holeList = (gameData.holeList || []).map(h => normalizeHole(h));

        const scoreMap = new Map();
        for (const s of gameData.scores || []) {
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
        if (gameData.score_cards) {
            normalizeScoreCards(gameData.score_cards);
        }

        // 用清洗过的数据更新状态
        this.gameData = gameData;
        this.players = players;  // 注意:这里是过滤后的玩家
        this.holeList = holeList;
        this.holePlayList = JSON.parse(JSON.stringify(holeList));
        this.scores = scores;    // 注意:这里是过滤后玩家的分数矩阵
        this.groupId = groupId;  // 存储当前分组ID
    }),

    // ---- Actions (修改状态的动作) ----

    // 设置保存状态
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

    // 更新单个格子的分数
    updateCellScore: action(function ({ playerIndex, holeIndex, score, putts, penalty_strokes, sand_save }) {

        // 使用可选链确保分数对象存在
        const scoreObj = this.scores?.[playerIndex]?.[holeIndex];

        if (!scoreObj) { return; }


        // 🔧 更激进的修复:完全替换整个scores数组来强制触发响应式更新
        // 创建新的scores数组副本
        const newScores = this.scores.map((playerScores, pIndex) => {
            if (pIndex === playerIndex) {
                // 对于目标玩家, 创建新的洞分数数组
                return playerScores.map((holeScore, hIndex) => {
                    if (hIndex === holeIndex) {
                        // 对于目标洞, 创建新的分数对象
                        const newScoreObj = { ...holeScore };

                        if (score !== undefined) {
                            newScoreObj.score = score;
                            console.log(`✅ [gameStore] 更新score: ${score}`);
                        }
                        if (putts !== undefined) {
                            newScoreObj.putts = putts;
                            console.log(`✅ [gameStore] 更新putts: ${putts}`);
                        }
                        if (penalty_strokes !== undefined) {
                            newScoreObj.penalty_strokes = penalty_strokes;
                            console.log(`✅ [gameStore] 更新penalty_strokes: ${penalty_strokes}`);
                        }
                        if (sand_save !== undefined) {
                            newScoreObj.sand_save = sand_save;
                            console.log(`✅ [gameStore] 更新sand_save: ${sand_save}`);
                        }

                        return newScoreObj;
                    }
                    // 其他洞保持不变
                    return holeScore;
                });
            }
            // 其他玩家保持不变
            return playerScores;
        });

        // �� 关键:完全替换scores数组, 强制触发响应式更新
        this.scores = newScores;

        // 🧪 测试:强制更新一个简单字段来测试MobX响应式是否正常工作
        this.isSaving = !this.isSaving;
        setTimeout(() => {
            this.isSaving = !this.isSaving;
        }, 100);
    }),

    // 用于回滚的批量更新
    batchUpdateScoresForHole: action(function ({ holeIndex, scoresToUpdate }) {
        for (const [playerIndex, scoreData] of scoresToUpdate.entries()) {
            const scoreObj = this.scores?.[playerIndex]?.[holeIndex];
            if (scoreObj) {
                this.scores[playerIndex][holeIndex] = scoreData;
            }
        }
    }),




    // 计算每个玩家的总分
    get playerTotalScores() {
        if (!this.players.length || !this.scores.length) return [];

        return this.players.map((player, playerIndex) => {
            const playerScores = this.scores[playerIndex] || [];
            return playerScores.reduce((total, scoreData) => {
                return total + (scoreData.score || 0);
            }, 0);
        });
    },

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


    updateHolePlayList: action(function (holePlayList) {

        console.log(' 🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴 🔴updateHolePlayList+++++++++++++++', holePlayList);
        this.holePlayList = JSON.parse(JSON.stringify(holePlayList));
    }),

    // Tab 状态管理
    currentTab: 0,
    setCurrentTab: action(function (tabIndex) {
        this.currentTab = tabIndex;
    }),
}); 