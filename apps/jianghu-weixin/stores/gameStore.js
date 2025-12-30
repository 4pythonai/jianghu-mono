import { observable, action } from 'mobx-miniprogram'
import gameApi from '../api/modules/game' // 导入整个默认导出的对象
import {
    normalizePlayer,
    normalizeHole,
    normalizeScoreCards,
    formatScore,
    formatPutts,
    formatDiff,
    getScoreClass,
    buildScoreIndex
} from '../utils/gameUtils'
import { scoreStore } from './scoreStore'
import { holeRangeStore } from './holeRangeStore'

export const gameStore = observable({

    gameid: null,
    groupid: null,
    gameData: null,      // 原始游戏数据
    players: [],         // 玩家列表
    red_blue: [],        // 红蓝分组数据
    kickConfigs: [], // 新增：运行时倍数数据
    gameAbstract: '',    // 游戏摘要

    loading: false,      // 加载状态
    error: null,         // 错误信息
    isSaving: false,     // 保存状态

    /**
     * 移除球员
     * @param {number} userid 要移除的用户ID
     * @returns {Promise<{success: boolean, message: string}>}
     */
    removePlayer: action(async function(userid) {
        if (!this.gameid) {
            return { success: false, message: '缺少 gameid' }
        }

        try {
            const result = await gameApi.removePlayer({
                gameid: this.gameid,
                userid: userid
            }, {
                loadingTitle: '移除中...'
            })

            if (result?.code === 200) {
                // 直接从 players 数组中移除该用户，立即更新 UI
                this.players = this.players.filter(p => String(p.userid) !== String(userid))
                return { success: true, message: '移除成功' }
            } else {
                return { success: false, message: result?.message || '移除失败' }
            }
        } catch (error) {
            return { success: false, message: error.message || '移除失败' }
        }
    }),




    // 根据 groupid 过滤玩家
    _filterPlayersByGroup: action((players, groupid) => {
        if (!groupid) {
            console.log(' [Store] 无 groupid, 返回所有玩家');
            return players;
        }

        const filteredPlayers = players.filter(player => {
            const playerGroupId = String(player.groupid);
            const targetGroupId = String(groupid);
            return playerGroupId === targetGroupId;
        });

        return filteredPlayers;
    }),


    _processGameData: action(function (gameInfo, groupid = null) {

        const allPlayers = (gameInfo.players || []).map(p => normalizePlayer(p));
        const players = this._filterPlayersByGroup(allPlayers, groupid);
        const holeList = (gameInfo.holeList || []).map((h, index) => normalizeHole(h, index + 1));
        scoreStore.scores = gameInfo.scores || [];


        // 标准化score_cards中的数据
        if (gameInfo.score_cards) {
            normalizeScoreCards(gameInfo.score_cards);
        }

        // 计算每个玩家的 handicap
        const playersWithHandicap = this.calculatePlayersHandicaps(players, holeList, scoreStore.scores);

        // 先更新基础数据
        this.gameData = gameInfo;
        this.players = playersWithHandicap;  // 注意:这里是过滤后并添加了handicap的玩家
        this.groupid = groupid;  // 存储当前分组ID
        this.gameAbstract = gameInfo.gameAbstract || '';  // 存储游戏摘要

        // 初始化 holeRangeStore 的洞数据
        holeRangeStore.initializeHoles(holeList);
    }),

    setSaving: action(function (status) {
        this.isSaving = status;
    }),

    // 更新玩家 handicap（原子操作的一部分）
    // 用于在分数变动时实时更新 players 的 handicap
    updatePlayersHandicaps: action(function (holeList, scoreIndex) {
        if (!this.players || !holeList || this.players.length === 0) {
            console.log('[gameStore] updatePlayersHandicaps: 数据不完整，跳过更新');
            return;
        }

        // 使用本地的 calculatePlayersHandicaps 计算 handicap（基于当前的 scores 和 players）
        const playersWithHandicap = this.calculatePlayersHandicaps(this.players, holeList, scoreStore.scores, scoreIndex);

        // 检查 handicap 是否真的变化了，避免不必要的更新导致循环触发
        let hasChanged = false;
        for (let i = 0; i < this.players.length; i++) {
            const oldHandicap = this.players[i]?.handicap ?? 0;
            const newHandicap = playersWithHandicap[i]?.handicap ?? 0;
            if (oldHandicap !== newHandicap) {
                hasChanged = true;
                break;
            }
        }

        // 只有当 handicap 真的变化时才更新 players，避免循环触发
        if (hasChanged) {
            this.players = playersWithHandicap;
            console.log('[gameStore] 原子操作：更新 players handicap 完成', {
                playersCount: this.players.length,
                handicaps: this.players.map(p => ({ userid: p.userid, nickname: p.nickname, handicap: p.handicap }))
            });
        } else {
            console.log('[gameStore] 原子操作：handicap 未变化，跳过更新（避免循环触发）');
        }
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
    fetchGameDetail: action(async function (gameid, groupid = null) {
        if (this.loading) return; // 防止重复加载

        // 如果是切换比赛（gameid 不同），先清理旧数据，避免数据污染
        if (this.gameid && String(this.gameid) !== String(gameid)) {
            console.log('[gameStore] 切换比赛，清理旧数据', {
                oldGameid: this.gameid,
                newGameid: gameid
            });
            // 清理所有相关数据
            this.players = [];
            this.gameData = null;
            this.red_blue = [];
            this.kickConfigs = [];
            this.gameAbstract = '';
            scoreStore.scores = [];  // 清理分数数据
            holeRangeStore.holeList = [];  // 清理洞数据
        }

        this.loading = true;
        this.error = null;
        this.gameid = gameid;
        this.groupid = groupid;  // 存储分组ID

        try {
            // 构建请求参数
            const params = { gameid };
            params.groupid = groupid;

            const res = await gameApi.getGameDetail(params, {
                loadingTitle: '加载比赛详情...',
                loadingMask: true
            });

            if (res?.code === 200 && res.game_detail) {
                // ** 调用私有方法处理数据 **
                this._processGameData(res.game_detail, groupid);
                this.red_blue = res.red_blue || [];
                this.kickConfigs = res.kickConfigs || []; // 存储运行时倍数


                return res; // 关键：返回原始接口数据，包含red_blue
            }

            throw new Error(res?.msg || '获取比赛详情失败');
        } catch (err) {
            console.error('❌ [Store] 获取比赛详情失败:', err);
            this.error = err.message || '获取数据失败';

            // 如果加载失败，确保数据是干净的（如果是切换比赛，已在上面的清理逻辑处理）
            // 这里只需要确保 error 状态正确
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

    /**
     * 计算每个玩家的 handicap（原子操作的一部分）
     * @param {Array} players - 玩家列表
     * @param {Array} holeList - 球洞列表
     * @param {Array} scores - 分数数组（从 scoreStore 传入）
     * @returns {Array} 添加了 handicap 属性的玩家列表
     */
    calculatePlayersHandicaps(players, holeList, scores, scoreIndexOverride) {
        if (!players || !holeList || !scores || players.length === 0) return players;

        const scoreIndex = scoreIndexOverride ?? buildScoreIndex(scores);

        return players.map(player => {
            let totalScore = 0;
            let totalPar = 0;
            const userId = String(player?.userid ?? '');
            const playerScores = scoreIndex.get(userId);

            // 计算该玩家的总分和总标准杆（使用 hindex 匹配）
            holeList.forEach(hole => {
                const holeIndex = String(hole?.hindex ?? '');
                const scoreData = playerScores?.get(holeIndex);

                if (scoreData && typeof scoreData.score === 'number' && scoreData.score > 0) {
                    totalScore += scoreData.score;
                    totalPar += hole.par || 0;
                }
            });

            // 杆差 = 总分 - 总标准杆
            const handicap = totalScore - totalPar;

            return {
                ...player,
                handicap: handicap
            };
        });
    },

    getState() {
        return {
            players: this.players,
            scores: this.scores,
            gameData: this.gameData,
            groupid: this.groupid,
            gameid: this.gameid,
            loading: this.loading,
            error: this.error,
            red_blue: this.red_blue,
            kickConfigs: this.kickConfigs,
            gameAbstract: this.gameAbstract,
            // 从 holeRangeStore 获取洞相关数据
            ...holeRangeStore.getState()
        };
    },


    // 洞相关的 getter 方法，从 holeRangeStore 获取
    get getHoleList() {
        return holeRangeStore.holeList;
    },


}); 
