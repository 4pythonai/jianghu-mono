/**
 * teamGameUtils.js - Team game data helpers
 */

function normalizeUserId(rawUserId, contextLabel, payload) {
    if (rawUserId === undefined || rawUserId === null) {
        console.error(`ERROR [${contextLabel}]: user_id missing`, payload)
    } else if (typeof rawUserId !== 'number') {
        console.error(`ERROR [${contextLabel}]: user_id not a number`, {
            user_id: rawUserId,
            type: typeof rawUserId,
            payload: payload
        })
    }

    const userId = typeof rawUserId === 'number' ? rawUserId : Number(rawUserId)
    if (isNaN(userId) || userId === 0) {
        console.error(`ERROR [${contextLabel}]: user_id conversion failed`, {
            original: rawUserId,
            converted: userId,
            payload: payload
        })
    }
    return userId
}

export function buildTagMemberGroups(gameTags = [], tagMembers = []) {
    const groups = gameTags.map(tag => ({
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
    tagMembers.forEach(member => {
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
            console.log('[RegistrationTab] unmatched tag member', {
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

    return groups.concat(Array.from(extraGroups.values()))
}

export function buildPlayerGroupMap(groups = []) {
    const map = {}
    groups.forEach(group => {
        (group.players || []).forEach(player => {
            map[String(player.id)] = String(group.id)
        })
    })
    return map
}

export function buildSelectedPlayersForGroup(groups = [], groupId) {
    const targetGroup = groups.find(group => String(group.id) === String(groupId))
    if (!targetGroup || !targetGroup.players) {
        return []
    }

    return targetGroup.players.map(player => {
        const userId = normalizeUserId(player.user_id, 'group-config/loadCurrentGroupPlayers', player)
        return {
            id: String(player.id),
            user_id: userId,
            name: player.show_name || player.name || '',
            avatar: player.avatar,
            teamName: player.teamName || ''
        }
    })
}

export function buildCurrentTagPlayers({
    gameTags = [],
    tagMembers = [],
    currentTagIndex = 0,
    playerGroupMap = {},
    groupId,
    selectedPlayers = []
}) {
    if (gameTags.length === 0) {
        return []
    }

    const currentTag = gameTags[currentTagIndex]
    if (!currentTag) {
        return []
    }

    const selectedSet = new Set(selectedPlayers.map(player => String(player.id)))

    return tagMembers
        .filter(member => member.tagName === currentTag.tagName)
        .map(member => {
            const userId = normalizeUserId(member.user_id, 'group-config/updateCurrentTagPlayers', member)
            const playerId = String(userId)
            const inGroupId = playerGroupMap[playerId]
            const isInCurrentGroup = selectedSet.has(playerId)

            return {
                id: playerId,
                user_id: userId,
                show_name: member.show_name,
                avatar: member.avatar,
                handicap: member.handicap,
                isSelected: isInCurrentGroup,
                isDisabled: inGroupId && String(inGroupId) !== String(groupId),
                inGroupId: inGroupId || null
            }
        })
}

export function buildDisplayPlayers(players = [], creatorId) {
    return players.map(player => ({
        show_name: player.show_name || '未知',
        avatar: player.avatar || '/images/default-avatar.png',
        showDelete: String(player.user_id) === String(creatorId) ? 'n' : 'y',
        user_id: player.user_id
    }))
}

export function isUserRegistered(tagMembers = [], userId) {
    if (!userId) {
        return false
    }
    return tagMembers.some(member => String(member.id) === String(userId))
}
