const WXAPI = require('apifm-wxapi');
const AUTH = require('../../utils/auth');
const TOOLS = require('../../utils/tools.js');  // TOOLS.showTabBarBadge();

Page({
    /**
     * 页面的初始数据
     */
    data: {
        categories: [],
        categorySelected: {
            name: '',
            id: ''
        },
        currentProducts: [],
        onLoadStatus: true,
        scrollTop: 0,

        skuCurProducts: undefined
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        wx.showShareMenu({
            withShareTicket: true
        });
        this.categories();
    },
    async categories() {
        wx.showLoading({
            title: '加载中',
        });
        const res = await WXAPI.productsCategory()
        wx.hideLoading();
        let categories = [];
        let categoryName = '';
        let categoryId = '';
        if (res.code === 0) {
            if (this.data.categorySelected.id) {
                const _curCategory = res.data.find(ele => {
                    return ele.categoryId === this.data.categorySelected.id
                });
                categoryName = _curCategory.name;
                categoryId = _curCategory.categoryId;
            }
            for (let i = 0; i < res.data.length; i++) {
                let item = res.data[i];
                categories.push(item);
                if (i === 0 && !this.data.categorySelected.id) {
                    categoryName = item.name;
                    categoryId = item.categoryId;
                }
            }
        }
        this.setData({
            categories: categories,
            categorySelected: {
                name: categoryName,
                id: categoryId
            }
        });
        this.getProductsList();
    },
    async getProductsList() {
        wx.showLoading({
            title: '加载中',
        });
        const res = await WXAPI.products({
            categoryId: this.data.categorySelected.id,
            page: 1,
            pageSize: 100000
        });
        wx.hideLoading();
        if (res.code === 700) {
            this.setData({
                currentProducts: null
            });
            return
        }
        this.setData({
            currentProducts: res.data.rows
        });
    },
    toDetailsTap: function (e) {
        wx.navigateTo({
            url: "/pages/products-details/index?id=" + e.currentTarget.dataset.id
        })
    },
    onCategoryClick: function (e) {
        let that = this;
        let id = e.target.dataset.id;
        if (id === that.data.categorySelected.id) {
            that.setData({
                scrollTop: 0,
            })
        } else {
            let categoryName = '';
            for (let i = 0; i < that.data.categories.length; i++) {
                let item = that.data.categories[i];
                if (item.id === id) {
                    categoryName = item.name;
                    break;
                }
            }
            that.setData({
                categorySelected: {
                    name: categoryName,
                    id: id
                },
                scrollTop: 0
            });
            that.getProductsList();
        }
    },
    bindInput(e) {
        this.setData({
            inputVal: e.detail.value
        })
    },
    bindConfirm(e) {
        this.setData({
            inputVal: e.detail.value
        });
        wx.navigateTo({
            url: '/pages/products/list?name=' + this.data.inputVal,
        })
    },
    onShareAppMessage() {
        return {
            title: '"' + wx.getStorageSync('mallName') + '" ' + wx.getStorageSync('share_profile'),
            path: '/pages/index/index?inviterId=' + wx.getStorageSync('userId')
        }
    },
    onShow() {
        AUTH.checkHasLogged().then(isLoggedIn => {
            if (isLoggedIn) {
                this.setData({
                    wechatLogin: isLoggedIn
                });
                TOOLS.showTabBarBadge() // 获取购物车数据，显示TabBarBadge
            }
        });
        const _categoryId = wx.getStorageSync('_categoryId');
        wx.removeStorageSync('_categoryId');
        if (_categoryId) {
            this.data.categorySelected.id = _categoryId;
            this.categories();
        } else {
            this.data.categorySelected.id = null
        }
    },
    async addShopCart(e) {
        const curGood = this.data.currentProducts.find(ele => {
            return ele.id === e.currentTarget.dataset.id
        });
        if (!curGood) {
            return
        }
        if (curGood.stock <= 0) {
            wx.showToast({
                title: '已售罄~',
                icon: 'none'
            });
            return
        }
        this.addShopCartCheck({
            productsId: curGood.id,
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
        const res = await WXAPI.addItemToShoppingCart(options.productsId, options.buyNumber, options.sku)
        if (res.code === 30002) {
            // 需要选择规格尺寸
            const skuCurProductsRes = await WXAPI.productsDetail(options.productsId)
            if (skuCurProductsRes.code !== 0) {
                wx.showToast({
                    title: skuCurProductsRes.message,
                    icon: 'none'
                })
                return
            }
            wx.hideTabBar({"aniamtion": false})
            const skuCurProducts = skuCurProductsRes.data
            skuCurProducts.storesBuy = 1
            this.setData({
                skuCurProducts
            })
            return
        }
        if (res.code !== 0) {
            wx.showToast({
                title: res.message,
                icon: 'none'
            });
            return
        }
        wx.showToast({
            title: '加入成功',
            icon: 'success'
        });
        this.setData({
            skuCurProducts: null
        });
        wx.showTabBar();
        TOOLS.showTabBarBadge() // 获取购物车数据，显示TabBarBadge
    },
    storesJia() {
        const skuCurProducts = this.data.skuCurProducts;
        if (skuCurProducts.basicInfo.storesBuy < skuCurProducts.basicInfo.stores) {
            skuCurProducts.basicInfo.storesBuy++;
            this.setData({
                skuCurProducts
            })
        }
    },
    storesReduce() {
        const skuCurProducts = this.data.skuCurProducts
        if (skuCurProducts.basicInfo.storesBuy > 1) {
            skuCurProducts.basicInfo.storesBuy--
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
    addCarSku() {
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
            productsId: skuCurProducts.basicInfo.id,
            buyNumber: skuCurProducts.basicInfo.storesBuy,
            sku
        }
        this.addShopCartDone(options)
    },
})