
Component({
    properties: {

        // 洞列表数据
        holeList: {
            type: Array,
            value: []
        },
        holePlayList: {
            type: Array,
            value: []
        }
    },

    data: {
        ifShowModal: false,
    },


    methods: {

        // 显示起始洞选择弹框
        showModal() {
            this.setData({ ifShowModal: true });
        },



        // 统一弹框显示入口
        onShowModal(e) {
            // this.showModal();
            this.setData({ ifShowModal: true });

        },


        onModalCancel(e) {
            this.setData({ ifShowModal: false });
        },



    }
}); 