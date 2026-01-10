import { observable, action } from 'mobx-miniprogram'
import gameApi from '../../api/modules/game'
import teamgameApi from '../../api/modules/teamgame'
import eventsApi from '../../api/modules/events'
import { config } from '../../api/config'
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
    players: [],         // 玩家列表（记分用，当前组的玩家）
    red_blue: [],        // 红蓝分组数据
    gameAbstract: '',    // 游戏摘要

    loading: false,      // 加载状态
    error: null,         // 错误信息
    isSaving: false,     // 保存状态

    // ==================== 队内/队际赛扩展字段 ====================
    gameType: 'common',           // 'common' | 'single_team' | 'cross_teams'
    gameTags: [],                 // 分队列表（t_team_game_tags）
    tagMembers: [],               // 报名人员列表（按 tag/分队组织）
    groups: [],                   // 所有分组列表
    spectators: {                 // 围观数据
        count: 0,
        avatars: []
    },
    groupingPermission: 'admin',  // 分组权限：'admin' | 'player'
    eventDetail: {                // 赛事详情（用于展示）
        title: '',
        teamName: '',
        teamAvatar: '',
        teams: [],
        location: '',
        dateTime: '',
        fee: '',
        deadline: '',
        schedule: [],
        awards: [],
        backgroundImage: '',
        coverType: 'default',
        covers: []
    },

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

        // 重置队内/队际赛字段
        this.gameType = 'common';
        this.gameTags = [];
        this.tagMembers = [];
        this.groups = [];
        this.spectators = { count: 0, avatars: [] };
        this.groupingPermission = 'admin';
        this.eventDetail = {
            title: '',
            teamName: '',
            teamAvatar: '',
            teams: [],
            location: '',
            dateTime: '',
            fee: '',
            deadline: '',
            schedule: [],
            awards: [],
            backgroundImage: '',
            coverType: 'default',
            covers: []
        };

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
            // 队内/队际赛字段
            gameType: this.gameType,
            gameTags: this.gameTags,
            tagMembers: this.tagMembers,
            groups: this.groups,
            spectators: this.spectators,
            groupingPermission: this.groupingPermission,
            eventDetail: this.eventDetail,
            isCreator: this.isCreator,
            // 从 holeRangeStore 获取洞相关数据
            ...holeRangeStore.getState()
        };
    },


    // 洞相关的 getter 方法，从 holeRangeStore 获取
    get getHoleList() {
        return holeRangeStore.holeList;
    },

    // ==================== 队内/队际赛 Actions ====================

    /**
     * 判断当前用户是否为创建者
     */
    get isCreator() {
        const app = getApp();
        const currentUserId = app?.globalData?.userInfo?.id;
        return currentUserId && String(this.creatorid) === String(currentUserId);
    },

    /**
     * 加载队内/队际赛详情
     * @param {number} gameId 比赛ID
     * @param {string} gameType 'single_team' | 'cross_teams'
     */
    fetchTeamGameDetail: action(async function (gameId, gameType = 'single_team') {
        if (this.loading) return;

        // 切换比赛时清理旧数据
        if (this.gameid && String(this.gameid) !== String(gameId)) {
            console.log('[gameStore] 切换队内/队际赛，清理旧数据');
            this.gameTags = [];
            this.tagMembers = [];
            this.groups = [];
            this.spectators = { count: 0, avatars: [] };
        }

        this.loading = true;
        this.error = null;
        this.gameid = gameId;
        this.gameType = gameType;

        try {
            // 根据比赛类型调用不同的 API
            const apiMethod = gameType === 'cross_teams'
                ? teamgameApi.getCrossTeamGameDetail
                : teamgameApi.getTeamGameDetail;

            const res = await apiMethod({ game_id: gameId });

            if (res?.code === 200 && res.data) {
                this._processTeamGameData(res.data);
                return res;
            }

            throw new Error(res?.message || '获取赛事详情失败');
        } catch (err) {
            console.error('[gameStore] 获取队内/队际赛详情失败:', err);
            this.error = err.message || '获取数据失败';
            throw err;
        } finally {
            this.loading = false;
        }
    }),

    /**
     * 处理队内/队际赛数据
     */
    _processTeamGameData: action(function (data) {
        this.creatorid = data.creatorid || null;
        this.groupingPermission = data.grouping_permission || 'admin';
        this.gameData = data;

        // 解析 awards
        let awards = [];
        if (data.awards) {
            if (Array.isArray(data.awards)) {
                awards = data.awards;
            } else if (typeof data.awards === 'string') {
                awards = data.awards.split(/[,，\n]/).map(s => s.trim()).filter(Boolean);
            }
        }

        // 解析 schedule
        let schedule = [];
        if (data.schedule) {
            try {
                schedule = typeof data.schedule === 'string' ? JSON.parse(data.schedule) : data.schedule;
            } catch (e) {
                console.error('[gameStore] 解析赛事流程失败:', e);
            }
        }

        // 格式化报名截止时间
        let deadline = '';
        if (data.registration_deadline) {
            try {
                const { parseDate } = require('../utils/tool');
                const date = parseDate(data.registration_deadline);
                if (!isNaN(date.getTime())) {
                    const month = date.getMonth() + 1;
                    const day = date.getDate();
                    const hours = date.getHours().toString().padStart(2, '0');
                    const minutes = date.getMinutes().toString().padStart(2, '0');
                    deadline = `报名截止: ${month}月${day}日 ${hours}:${minutes}`;
                } else {
                    deadline = data.registration_deadline;
                }
            } catch (e) {
                deadline = data.registration_deadline;
            }
        }

        this.eventDetail = {
            title: data.team_game_title || data.name || '',
            teamName: data.team_name || '',
            teamAvatar: data.team_avatar || '',
            teams: data.cross_teams || [],
            location: data.course_name || '',
            dateTime: data.open_time || '',
            fee: data.entry_fee ? `${data.entry_fee}元` : '',
            deadline: deadline,
            schedule: schedule,
            awards: awards,
            backgroundImage: data.background_image || '',
            coverType: data.cover_type || 'default',
            covers: data.covers || []
        };

        console.log('[gameStore] _processTeamGameData 完成', {
            creatorid: this.creatorid,
            groupingPermission: this.groupingPermission
        });
    }),

    /**
     * 加载报名人员列表
     */
    loadTagMembers: action(async function (gameId = null) {
        const id = gameId || this.gameid;
        if (!id) return;

        try {
            const res = await teamgameApi.getTagMembersAll({ game_id: id });
            if (res?.code === 200 && res.data) {
                const staticURL = config.staticURL;
                this.tagMembers = res.data.map(m => {
                    let avatar = m.avatar || '';
                    if (avatar && avatar.startsWith('/')) {
                        avatar = staticURL + avatar;
                    }
                    return {
                        id: m.user_id,
                        seq: m.seq,
                        name: m.nickname,
                        avatar: avatar,
                        handicap: m.handicap,
                        tagName: m.tag_name || '',
                        tagColor: m.color || ''
                    };
                });
                console.log('[gameStore] loadTagMembers 完成:', this.tagMembers.length, '人');
            }
        } catch (err) {
            console.error('[gameStore] 加载报名人员失败:', err);
        }
    }),

    /**
     * 加载分队列表（t_team_game_tags）
     */
    loadGameTags: action(async function (gameId = null) {
        const id = gameId || this.gameid;
        if (!id) return;

        try {
            const res = await teamgameApi.getGameTags({ game_id: id });
            if (res?.code === 200 && res.data) {
                this.gameTags = res.data.map(t => ({
                    id: t.id,
                    tagName: t.tag_name,
                    color: t.color || null,
                    order: t.tag_order || 1,
                    teamId: t.team_id || null  // 队际赛时关联的球队ID
                }));
                console.log('[gameStore] loadGameTags 完成:', this.gameTags.length, '个分队');
            }
        } catch (err) {
            console.error('[gameStore] 加载分队失败:', err);
        }
    }),

    /**
     * 加载分组列表
     */
    loadGroups: action(async function (gameId = null) {
        const id = gameId || this.gameid;
        if (!id) return;

        try {
            const res = await teamgameApi.getGroups({ game_id: id });
            if (res?.code === 200 && res.data) {
                this.groups = this._parseGroups(res.data);
                console.log('[gameStore] loadGroups 完成:', this.groups.length, '组');
            }
        } catch (err) {
            console.error('[gameStore] 加载分组失败:', err);
        }
    }),

    /**
     * 解析分组数据
     */
    _parseGroups(groups) {
        if (!Array.isArray(groups)) return [];

        // API (MTeamGame.getGroups) 返回: groupid, group_name, members[]
        // members[] 中每项包含: userid, nickname, avatar, tag_name, tee
        return groups.map((g, index) => {
            return {
                id: String(g.groupid),
                name: g.group_name || `第${index + 1}组`,
                players: (g.members || []).map(p => ({
                    id: p.userid,
                    name: p.nickname || '未知玩家',
                    avatar: p.avatar || '',
                    teamName: p.tag_name || '',
                    tee: p.tee || ''
                }))
            };
        });
    },

    /**
     * 加载围观数据
     */
    loadSpectators: action(async function (gameId = null) {
        const id = gameId || this.gameid;
        if (!id) return;

        try {
            const res = await eventsApi.getSpectatorList({ game_id: id, page: 1, page_size: 8 });
            if (res?.code === 200) {
                const avatars = (res.list || []).map(item => item.avatar);
                this.spectators = {
                    count: res.total || 0,
                    avatars: avatars
                };
                console.log('[gameStore] loadSpectators 完成:', this.spectators.count, '人');
            }
        } catch (err) {
            console.error('[gameStore] 加载围观数据失败:', err);
        }
    }),

    /**
     * 记录围观（静默调用）
     */
    recordSpectator: action(async function (gameId = null) {
        const id = gameId || this.gameid;
        if (!id) return;

        try {
            await eventsApi.addSpectator({ game_id: id });
        } catch (err) {
            // 静默失败
            console.error('[gameStore] 记录围观失败:', err);
        }
    }),

    /**
     * 创建空分组
     */
    createGroup: action(async function (gameId = null) {
        const id = gameId || this.gameid;
        if (!id) return { success: false, message: '缺少 game_id' };

        try {
            const res = await teamgameApi.createGroup({ game_id: id });
            if (res?.code === 200) {
                // 重新加载分组列表
                await this.loadGroups(id);
                return { success: true };
            }
            return { success: false, message: res?.message || '创建失败' };
        } catch (err) {
            return { success: false, message: err.message || '创建失败' };
        }
    }),

    /**
     * 删除分组
     */
    deleteGroup: action(async function (groupId, gameId = null) {
        const id = gameId || this.gameid;
        if (!id || !groupId) return { success: false, message: '缺少参数' };

        try {
            const res = await teamgameApi.deleteGroup({ game_id: id, group_id: groupId });
            if (res?.code === 200) {
                // 重新加载分组列表
                await this.loadGroups(id);
                return { success: true };
            }
            return { success: false, message: res?.message || '删除失败' };
        } catch (err) {
            return { success: false, message: err.message || '删除失败' };
        }
    }),

    /**
     * 更新单个分组的成员列表
     * @param {string} groupId 分组ID
     * @param {Array} userIds 用户ID数组
     * @param {number} gameId 比赛ID（可选）
     */
    updateGroupMembers: action(async function (groupId, userIds, gameId = null) {
        const id = gameId || this.gameid;
        if (!id || !groupId) return { success: false, message: '缺少参数' };

        try {
            const res = await teamgameApi.updateGroupMembers({
                game_id: id,
                group_id: groupId,
                user_ids: userIds
            });
            if (res?.code === 200) {
                // 重新加载分组列表
                await this.loadGroups(id);
                return { success: true, message: res?.message };
            }
            return { success: false, message: res?.message || '更新失败' };
        } catch (err) {
            return { success: false, message: err.message || '更新失败' };
        }
    }),

});
