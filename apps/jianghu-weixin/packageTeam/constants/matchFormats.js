/**
 * 比赛赛制配置
 * 队内赛和队际赛共用
 * 队际赛不读取 requireGameTag 参数
 */

export const MATCH_FORMATS = [
    {
        value: 'individual_stroke',
        label: '个人比杆赛',
        requireGameTag: false,
        isMatch: false,
        hideTags: true,
        byScore: true,
    },
    {
        value: 'fourball_best_stroke',
        label: '四人四球最好成绩比杆赛',
        requireGameTag: false,
        isMatch: false,
        hideTags: true,
        byScore: true,

    },
    {
        value: 'fourball_oneball_stroke',
        label: '四人四球最佳球位比杆赛(旺波)',
        requireGameTag: false,
        isMatch: false,
        hideTags: true,
        byScore: true,

    },
    {
        value: 'foursome_stroke',
        label: '四人两球比杆赛',
        requireGameTag: false,
        isMatch: false,
        hideTags: true,
        byScore: true,
    },
    {
        value: 'individual_match',
        label: '个人比洞赛',
        requireGameTag: true,
        isMatch: true,
        hideTags: false,
        byScore: false,
    },
    {
        value: 'fourball_best_match',
        label: '四人四球最好成绩比洞赛',
        requireGameTag: true,
        isMatch: true,
        hideTags: false,
        byScore: false,
    },
    {
        value: 'fourball_oneball_match',
        label: '四人四球最佳球位比洞赛(旺波)',
        requireGameTag: true,
        isMatch: true,
        hideTags: false,
        byScore: false,

    },
    {
        value: 'foursome_match',
        label: '四人两球比洞赛',
        requireGameTag: true,
        isMatch: true,
        hideTags: false,
        byScore: false,
    }
]

/**
 * 获取赛制配置（带禁用状态，用于队际赛）
 * @param {number} teamCount - 球队数量
 * @returns {Array} 赛制配置数组，超过2队时比洞赛会被禁用
 */
export function getMatchFormatsWithDisabled(teamCount) {
    return MATCH_FORMATS.map(format => ({
        ...format,
        // 超过2队时禁用比洞赛
        disabled: format.isMatch && teamCount > 2
    }))
}

/**
 * 根据value获取赛制配置
 * @param {string} value - 赛制value
 * @returns {Object|undefined} 赛制配置
 */
export function getMatchFormatByValue(value) {
    return MATCH_FORMATS.find(f => f.value === value)
}
