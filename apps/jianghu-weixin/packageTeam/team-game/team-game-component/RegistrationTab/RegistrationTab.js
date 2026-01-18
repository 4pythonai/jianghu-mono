/**
 * 报名人员Tab组件
 * 展示按分队分组的报名人员列表
 */
import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '../../../../stores/game/gameStore'

Component({
    data: {
        tagMemberGroups: []
    },

    observers: {
        'game_type, match_format': function (game_type, match_format) {
            console.log('[RegistrationTab] game_type/match_format:', {
                game_type,
                match_format
            })
        },
        'gameTags, tagMembers': function (gameTags, tagMembers) {
            this.buildTagMemberGroups(gameTags, tagMembers)
        }
    },

    lifetimes: {
        attached() {
            // 绑定 gameStore
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: [
                    'game_type',
                    'match_format',
                    'gameTags',
                    'tagMembers'
                ],
                actions: []
            })
            // 初始化时计算一次
            this.buildTagMemberGroups(gameStore.gameTags, gameStore.tagMembers)
        },
        detached() {
            if (this.storeBindings) {
                this.storeBindings.destroyStoreBindings()
            }
        }
    },

    methods: {
        /**
         * 构建报名人员分组数据
         */
        buildTagMemberGroups(gameTags = [], tagMembers = []) {
            const tags = Array.isArray(gameTags) ? gameTags : []
            const members = Array.isArray(tagMembers) ? tagMembers : []
            const groups = tags.map(tag => ({
                tagId: tag.id,
                tagName: tag.tagName,
                color: tag.color || '',
                members: []
            }))

            const groupMap = new Map()
            const groupCounters = new Map()
            groups.forEach(group => {
                if (group.tagId !== undefined && group.tagId !== null) {
                    groupMap.set(String(group.tagId), group)
                }
            })

            const extraGroups = new Map()
            members.forEach(member => {
                const tagId = member.tag_id
                const key = tagId !== undefined && tagId !== null ? String(tagId) : ''
                let group = groupMap.get(key)

                if (group) {
                    const nextIndex = (groupCounters.get(group) || 0) + 1
                    groupCounters.set(group, nextIndex)
                    group.members.push({ ...member, tagSeq: nextIndex })
                    return
                }

                if (!extraGroups.has(key)) {
                    console.log('[RegistrationTab] 发现未匹配 tag 的成员', {
                        tagId: tagId,
                        tagName: member.tagName || '',
                        userId: member.user_id
                    })
                    extraGroups.set(key, {
                        tagId: tagId,
                        tagName: member.tagName || '未分组',
                        color: member.tagColor || '',
                        members: []
                    })
                }
                group = extraGroups.get(key)
                const nextIndex = (groupCounters.get(group) || 0) + 1
                groupCounters.set(group, nextIndex)
                group.members.push({ ...member, tagSeq: nextIndex })
            })

            const result = groups.concat(Array.from(extraGroups.values()))
            console.log('[RegistrationTab] 刷新报名分组', {
                gameTagsCount: tags.length,
                tagMembersCount: members.length,
                groupCount: result.length
            })
            this.setData({ tagMemberGroups: result })
        }
    }
})
