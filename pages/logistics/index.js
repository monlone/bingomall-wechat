const WXAPI = require('apifm-wxapi')
const app = getApp()
Page({
    data: {},
    onLoad: function (e) {
        this.data.orderId = e.id;
    },
    onShow: function () {
        let that = this;
        WXAPI.orderDetail(that.data.orderId).then(function (res) {
            if (res.code !== 0) {
                wx.showModal({
                    title: '错误',
                    content: res.message,
                    showCancel: false
                })
                return;
            }
            that.setData({
                orderDetail: res.data,
                logisticsTraces: res.data.logisticsTraces.reverse()
            });
        })
    }
})
