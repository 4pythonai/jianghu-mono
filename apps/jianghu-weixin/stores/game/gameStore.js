import { observable, action } from 'mobx-miniprogram'
import gameApi from '../../api/modules/game'
import {
    normalizePlayer,
    normalizeHole,
    normalizeScoreCards,
} from '../../utils/gameUtils'
import { filterPlayersByGroup, calculatePlayersHandicaps } from '../../utils/playerUtils'
import { scoreStore } from './scoreStore'
import { holeRangeStore } from './holeRangeStore'
import { runtimeStore } from '../gamble/runtimeStore'

export const gameStore = observable({

    gameid: null,
    groupid: null,
    creatorid: null,     // 创建者ID
    gameData: null,      // 原始游戏数据
    players: [],         // 玩家列表
    red_blue: [],        // 红蓝分组数据
    gameAbstract: '',    // 游戏摘要

    loading: false,      // 加载状态
    error: null,         // 错误信息
    isSaving: false,     // 保存状态

    /**
     * 重置 store 数据
     * 用于进入新流程（如创建新比赛）时清理旧数据
     */
    reset: action(function () {
        this.gameid = null;
        this.groupid = null;
        this.creatorid = null;
        this.gameData = null;
        this.players = [];
        this.red_blue = [];
        this.gameAbstract = '';
        this.loading = false;
        this.error = null;
        this.isSaving = false;
        // 调用关联 store 的清理方法
        scoreStore.clear();
        holeRangeStore.clear();
        runtimeStore.clearKickConfigs();
        console.log('[gameStore] reset 完成');
    }),

    /**
     * 设置玩家列表
     * 用于创建比赛流程中同步本地数据到 store
     * @param {Array} players - 玩家列表
     */
    setPlayers: action(function (players) {
        this.players = players || [];
        console.log('[gameStore] setPlayers:', this.players.length, '人');
    }),

    /**
     * 设置 gameid
     * @param {number} gameid
     */
    setGameid: action(function (gameid) {
        this.gameid = gameid;
        console.log('[gameStore] setGameid:', gameid);
    }),

    /**
     * 设置创建者ID
     * @param {number} creatorid
     */
    setCreatorid: action(function (creatorid) {
        this.creatorid = creatorid;
        console.log('[gameStore] setCreatorid:', creatorid);
    }),

    /**
     * 移除球员
     * @param {number} userid 要移除的用户ID
     * @returns {Promise<{success: boolean, message: string}>}
     */
    removePlayer: action(async function (userid) {
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




    _processGameData: action(function (gameInfo, groupid = null) {

        const allPlayers = (gameInfo.players || []).map(p => normalizePlayer(p));
        const players = filterPlayersByGroup(allPlayers, groupid);
        const holeList = (gameInfo.holeList || []).map((h, index) => normalizeHole(h, index + 1));
        scoreStore.scores = gameInfo.scores || [];


        // 标准化score_cards中的数据
        if (gameInfo.score_cards) {
            normalizeScoreCards(gameInfo.score_cards);
        }

        // 计算每个玩家的 handicap
        const playersWithHandicap = calculatePlayersHandicaps(players, holeList, scoreStore.scores);

        // 先更新基础数据
        this.gameData = gameInfo;
        this.creatorid = gameInfo.creatorid || null;  // 同步创建者ID
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

        // 使用 playerUtils 的 calculatePlayersHandicaps 计算 handicap
        const playersWithHandicap = calculatePlayersHandicaps(this.players, holeList, scoreStore.scores, scoreIndex);

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
            this.gameAbstract = '';
            scoreStore.clear();
            holeRangeStore.clear();
            runtimeStore.clearKickConfigs();
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
                runtimeStore.setKickConfigs(res.kickConfigs || []);

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

    getState() {
        return {
            players: this.players,
            scores: scoreStore.scores,
            gameData: this.gameData,
            groupid: this.groupid,
            gameid: this.gameid,
            loading: this.loading,
            error: this.error,
            red_blue: this.red_blue,
            kickConfigs: runtimeStore.kickConfigs,
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
