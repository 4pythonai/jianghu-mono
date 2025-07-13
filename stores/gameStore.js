import { observable, action } from 'mobx-miniprogram'
import gameApi from '../api/modules/game' // 导入整个默认导出的对象
import gambleApi from '../api/modules/gamble' // 导入 gamble API

export const gameStore = observable({
    // ---- 状态数据 ----
    gameData: null,      // 原始游戏数据
    players: [],         // 玩家列表
    holes: [],           // 洞信息列表
    scores: [],          // 分数矩阵 [playerIndex][holeIndex]
    loading: false,      // 加载状态
    error: null,         // 错误信息
    isSaving: false,     // 保存状态
    gameid: null,        // 当前游戏ID
    groupId: null,       // 当前分组ID

    // ---- 运行时配置相关状态 ----
    runtimeConfigs: [],  // 运行时配置列表
    loadingRuntimeConfig: false,  // 加载运行时配置状态
    runtimeConfigError: null,     // 运行时配置错误信息

    // ---- 私有方法 (数据处理) ----

    // 标准化玩家数据
    _normalizePlayer: action((player) => {
        return {
            ...player,
            userid: player.userid != null ? String(player.userid) : (player.user_id != null ? String(player.user_id) : ''),
            nickname: player.nickname || player.wx_nickname || '未知玩家'
        };
    }),

    // 标准化洞数据
    _normalizeHole: action((hole) => {
        return {
            ...hole,
            holeid: hole.holeid != null ? String(hole.holeid) : '',
            unique_key: hole.unique_key != null ? String(hole.unique_key) : '',
            par: Number(hole.par) || 0
        };
    }),

    // 标准化分数数据
    _normalizeScore: action((score) => {
        return {
            score: Number(score.score) || 0,
            putts: Number(score.putts) || 0,
            penalty_strokes: Number(score.penalty_strokes) || 0,
            sand_save: Number(score.sand_save) || 0
        };
    }),

    // 创建默认分数对象
    _createDefaultScore: action(() => {
        return {
            score: 0,
            putts: 0,
            penalty_strokes: 0,
            sand_save: 0
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

    // 根据 groupId 过滤玩家
    _filterPlayersByGroup: action((players, groupId) => {
        if (!groupId) {
            console.log('📦 [Store] 无 groupId，返回所有玩家');
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
        // 标准化所有玩家数据
        const allPlayers = (gameData.players || []).map(p => this._normalizePlayer(p));

        // 根据 groupId 过滤玩家（如果提供了 groupId）
        const players = this._filterPlayersByGroup(allPlayers, groupId);

        const holes = (gameData.holeList || []).map(h => this._normalizeHole(h));

        const scoreMap = new Map();
        for (const s of gameData.scores || []) {
            const key = `${s.userid}_${s.holeid}`;
            scoreMap.set(key, this._normalizeScore(s));
        }

        // 只为当前分组的玩家创建分数矩阵
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
        this.players = players;  // 注意：这里是过滤后的玩家
        this.holes = holes;
        this.scores = scores;    // 注意：这里是过滤后玩家的分数矩阵
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
            if (groupId) {
                params.groupId = groupId;
            }

            const res = await gameApi.getGameDetail(params, {
                loadingTitle: '加载比赛详情...',
                loadingMask: true
            });

            console.log('📦 [Store] API 响应:', res);
            if (res?.code === 200 && res.game_detail) {
                // ** 调用私有方法处理数据 **
                this._processGameData(res.game_detail, groupId);

                // ** 获取运行时配置 **
                this.fetchRuntimeConfigs(gameId, groupId);
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

    // 获取运行时配置
    fetchRuntimeConfigs: action(async function (gameId, groupId = null) {
        if (this.loadingRuntimeConfig) return; // 防止重复加载

        // 优先使用传入的 groupId，否则使用 store 中的 groupId
        const currentGroupId = groupId || this.groupId;

        console.log('🎮 [Store] 开始获取运行时配置:', { gameId, groupId: currentGroupId });
        this.loadingRuntimeConfig = true;
        this.runtimeConfigError = null;

        try {
            // 构建请求参数 - 使用 groupId 而不是 gameId
            const params = currentGroupId ? { groupId: currentGroupId } : { gameid: gameId };

            console.log('🎮 [Store] 调用 listRuntimeConfig 参数:', params);

            const res = await gambleApi.listRuntimeConfig(params, {
                loadingTitle: '加载游戏配置...',
                loadingMask: false // 不显示遮罩，避免影响用户体验
            });

            console.log('🎮 [Store] 运行时配置 API 响应:', res);
            if (res?.code === 200) {
                const rawConfigs = res.gambles || [];

                // 直接在这里处理配置数据，避免 this 上下文问题
                this.runtimeConfigs = rawConfigs.map(config => {
                    try {
                        const processedConfig = { ...config };

                        // 解析 val8421_config JSON 字符串
                        if (config.val8421_config && typeof config.val8421_config === 'string') {
                            try {
                                processedConfig.val8421_config_parsed = JSON.parse(config.val8421_config);
                                processedConfig.player8421Count = Object.keys(processedConfig.val8421_config_parsed).length;
                            } catch (e) {
                                console.warn('🎮 [Store] 解析 val8421_config 失败:', e);
                                processedConfig.val8421_config_parsed = {};
                                processedConfig.player8421Count = 0;
                            }
                        }

                        // 解析 bootstrap_order JSON 字符串
                        if (config.bootstrap_order && typeof config.bootstrap_order === 'string') {
                            try {
                                processedConfig.bootstrap_order_parsed = JSON.parse(config.bootstrap_order);
                            } catch (e) {
                                console.warn('🎮 [Store] 解析 bootstrap_order 失败:', e);
                                processedConfig.bootstrap_order_parsed = [];
                            }
                        }

                        // 格式化排名规则显示文本
                        if (config.ranking_tie_resolve_config) {
                            const rankingMap = {
                                'score.reverse': '按成绩排序，冲突时回溯成绩',
                                'score.win_loss.reverse_win': '按成绩排序，按输赢，回溯输赢',
                                'score.win_loss.reverse_score': '按成绩排序，按输赢，回溯成绩',
                                'indicator.reverse': '按得分排序，冲突时回溯得分',
                                'indicator.win_loss.reverse_win': '按得分排序，按输赢，回溯输赢',
                                'indicator.win_loss.reverse_indicator': '按得分排序，按输赢，回溯得分'
                            };
                            processedConfig.ranking_display = rankingMap[config.ranking_tie_resolve_config] || config.ranking_tie_resolve_config || '未知排名规则';
                        }

                        // 格式化洞数范围
                        const firstHole = config.firstHoleindex || 1;
                        const lastHole = config.lastHoleindex || 18;
                        processedConfig.hole_range_display = firstHole === lastHole ?
                            `第${firstHole}洞` :
                            `第${firstHole}洞 - 第${lastHole}洞`;

                        return processedConfig;
                    } catch (e) {
                        console.error('🎮 [Store] 处理运行时配置数据失败:', e, config);
                        return config;
                    }
                });

                console.log('🎮 [Store] 运行时配置加载成功，共', this.runtimeConfigs.length, '条配置');
                console.log('🎮 [Store] 运行时配置详情:', this.runtimeConfigs);
            } else {
                console.warn('⚠️ [Store] 运行时配置加载失败:', res?.message || res?.msg || '未知错误');
                this.runtimeConfigError = res?.message || res?.msg || '获取运行时配置失败';
                this.runtimeConfigs = [];
            }
        } catch (err) {
            console.error('❌ [Store] 获取运行时配置失败:', err);
            this.runtimeConfigError = err.message || '获取运行时配置失败';
            this.runtimeConfigs = [];
        } finally {
            this.loadingRuntimeConfig = false;
            console.log('🎮 [Store] 运行时配置获取流程结束');
        }
    }),

    // 更新单个格子的分数
    updateCellScore: action(function ({ playerIndex, holeIndex, score, putts, penalty_strokes, sand_save }) {

        // 使用可选链确保分数对象存在
        const scoreObj = this.scores?.[playerIndex]?.[holeIndex];

        if (!scoreObj) { return; }


        // 🔧 更激进的修复：完全替换整个scores数组来强制触发响应式更新
        // 创建新的scores数组副本
        const newScores = this.scores.map((playerScores, pIndex) => {
            if (pIndex === playerIndex) {
                // 对于目标玩家，创建新的洞分数数组
                return playerScores.map((holeScore, hIndex) => {
                    if (hIndex === holeIndex) {
                        // 对于目标洞，创建新的分数对象
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

        // 🎯 关键：完全替换scores数组，强制触发响应式更新
        this.scores = newScores;

        // 🧪 测试：强制更新一个简单字段来测试MobX响应式是否正常工作
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

    // 添加新玩家
    addPlayer: action(function (player) {
        this.players.push(player);
        // 同时需要为新玩家初始化一整行的分数
        const newScoresRow = this._initializePlayerScores(this.holes);
        this.scores.push(newScoresRow);
    }),

    // ---- Computed (计算属性) ----

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
        if (!score || score === 0) return '0';
        return score.toString();
    }),

    // 格式化推杆显示
    formatputts: action((putts) => {
        if (!putts || putts === 0) return '0';
        return putts.toString();
    }),

    // 格式化差值显示
    formatDiff: action((score, par) => {
        if (!score || !par) return '0';
        const diff = score - par;
        if (diff === 0) return '0';
        return diff > 0 ? `+${diff}` : diff.toString();
    }),


    // 计算分数样式类
    getScoreClass: action((diff) => {
        if (diff <= -2) return 'score-eagle';  // score-eagle
        if (diff === -1) return 'score-birdie'; // score-birdie
        if (diff === 0) return 'score-par';   // score-par
        if (diff === 1) return 'score-bogey';  // score-bogey
        if (diff === 2) return 'score-double-bogey';  // score-double-bogey
        if (diff >= 3) return 'score-triple-bogey';   // score-triple-bogey
        return 'score-par';
    }),

    // Tab 状态管理
    currentTab: 0,
    setCurrentTab: action(function (tabIndex) {
        this.currentTab = tabIndex;
    }),
}); 