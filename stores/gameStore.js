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
    // 保存状态
    isSaving: false,

    // ---- 私有辅助方法 ----

    // 标准化洞数据
    _normalizeHole: action((hole) => {
        const par = Number(hole.par);
        return {
            ...hole,
            holeid: hole.holeid ? String(hole.holeid) : '',
            // 确保 unique_key 始终是字符串，即使原值是 null 或 undefined
            unique_key: hole.unique_key != null ? String(hole.unique_key) : '',
            par: Number.isNaN(par) ? 0 : par,
        };
    }),

    // 标准化玩家数据
    _normalizePlayer: action((player) => {
        return {
            ...player,
            userid: String(player.userid || ''),
            // 确保 nickname 字段存在且为字符串，优先级：nickname > wx_nickname > 默认值
            nickname: player.nickname != null ? String(player.nickname) :
                (player.wx_nickname != null ? String(player.wx_nickname) : '未知玩家'),
            // 确保其他可能为 null 的字段也是字符串
            avatar: player.avatar != null ? String(player.avatar) : '',
            tee: player.tee != null ? String(player.tee) : '',
        };
    }),

    // 标准化分数数据
    _normalizeScore: action((score) => {
        return {
            score: Number(score.score || 0),
            putt: Number(score.putt || 0),
            diff: Number(score.diff || 0),
            gambleflag: String(score.gambleflag || ''),
        };
    }),

    // 创建默认分数对象
    _createDefaultScore: action(() => {
        return {
            score: 0,
            putt: 0,
            diff: 0,
            gambleflag: '',
        };
    }),

    // 为单个玩家初始化所有洞的分数
    _initializePlayerScores: action(function (holes) {
        return holes.map(() => this._createDefaultScore());
    }),

    // 标准化score_cards中的洞数据
    _normalizeScoreCards: action((scoreCards) => {
        for (const card of scoreCards) {
            if (card.scores && Array.isArray(card.scores)) {
                for (const hole of card.scores) {
                    // 确保 par 是数字
                    hole.par = Number(hole.par) || 0;
                    // 确保 unique_key 是字符串，处理 null/undefined 情况
                    hole.unique_key = hole.unique_key != null ? String(hole.unique_key) : '';
                    // 确保 holeid 是字符串
                    hole.holeid = hole.holeid != null ? String(hole.holeid) : '';
                }
            }
        }
    }),

    _processGameData: action(function (gameData) {
        const players = (gameData.players || []).map(p => this._normalizePlayer(p));

        const holes = (gameData.holeList || []).map(h => this._normalizeHole(h));

        const scoreMap = new Map();
        for (const s of gameData.scores || []) {
            const key = `${s.userid}_${s.holeid}`;
            scoreMap.set(key, this._normalizeScore(s));
        }

        const scores = players.map(player => {
            return holes.map(hole => {
                const key = `${player.userid}_${hole.holeid}`;
                return scoreMap.get(key) || this._createDefaultScore();
            });
        });

        // 标准化score_cards中的数据
        if (gameData.score_cards) {
            this._normalizeScoreCards(gameData.score_cards);
        }

        // 用清洗过的数据更新状态
        this.gameData = gameData;
        this.players = players;
        this.holes = holes;
        this.scores = scores;

        // 打印调试信息，确认 unique_key 类型
        console.log('📦 [Store] 处理后的洞数据 unique_key 类型检查:');
        holes.forEach((hole, index) => {
            const uniqueKeyType = typeof hole.unique_key;
            const uniqueKeyValue = hole.unique_key;
            console.log(`洞 ${index + 1}: unique_key = "${uniqueKeyValue}" (类型: ${uniqueKeyType})`);
            if (uniqueKeyType !== 'string') {
                console.warn(`⚠️ 洞 ${index + 1} 的 unique_key 不是字符串类型!`);
            }
        });

        // 打印调试信息，确认玩家数据的类型
        console.log('📦 [Store] 处理后的玩家数据 nickname 类型检查:');
        players.forEach((player, index) => {
            const nicknameType = typeof player.nickname;
            const nicknameValue = player.nickname;
            console.log(`玩家 ${index + 1}: nickname = "${nicknameValue}" (类型: ${nicknameType})`);
            if (nicknameType !== 'string') {
                console.warn(`⚠️ 玩家 ${index + 1} 的 nickname 不是字符串类型!`);
            }
        });
    }),

    // ---- Actions (修改状态的动作) ----

    // 设置保存状态
    setSaving: action(function (status) {
        this.isSaving = status;
    }),

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
    updateCellScore: action(function ({ playerIndex, holeIndex, score, putt, penalty_strokes, sand_save }) {
        // 使用可选链确保分数对象存在
        const scoreObj = this.scores?.[playerIndex]?.[holeIndex];
        if (scoreObj) {
            if (score !== undefined) scoreObj.score = score;
            if (putt !== undefined) scoreObj.putt = putt;
            if (penalty_strokes !== undefined) scoreObj.penalty_strokes = penalty_strokes;
            if (sand_save !== undefined) scoreObj.sand_save = sand_save;
        }
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

    // 添加新玩家
    addPlayer: action(function (player) {
        this.players.push(player);
        // 同时需要为新玩家初始化一整行的分数
        const newScoresRow = this._initializePlayerScores(this.holes);
        this.scores.push(newScoresRow);
    }),

    // ---- Computed (计算属性，可选) ----
    // 可以在这里添加一些根据现有状态计算得出的新值
    // 例如：计算每个玩家的总分
    // get playerTotalScores() { ... }
}); 