const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
Page({
    /**
     * 页面的初始数据
     */
    data: {
        listType: 1, // 1为1个商品一行，2为2个商品一行
        name: '', // 搜索关键词
        orderBy: '', // 排序规则
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.setData({
            name: options.name,
            categoryId: options.categoryId
        })
        this.search()
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

    },
    async search() {
        // 搜索商品
        wx.showLoading({
            title: '加载中',
        })
        const _data = {
            orderBy: this.data.orderBy,
            page: 1,
            pageSize: 500,
        }
        if (this.data.name) {
            _data.k = this.data.name
        }
        if (this.data.categoryId) {
            _data.categoryId = this.data.categoryId
        }
        const res = await WXAPI.products(_data)
        wx.hideLoading()
        if (res.code === 0) {
            this.setData({
                products: res.data,
            })
        } else {
            this.setData({
                products: null,
            })
        }
    },
    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },
    changeShowType() {
        this.setData({
            listType: this.data.listType
        })
    },
    bindInput(e) {
        this.setData({
            name: e.detail.value
        })
    },
    bindConfirm(e) {
        this.setData({
            name: e.detail.value
        })
        this.search()
    },
    filter(e) {
        this.setData({
            orderBy: e.currentTarget.dataset.val
        });
        this.search()
    },
    async addShopCart(e) {
        const currentProduct = this.data.products.find(ele => {
            return ele.id === e.currentTarget.dataset.id
        });
        if (!currentProduct) {
            return
        }
        if (currentProduct.stock <= 0) {
            wx.showToast({
                title: '已售罄~',
                icon: 'none'
            });
            return
        }
        this.addShopCartCheck({
            id: currentProduct.id,
            buyNumber: 1,
            sku: []
        })
    },
    async addShopCartCheck(options) {
        AUTH.checkHasLogged().then(isLoggedIn => {
            this.setData({
                wechatLogin: isLoggedIn
            });
            if (isLoggedIn) {
                // 处理加入购物车的业务逻辑
                this.addShopCartDone(options)
            }
        })
    },
    async addShopCartDone(options) {
        const res = await WXAPI.addItemToShoppingCart(options.id, options.buyNumber, options.sku)
        if (res.code === 30002) {
            // 需要选择规格尺寸
            const skuCurProductsRes = await WXAPI.productsDetail(options.id)
            if (skuCurProductsRes.code !== 0) {
                wx.showToast({
                    title: skuCurProductsRes.message,
                    icon: 'none'
                })
                return
            }
            const skuCurProducts = skuCurProductsRes.data
            skuCurProducts.stockBuy = 1
            this.setData({
                skuCurProducts
            })
            return
        }
        if (res.code !== 0) {
            wx.showToast({
                title: res.message,
                icon: 'none'
            })
            return
        }
        wx.showToast({
            title: '加入成功',
            icon: 'success'
        })
        this.setData({
            skuCurProducts: null
        })
    },
    stockAdd() {
        const skuCurProducts = this.data.skuCurProducts
        if (skuCurProducts.basicInfo.stockBuy < skuCurProducts.basicInfo.stock) {
            skuCurProducts.basicInfo.stockBuy++
            this.setData({
                skuCurProducts
            })
        }
    },
    stockReduce() {
        const skuCurProducts = this.data.skuCurProducts
        if (skuCurProducts.basicInfo.stockBuy > 1) {
            skuCurProducts.basicInfo.stockBuy--
            this.setData({
                skuCurProducts
            })
        }
    },
    closeSku() {
        this.setData({
            skuCurProducts: null
        })
        wx.showTabBar()
    },
    skuSelect(e) {
        const pid = e.currentTarget.dataset.pid
        const id = e.currentTarget.dataset.id
        // 处理选中
        const skuCurProducts = this.data.skuCurProducts
        const property = skuCurProducts.properties.find(ele => {
            return ele.id === pid
        })
        property.childsCurProducts.forEach(ele => {
            if (ele.id === id) {
                ele.active = true
            } else {
                ele.active = false
            }
        })
        this.setData({
            skuCurProducts
        })
    },
    addCartSku() {
        const skuCurProducts = this.data.skuCurProducts
        const propertySize = skuCurProducts.properties.length // 有几组SKU
        const sku = []
        skuCurProducts.properties.forEach(p => {
            const o = p.childsCurProducts.find(ele => {
                return ele.active
            })
            if (!o) {
                return
            }
            sku.push({
                optionId: o.propertyId,
                optionValueId: o.id
            })
        })
        if (sku.length !== propertySize) {
            wx.showToast({
                title: '请选择规格',
                icon: 'none'
            })
            return
        }
        const options = {
            id: skuCurProducts.basicInfo.id,
            buyNumber: skuCurProducts.basicInfo.stockBuy,
            sku
        }
        this.addShopCartDone(options)
    },
})