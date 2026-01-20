import { getMatchFormatByValue } from '../../../../constants/matchFormats'

Component({
    properties: {
        eventDetail: {
            type: Object,
            value: {}
        },
        matchFormat: {
            type: String,
            value: ''
        }
    },

    data: {
        matchFormatLabel: ''
    },

    observers: {
        matchFormat(value) {
            const format = getMatchFormatByValue(value)
            this.setData({
                matchFormatLabel: format ? format.label : ''
            })
        }
    }
})
