// 高尔夫相关数据工具函数
const { config } = require('../api/config');

/**
 * 标准化玩家数据
 * @param {any} player
 * @returns {object}
 */
function normalizePlayer(player) {
    // player 来自后端 API，t_user 表字段: user_id, show_name, avatar, handicap, mobile, gender
    let avatar = player.avatar || '';
    if (avatar && avatar.startsWith('/')) {
        avatar = config.staticURL + avatar;
    }
    return {
        ...player,
        user_id: String(player.user_id),
        show_name: player.show_name || '未知玩家',
        avatar: avatar,
    };
}

/**
 * 标准化洞数据
 * @param {any} hole
 * @param {number} index 洞在列表中的索引位置（从1开始）
 * @returns {object}
 */
function normalizeHole(hole, index = null) {
    return {
        ...hole,
        holeid: hole.holeid != null ? String(hole.holeid) : '',
        unique_key: hole.unique_key != null ? String(hole.unique_key) : '',
        par: Number(hole.par),
        hindex: index || hole.hindex, // 添加hindex字段
        // 确保 holename 字段存在，如果没有则使用默认值
        holename: hole.holename || `洞${index || hole.hindex || '?'}`
    };
}

/**
 * 标准化分数数据
 * @param {any} score
 * @returns {object}
 */
function normalizeScore(score) {
    return {
        score: Number(score.score) || 0,
        putts: Number(score.putts) || 0,
        penalty_strokes: Number(score.penalty_strokes) || 0,
        sand_save: Number(score.sand_save) || 0,
    };
}

/**
 * 标准化score_cards中的洞数据
 * @param {any[]} scoreCards
 */
function normalizeScoreCards(scoreCards) {
    for (const card of scoreCards) {
        if (card.scores && Array.isArray(card.scores)) {
            for (const hole of card.scores) {
                hole.par = Number(hole.par) || 0;
                hole.unique_key = hole.unique_key != null ? String(hole.unique_key) : '';
                hole.holeid = hole.holeid != null ? String(hole.holeid) : '';
            }
        }
    }
}

/**
 * 格式化分数显示
 * @param {number} score
 * @param {number} [par]
 * @returns {string}
 */
function formatScore(score, par) {
    if (!score || score === 0) return '0';
    return score.toString();
}

/**
 * 格式化推杆显示
 * @param {number} putts
 * @returns {string}
 */
function formatPutts(putts) {
    if (!putts || putts === 0) return '0';
    return putts.toString();
}

/**
 * 格式化差值显示
 * @param {number} score
 * @param {number} par
 * @returns {string}
 */
function formatDiff(score, par) {
    if (!score || !par) return '0';
    const diff = score - par;
    if (diff === 0) return '0';
    return diff > 0 ? `+${diff}` : diff.toString();
}

/**
 * 计算分数样式类
 * @param {number} diff
 * @returns {string}
 */
function getScoreClass(diff) {
    if (diff <= -2) return 'score-eagle';
    if (diff === -1) return 'score-birdie';
    if (diff === 0) return 'score-par';
    if (diff === 1) return 'score-bogey';
    if (diff === 2) return 'score-double-bogey';
    if (diff >= 3) return 'score-triple-bogey';
    return 'score-par';
}

/**
 * 转换玩家对象数组为用户ID数组
 * @param {Array} playersArray 玩家对象数组
 * @returns {Array} 用户ID数组
 */
function convertToUserIds(playersArray) {
    if (!Array.isArray(playersArray)) return [];
    return playersArray.map(player => {
        const rawId = player?.user_id;
        const id = Number.parseInt(`${rawId}`) || 0;
        return id;
    });
}

/**
 * 将一维分数数组构建为 user_id -> hindex 的索引 Map
 * @param {Array} scores
 * @returns {Map<string, Map<string, object>>}
 */
function buildScoreIndex(scores = []) {
    const index = new Map();
    for (const score of scores) {
        if (!score) continue;

        const userId = String(score.user_id ?? '');
        const holeIndex = String(score.hindex ?? '');

        if (!userId || !holeIndex) continue;

        let holes = index.get(userId);
        if (!holes) {
            holes = new Map();
            index.set(userId, holes);
        }
        holes.set(holeIndex, score);
    }
    return index;
}

module.exports = {
    normalizePlayer,
    normalizeHole,
    normalizeScore,
    normalizeScoreCards,
    formatScore,
    formatPutts,
    formatDiff,
    getScoreClass,
    convertToUserIds,
    buildScoreIndex
};
