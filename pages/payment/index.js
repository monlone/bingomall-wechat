const WXAPI = require('apifm-wxapi')
const wechatPay = require('../../utils/pay.js')
const AUTH = require('../../utils/auth')

Page({
    /**
     * 页面的初始数据
     */
    data: {
        rechargeSendRules: []
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {

    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        AUTH.checkHasLogged().then(isLoggedIn => {
            if (isLoggedIn) {
                WXAPI.payBillDiscounts().then(res => {
                    if (res.code === 0) {
                        this.setData({
                            rechargeSendRules: res.data
                        });
                    }
                })
            } else {
                wx.showModal({
                    title: '提示',
                    content: '本次操作需要您的登录授权',
                    cancelText: '暂不登录',
                    confirmText: '前往登录',
                    success(res) {
                        if (res.confirm) {
                            wx.switchTab({
                                url: "/pages/my/index"
                            })
                        } else {
                            wx.navigateBack()
                        }
                    }
                })
            }
        })
    },
    async bindSave(e) {
        const _this = this
        const amount = e.detail.value.amount;
        if (amount === "" || amount * 1 < 0) {
            wx.showToast({
                title: '请填写正确的消费金额',
                icon: 'none'
            })
            return
        }
        const userMoney = await WXAPI.userAmount()
        if (userMoney.code !== 0) {
            wx.showToast({
                title: userMoney.msg,
                icon: 'none'
            })
            return
        }
        const rechargeSendRule = this.data.rechargeSendRules.sort((a, b) => {
            return b.consume - a.consume
        }).find(ele => {
            return amount >= ele.consume
        })
        let _msg = '您本次消费 ' + amount + ' 元'
        let needPayAmount = amount * 1
        if (rechargeSendRule) {
            needPayAmount -= rechargeSendRule.discounts
            _msg += ',优惠 ' + rechargeSendRule.discounts + ' 元'
        }
        if (userMoney.data.balance > 0) {
            _msg += ',当前账户可用余额 ' + userMoney.data.balance + ' 元'
        }
        needPayAmount = needPayAmount.toFixed(2) // 需要买单支付的金额
        const wechatPayAmount = (needPayAmount - userMoney.data.balance).toFixed(2) // 需要额外微信支付的金额
        console.log(needPayAmount)
        console.log(wechatPayAmount)

        if (wechatPayAmount > 0) {
            _msg += ',仍需微信支付 ' + wechatPayAmount + ' 元'
        }
        wx.showModal({
            title: '请确认消费金额',
            content: _msg,
            confirmText: "确认支付",
            cancelText: "取消支付",
            success: function (res) {
                console.log(res);
                if (res.confirm) {
                    _this.goPay(amount, wechatPayAmount)
                }
            }
        });
    },
    goPay(amount, wechatPayAmount) {
        if (wechatPayAmount > 0) {
            wechatPay.wechatPay('payBill', wechatPayAmount, 0, "/pages/asset/index", {money: amount});
        } else {
            WXAPI.payBill(amount).then(function (res) {
                if (res.code === 0) {
                    wx.showModal({
                        title: '成功',
                        content: '买单成功，欢迎下次光临！',
                        showCancel: false
                    })
                } else {
                    wx.showModal({
                        title: '失败',
                        content: res.message,
                        showCancel: false
                    })
                }
            })
        }
    }
})