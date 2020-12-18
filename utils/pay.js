const WXAPI = require('apifm-wxapi')

/**
 * type: order 支付订单 recharge 充值 payBill 优惠买单
 * data: 扩展数据对象，用于保存参数
 */
function wechatPay(type, money, orderId, redirectUrl, data) {
    const postData = {
        money: money,
        remark: "在线充值",
    };
    if (type === 'order') {
        postData.orderId = orderId;
        postData.remark = "支付订单 ：" + orderId;
        postData.nextAction = {
            type: 0,
            orderId: orderId
        };
    }
    if (type === 'payBill') {
        postData.remark = "优惠买单 ：" + data.money;
        postData.nextAction = {
            type: 4,
            userId: wx.getStorageSync('userId'),
            money: data.money,
            orderId: orderId
        };
    }
    postData.payName = postData.remark;
    if (postData.nextAction) {
        postData.nextAction = JSON.stringify(postData.nextAction);
    }
    WXAPI.wechatPay(postData).then(function (res) {
        if (res.code !== 0) {
            wx.showModal({
                title: '出错了',
                content: JSON.stringify(res),
                showCancel: false
            })
            return
        }
        wx.requestPayment({
            timeStamp: res.data.timeStamp,
            nonceStr: res.data.nonceStr,
            package: res.data.package,
            signType: res.data.signType,
            paySign: res.data.paySign,
            fail: function (failData) {
                console.log(failData)
                wx.showToast({
                    title: '支付失败!'
                })
            },
            success: function () {
                let data = {}
                data.userId = postData.userId
                data.orderId = postData.orderId
                WXAPI.updateOrder(postData).then(function (res) {
                    if (res.code === 0) {
                        wx.showToast({
                            title: '支付成功'
                        })
                    } else {
                        wx.showModal({
                            title: '出错了',
                            content: JSON.stringify(res),
                            showCancel: false
                        })
                    }
                })
                wx.redirectTo({
                    url: redirectUrl
                });
            }
        })
    })
}


module.exports = {
    wechatPay: wechatPay,
}