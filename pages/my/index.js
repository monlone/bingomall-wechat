const app = getApp()
const CONFIG = require('../../config.js')
const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const TOOLS = require('../../utils/tools.js')

Page({
    data: {
        wechatLogin: true,
        balance: 0.00,
        freeze: 0,
        score: 0,
        growth: 0,
        score_sign_continuous: 0,
        rechargeOpen: false, // 是否开启充值[预存]功能

        // 用户订单统计数据
        noConfirm: 0,
        noPay: 0,
        noReview: 0,
        noShipped: 0,
    },
    onLoad() {
    },
    onShow() {
        const _this = this;
        const order_hx_userIds = wx.getStorageSync('order_hx_userIds');
        this.setData({
            version: CONFIG.version,
            order_hx_userIds
        })
        AUTH.checkHasLogged().then(isLoggedIn => {
            this.setData({
                wechatLogin: isLoggedIn
            });
            if (isLoggedIn) {
                _this.getUserApiInfo();
                _this.getUserAmount();
                _this.orderStatistics();
                // 获取购物车数据，显示TabBarBadge
                TOOLS.showTabBarBadge();
            }
        })
    },
    aboutUs: function () {
        wx.showModal({
            title: '关于我们',
            content: '本系统基于开源小程序商城系统 https://github.com/EastWorld/wechat-app-mall 搭建，祝大家使用愉快！',
            showCancel: false
        })
    },
    loginOut() {
        AUTH.loginOut()
        wx.reLaunch({
            url: '/pages/my/index'
        })
    },
    getPhoneNumber: function (e) {
        if (!e.detail.errMsg || e.detail.errMsg !== "getPhoneNumber:ok") {
            if (e.detail.errMsg === "getPhoneNumber:fail user deny") {
                e.detail.errMsg = "请您充许获取手机号！"
            }
            wx.showModal({
                title: '提示',
                content: e.detail.errMsg,
                showCancel: false
            })
            return;
        }
        WXAPI.bindMobileWxa(e.detail.encryptedData, e.detail.iv).then(res => {
            if (res.code === 10002) {
                this.setData({
                    wechatLogin: false
                })
                return
            }
            if (res.code === 0) {
                wx.showToast({
                    title: '绑定成功',
                    icon: 'success',
                    duration: 2000
                });
                this.getUserApiInfo();
            } else {
                wx.showModal({
                    title: '提示',
                    content: res.message,
                    showCancel: false
                })
            }
        })
    },
    getUserApiInfo: function () {
        let that = this;
        WXAPI.userDetail().then(function (res) {
            if (res.code === 0) {
                let _data = {};
                _data.apiUserInfoMap = res.data;
                if (res.data.mobile) {
                    _data.userMobile = res.data.mobile
                }
                if (that.data.order_hx_userIds && that.data.order_hx_userIds.indexOf(res.data.id) !== -1) {
                    _data.canHX = true // 具有扫码核销的权限
                }
                that.setData(_data);
            }
        })
    },
    getUserAmount: function () {
        let that = this;
        WXAPI.userAmount().then(function (res) {
            if (res.code === 0) {
                that.setData({
                    balance: res.data.balance.toFixed(2),
                    freeze: res.data.freeze.toFixed(2),
                    score: res.data.score,
                    growth: res.data.growth
                });
            }
        })
    },
    handleOrderCount: function (count) {
        return count > 99 ? '99+' : count;
    },
    orderStatistics: function () {
        WXAPI.orderStatistics().then((res) => {
            if (res.code === 0) {
                const data = res.data;
                this.setData({
                    noPay: this.handleOrderCount(data.noPay),
                    noShipped: this.handleOrderCount(data.noShipped),
                    noConfirm: this.handleOrderCount(data.noConfirm),
                    noReview: this.handleOrderCount(data.noReview),
                })
            }
        })
    },
    goAsset: function () {
        wx.navigateTo({
            url: "/pages/asset/index"
        })
    },
    goScore: function () {
        wx.navigateTo({
            url: "/pages/score/index"
        })
    },
    goOrder: function (e) {
        wx.navigateTo({
            url: "/pages/order-list/index?status=" + e.currentTarget.dataset.status
        })
    },
    cancelLogin() {
        this.setData({
            wechatLogin: true
        })
    },
    goLogin() {
        this.setData({
            wechatLogin: false
        })
    },
    processLogin(e) {
        if (!e.detail.userInfo) {
            wx.showToast({
                title: '已取消',
                icon: 'none',
            })
            return;
        }
        AUTH.register(this);
    },
    scanOrderCode() {
        wx.scanCode({
            onlyFromCamera: true,
            success(res) {
                wx.navigateTo({
                    url: '/pages/order-details/scan-result?verificationNumber=' + res.result,
                })
            },
            fail(err) {
                console.error(err)
                wx.showToast({
                    title: err.errMsg,
                    icon: 'none'
                })
            }
        })
    },
    clearStorage() {
        wx.clearStorageSync();
        wx.showToast({
            title: '已清除',
            icon: 'success'
        })
    },
})