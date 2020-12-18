const app = getApp();
const CONFIG = require('../../config.js')
const WXAPI = require('apifm-wxapi')
import wxbarcode from 'wxbarcode'

Page({
    data: {
        orderId: 0,
        productList: [],
    },
    onLoad: function (e) {
        // e.id = 478785
        const accountInfo = wx.getAccountInfoSync()
        let orderId = e.id;
        this.data.orderId = orderId;
        this.setData({
            orderId: orderId,
            appid: accountInfo.miniProgram.appId
        });
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
            // 绘制核销码
            if (res.data.verificationNumber && res.data.status > 0) {
                wxbarcode.qrcode('qrcode', res.data.verificationNumber, 650, 650);
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
    }
})