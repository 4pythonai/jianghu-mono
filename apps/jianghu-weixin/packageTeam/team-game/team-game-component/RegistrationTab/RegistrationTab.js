/**
 * 报名人员Tab组件
 * 展示按分队分组的报名人员列表
 */
import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '../../../../stores/game/gameStore'

Component({
    properties: {
        mode: {
            type: String,
            value: 'display'
        }
    },

    data: {
        tagMemberGroups: [],
        editVisible: false,
        editForm: {
            userId: null,
            showName: '',
            gender: 'unknown',
            prevTagId: null,
            newTagId: null,
            prevTagName: '',
            newTagName: ''
        },
        editTagIndex: 0
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
                    'tagMembers',
                    'gameid'
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
        },

        handleEditMember(event) {
            if (this.data.mode !== 'edit') return

            const member = event.detail?.member
            if (!member) return

            const tags = Array.isArray(this.data.gameTags) ? this.data.gameTags : []
            const targetTagId = member.tagId
            const tagIndex = tags.findIndex(tag => String(tag.id) === String(targetTagId))
            const safeIndex = tagIndex >= 0 ? tagIndex : 0
            const selectedTag = tags[safeIndex]
            const prevTagName = member.tagName || selectedTag?.tagName || ''
            const newTagName = selectedTag?.tagName || prevTagName
            const newTagId = selectedTag?.id ?? targetTagId

            this.setData({
                editVisible: true,
                editTagIndex: safeIndex,
                editForm: {
                    userId: member.userId,
                    showName: member.showName || '',
                    gender: member.gender || 'unknown',
                    prevTagId: targetTagId ?? null,
                    newTagId: newTagId ?? null,
                    prevTagName: prevTagName,
                    newTagName: newTagName
                }
            })
        },

        handleEditCancel() {
            this.setData({ editVisible: false })
        },

        handleNicknameInput(event) {
            const value = event.detail?.value || ''
            this.setData({ 'editForm.showName': value })
        },

        handleGenderSelect(event) {
            const value = event.currentTarget?.dataset?.value
            if (!value) return
            this.setData({ 'editForm.gender': value })
        },

        handleTagChange(event) {
            const index = Number(event.detail?.value || 0)
            const tags = Array.isArray(this.data.gameTags) ? this.data.gameTags : []
            const selectedTag = tags[index]
            if (!selectedTag) return

            this.setData({
                editTagIndex: index,
                'editForm.newTagId': selectedTag.id,
                'editForm.newTagName': selectedTag.tagName || ''
            })
        },

        handleEditConfirm() {
            const { gameid, editForm } = this.data
            console.log('[RegistrationTab] edit confirm', {
                gameid,
                prev_tag_id: editForm.prevTagId,
                new_tag_id: editForm.newTagId
            })
        }
    }
})
