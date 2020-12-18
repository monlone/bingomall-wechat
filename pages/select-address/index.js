const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')

const app = getApp()
Page({
    data: {
        addressList: []
    },

    selectTap: function (e) {
        let id = e.currentTarget.dataset.id;
        console.log(e.currentTarget.dataset)

        //原来是更新，觉得不对，改了
        WXAPI.setDefaultAddress({
            id: id,
            isDefault: true
        }).then(function () {
            wx.navigateBack({delta: 1})
        })
    },

    addAddress: function () {
        wx.navigateTo({
            url: "/pages/address-add/index"
        })
    },

    editAddress: function (e) {
        wx.navigateTo({
            url: "/pages/address-add/index?id=" + e.currentTarget.dataset.id
        })
    },

    onLoad: function () {
    },
    onShow: function () {
        AUTH.checkHasLogged().then(isLoggedIn => {
            if (isLoggedIn) {
                this.initShippingAddress();
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
    initShippingAddress: function () {
        let that = this;
        WXAPI.queryAddress().then(function (res) {
            if (res.code === 0) {
                that.setData({
                    addressList: res.data
                });
            } else if (res.code === 700) {
                that.setData({
                    addressList: null
                });
            }
        })
    }

})