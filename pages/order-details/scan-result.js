const WXAPI = require('apifm-wxapi')

Page({
    data: {},
    onLoad: function (e) {
        // e.verificationNumber = '2003201758574236'
        this.setData({
            verificationNumber: e.verificationNumber
        });
    },
    onShow: function () {
        let that = this;
        WXAPI.orderDetail(this.data.verificationNumber).then(function (res) {
            if (res.code !== 0) {
                wx.showModal({
                    title: '错误',
                    content: res.message,
                    showCancel: false
                })
                return;
            }
            that.setData({
                orderDetail: res.data
            });
        })
    },
    logisticsDetailsTap: function (e) {
        let orderId = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: "/pages/logistics/index?id=" + orderId
        })
    },
    confirmBtnTap: function (e) {
        let that = this;
        let orderId = this.data.orderId;
        wx.showModal({
            title: '确认您已收到商品？',
            content: '',
            success: function (res) {
                if (res.confirm) {
                    WXAPI.orderDelivery(orderId).then(function (res) {
                        if (res.code === 0) {
                            that.onShow();
                        }
                    })
                }
            }
        })
    },
    submitReputation: function (e) {
        let that = this;
        let postJsonString = {};
        postJsonString.orderId = this.data.orderId;
        let reputations = [];
        let i = 0;
        while (e.detail.value["orderProductsId" + i]) {
            let orderProductsId = e.detail.value["orderProductsId" + i];
            let productReputation = e.detail.value["productReputation" + i];
            let productReputationRemark = e.detail.value["productReputationRemark" + i];

            let reputations_json = {};
            reputations_json.id = orderProductsId;
            reputations_json.reputation = productReputation;
            reputations_json.remark = productReputationRemark;

            reputations.push(reputations_json);
            i++;
        }
        postJsonString.reputations = reputations;
        WXAPI.orderReputation({
            postJsonString: JSON.stringify(postJsonString)
        }).then(function (res) {
            if (res.code === 0) {
                that.onShow();
            }
        })
    },
    async doneHx() {
        wx.showLoading({
            title: '处理中...',
        })
        const res = await WXAPI.orderHX(this.data.verificationNumber)
        wx.hideLoading()
        if (res.code !== 0) {
            wx.showToast({
                title: res.message,
                icon: 'none'
            })
        } else {
            wx.showToast({
                title: '核销完成',
                icon: 'none'
            })
            this.onShow()
        }
    },
})