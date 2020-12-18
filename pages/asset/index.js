const app = getApp()
const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')

let sliderWidth = 96; // 需要设置slider的宽度，用于计算中间位置

Page({
    /**
     * 页面的初始数据
     */
    data: {
        wechatLogin: true,
        balance: 0.00,
        freeze: 0,
        score: 0,
        score_sign_continuous: 0,
        cashLogs: undefined,

        tabs: ["资金明细", "提现记录", "押金记录"],
        activeIndex: 0,
        sliderOffset: 0,
        sliderLeft: 0,

        withDrawLogs: undefined,
        depositLogs: undefined,

        rechargeOpen: false // 是否开启充值[预存]功能
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function () {
        const that = this;
        wx.getSystemInfo({
            success: function (res) {
                that.setData({
                    sliderLeft: (res.windowWidth / that.data.tabs.length - sliderWidth) / 2,
                    sliderOffset: res.windowWidth / that.data.tabs.length * that.data.activeIndex
                });
            }
        });
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        AUTH.checkHasLogged().then(isLoggedIn => {
            this.setData({
                wechatLogin: isLoggedIn
            })
            if (isLoggedIn) {
                this.doneShow();
            }
        })
    },
    doneShow: function () {
        const _this = this
        const token = wx.getStorageSync('token')
        if (!token) {
            this.setData({
                wechatLogin: false
            })
            return
        }
        WXAPI.userAmount().then(function (res) {
            if (res.code === 700) {
                wx.showToast({
                    title: '当前账户存在异常',
                    icon: 'none'
                })
                return
            }
            if (res.code === 2000) {
                _this.setData({
                    wechatLogin: false
                })
                return
            }
            if (res.code === 0) {
                _this.setData({
                    balance: res.data.balance.toFixed(2),
                    freeze: res.data.freeze.toFixed(2),
                    totalConsumed: res.data.balance.toFixed(2),
                    score: res.data.score
                });
            }
        })
        this.fetchTabData(this.data.activeIndex)
    },
    fetchTabData(activeIndex) {
        if (activeIndex === 0) {
            this.cashLogs()
        }
        if (activeIndex === 1) {
            this.withDrawLogs()
        }
        if (activeIndex === 2) {
            this.depositLogs()
        }
    },
    cashLogs() {
        const _this = this
        WXAPI.cashLogs({
            page: 1,
            pageSize: 50
        }).then(res => {
            if (res.code === 0) {
                _this.setData({
                    cashLogs: res.data.rows
                })
            }
        })
    },
    withDrawLogs() {
        const _this = this
        WXAPI.withDrawLogs({
            page: 1,
            pageSize: 50
        }).then(res => {
            if (res.code === 0) {
                _this.setData({
                    withDrawLogs: res.data.rows
                })
            }
        })
    },
    depositLogs() {
        const _this = this
        WXAPI.depositList({
            page: 1,
            pageSize: 50
        }).then(res => {
            if (res.code === 0) {
                _this.setData({
                    depositLogs: res.data.result
                })
            }
        })
    },

    recharge: function (e) {
        wx.navigateTo({
            url: "/pages/recharge/index"
        })
    },
    withdraw: function (e) {
        wx.navigateTo({
            url: "/pages/withdraw/index"
        })
    },
    payDeposit: function (e) {
        wx.navigateTo({
            url: "/pages/deposit/pay"
        })
    },
    tabClick: function (e) {
        this.setData({
            sliderOffset: e.currentTarget.offsetLeft,
            activeIndex: e.currentTarget.id
        });
        this.fetchTabData(e.currentTarget.id)
    },
    cancelLogin() {
        wx.switchTab({
            url: '/pages/my/index'
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
})