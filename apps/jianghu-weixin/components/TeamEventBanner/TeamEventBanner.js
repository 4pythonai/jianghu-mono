/**
 * 球队赛事封面组件
 * 支持队内赛（单个logo）和队际赛（多个logo）两种模式
 */
import { config } from '@/api/config'

Component({
    properties: {
        /** 赛事类型: single_team | cross_teams */
        gameType: {
            type: String,
            value: 'single_team'
        },
        /** 赛事标题 */
        title: {
            type: String,
            value: ''
        },
        /** 球队名称（队内赛） */
        teamName: {
            type: String,
            value: ''
        },
        /** 球队头像（队内赛）- 支持相对路径或完整URL */
        teamAvatar: {
            type: String,
            value: ''
        },
        /** 球队列表（队际赛）[{team_name, team_avatar}] */
        teams: {
            type: Array,
            value: []
        },
        /** 背景图片URL - 支持相对路径或完整URL */
        backgroundImage: {
            type: String,
            value: ''
        },
        /** 封面类型（与 TeamGameItem 一致）: single | multiple | default */
        coverType: {
            type: String,
            value: ''
        },
        /** 封面列表（与 TeamGameItem 一致） */
        covers: {
            type: Array,
            value: []
        }
    },

    data: {
        staticURL: config.staticURL,
        defaultBg: '/images/event-banner-bg.jpg',
        defaultAvatar: '/images/default-team.png'
    },

    observers: {
        'teamAvatar': function (avatar) {
            this.setData({
                fullTeamAvatar: this._getFullUrl(avatar, this.data.defaultAvatar)
            })
        },
        'backgroundImage': function (bg) {
            this.setData({
                fullBgImage: this._getFullUrl(bg, this.data.defaultBg)
            })
        },
        'teams': function (teams) {
            if (teams && teams.length > 0) {
                const processedTeams = teams.map(team => ({
                    ...team,
                    fullAvatar: this._getFullUrl(team.team_avatar, this.data.defaultAvatar)
                }))
                this.setData({ processedTeams })
            }
        },
        'covers, coverType': function (covers, coverType) {
            // 如果有 covers 数据，优先使用它来渲染（与 TeamGameItem 一致）
            if (covers && covers.length > 0) {
                this.setData({
                    hasCovers: true,
                    processedCovers: covers.map(url => this._getFullUrl(url, this.data.defaultAvatar))
                })
            } else {
                this.setData({ hasCovers: false })
            }
        }
    },

    lifetimes: {
        attached() {
            // 初始化时处理图片URL
            this.setData({
                fullTeamAvatar: this._getFullUrl(this.properties.teamAvatar, this.data.defaultAvatar),
                fullBgImage: this._getFullUrl(this.properties.backgroundImage, this.data.defaultBg)
            })

            // 处理球队列表
            if (this.properties.teams && this.properties.teams.length > 0) {
                const processedTeams = this.properties.teams.map(team => ({
                    ...team,
                    fullAvatar: this._getFullUrl(team.team_avatar, this.data.defaultAvatar)
                }))
                this.setData({ processedTeams })
            }

            // 处理 covers 数据
            if (this.properties.covers && this.properties.covers.length > 0) {
                this.setData({
                    hasCovers: true,
                    processedCovers: this.properties.covers.map(url => this._getFullUrl(url, this.data.defaultAvatar))
                })
            }
        }
    },

    methods: {
        /**
         * 将相对路径转换为完整URL
         * @param {string} path - 图片路径（相对或完整）
         * @param {string} defaultPath - 默认路径
         * @returns {string} 完整URL
         */
        _getFullUrl(path, defaultPath) {
            const staticURL = this.data.staticURL

            // 如果为空，使用默认路径
            if (!path) {
                return staticURL + defaultPath
            }

            // 已经是完整URL，直接返回
            if (path.startsWith('http://') || path.startsWith('https://')) {
                return path
            }

            // 相对路径，拼接staticURL
            return staticURL + (path.startsWith('/') ? path : '/' + path)
        }
    }
})
