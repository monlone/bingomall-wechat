const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')

Page({
    data: {},
    onLoad: function (options) {
    },
    onShow: function () {
        AUTH.checkHasLogged().then(isLoggedIn => {
            this.setData({
                wechatLogin: isLoggedIn
            })
            if (isLoggedIn) {
                this.productsFavList()
            }
        })
    },
    async productsFavList() {
        // 搜索商品
        wx.showLoading({
            title: '加载中',
        })
        const _data = {
            page: 1,
            pageSize: 10000,
        }
        const res = await WXAPI.productsFavList(_data)
        wx.hideLoading()
        if (res.code === 0) {
            this.setData({
                products: res.data.rows,
            })
        } else {
            this.setData({
                products: null
            })
        }
    },
    async removeFav(e) {
        const id = e.currentTarget.dataset.id
        const res = await WXAPI.productsFavDelete('', id)
        if (res.code === 0) {
            wx.showToast({
                title: '取消收藏',
                icon: 'success'
            })
            this.productsFavList()
        } else {
            wx.showToast({
                title: res.message,
                icon: 'none'
            })
        }
    },
})