import { observable, action } from 'mobx-miniprogram'
import gameApi from '../api/modules/game' // 导入整个默认导出的对象

export const gameStore = observable({
    // ---- Observables (可观察的状态) ----

    // 游戏ID
    gameid: '',
    // 完整的游戏数据
    gameData: null,
    // 参与玩家列表
    players: [],
    // 所有洞的信息
    holes: [],
    // 分数二维数组, 结构: scores[playerIndex][holeIndex]
    scores: [],
    // 加载状态
    loading: false,
    // 错误信息
    error: null,

    // ---- 私有辅助方法 ----
    _processGameData: action(function (gameData) {
        const players = (gameData.players || []).map(p => ({
            ...p,
            userid: String(p.userid || ''),
        }));

        const holes = (gameData.holeList || []).map(h => ({
            ...h,
            holeid: String(h.holeid || ''),
            par: Number(h.par || 0),
        }));

        const scoreMap = new Map();
        (gameData.scores || []).forEach(s => {
            const key = `${s.userid}_${s.holeid}`;
            scoreMap.set(key, {
                score: Number(s.score || 0),
                putt: Number(s.putt || 0),
                diff: Number(s.diff || 0),
                gambleflag: String(s.gambleflag || ''),
            });
        });

        const scores = players.map(player => {
            return holes.map(hole => {
                const key = `${player.userid}_${hole.holeid}`;
                return scoreMap.get(key) || {
                    score: 0,
                    putt: 0,
                    diff: 0,
                    gambleflag: '',
                };
            });
        });

        // 用清洗过的数据更新状态
        this.gameData = gameData;
        this.players = players;
        this.holes = holes;
        this.scores = scores;
    }),

    // ---- Actions (修改状态的动作) ----

    // 从API获取并初始化游戏数据
    fetchGameDetail: action(async function (gameId) {
        if (this.loading) return; // 防止重复加载

        console.log('📦 [Store] 开始获取比赛详情:', gameId);
        this.loading = true;
        this.error = null;
        this.gameid = gameId;

        try {
            const res = await gameApi.getGameDetail({ gameId }, {
                loadingTitle: '加载比赛详情...',
                loadingMask: true
            });

            console.log('📦 [Store] API 响应:', res);
            if (res?.code === 200 && res.game_detail) {
                // ** 调用私有方法处理数据 **
                this._processGameData(res.game_detail);
            } else {
                throw new Error(res?.msg || '获取比赛详情失败');
            }
        } catch (err) {
            console.error('❌ [Store] 获取比赛详情失败:', err);
            this.error = err.message || '获取数据失败';
        } finally {
            this.loading = false;
            console.log('📦 [Store] 获取流程结束');
        }
    }),

    // 更新单个格子的分数
    updateCellScore: action(function ({ playerIndex, holeIndex, score, putt }) {
        // 确保分数对象存在
        if (this.scores[playerIndex] && this.scores[playerIndex][holeIndex]) {
            if (score !== undefined) {
                this.scores[playerIndex][holeIndex].score = score;
            }
            if (putt !== undefined) {
                this.scores[playerIndex][holeIndex].putt = putt;
            }
        }
    }),

    // 添加新玩家
    addPlayer: action(function (player) {
        this.players.push(player);
        // 同时需要为新玩家初始化一整行的分数
        const newScoresRow = this.holes.map(() => ({ score: 0, putt: 0, diff: 0, gambleflag: '' }));
        this.scores.push(newScoresRow);
    }),

    // ---- Computed (计算属性，可选) ----
    // 可以在这里添加一些根据现有状态计算得出的新值
    // 例如：计算每个玩家的总分
    // get playerTotalScores() { ... }
}); 