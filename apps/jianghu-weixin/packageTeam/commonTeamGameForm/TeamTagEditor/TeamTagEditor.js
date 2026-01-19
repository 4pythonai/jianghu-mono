import { MATCH_FORMATS } from '../../constants/matchFormats'

Component({
    options: {
        styleIsolation: 'apply-shared'
    },

    properties: {
        gameType: {
            type: String,
            value: ''
        },
        currentFormat: {
            type: Object,
            value: {},
            observer(newVal) {
                if (newVal && newVal.hideTags) {
                    this.setData({ tagsExpanded: false })
                }
                this.logFormatConfig(newVal)
            }
        },
        gameTags: {
            type: Array,
            value: []
        }
    },

    data: {
        matchFormats: MATCH_FORMATS,
        tagsExpanded: false
    },

    lifetimes: {
        attached() {
            this.logFormatConfig(this.data.currentFormat)
        }
    },

    methods: {
        toggleTags() {
            this.setData({ tagsExpanded: !this.data.tagsExpanded })
        },

        logFormatConfig(format = {}) {
            const { label, byScore, requireGameTag, isMatch } = format
            console.log('🔴🟢🔵 hideTags:', format.hideTags);
            console.log('🟥🟧🟨[TeamTagEditor] game tags:', this.data.gameTags)

        },

        handleAddTag() {
            this.triggerEvent('addTag')
        },

        handleTagNameInput(e) {
            const index = e.currentTarget.dataset.index
            const value = e.detail.value
            this.triggerEvent('tagNameInput', { index, value })
        },

        handleDeleteTag(e) {
            const index = e.currentTarget.dataset.index
            this.triggerEvent('deleteTag', { index })
        }
    }
})
