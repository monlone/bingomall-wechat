const WXAPI = require('apifm-wxapi')
const TOOLS = require('../../utils/tools.js')

const APP = getApp()
// fixed首次打开不显示标题的bug
APP.configLoadOK = () => {
    wx.setNavigationBarTitle({
        title: wx.getStorageSync('mallName')
    })
}

Page({
    data: {
        inputVal: "", // 搜索框内容
        productsRecommend: [], // 推荐商品
        bargainList: [], //砍价商品列表
        groupList: [], //拼团商品列表
        loadingHidden: false, // loading
        selectCurrent: 0,
        categories: [],
        activeCategoryId: "",
        products: [],
        scrollTop: 0,
        loadingMoreHidden: true,
        coupons: [],
        curPage: 1,
        pageSize: 20,
        cateScrollTop: 0,
        rows: [],
    },

    tabClick: function (e) {
        wx.setStorageSync("_categoryId", e.currentTarget.id)
        wx.switchTab({
            url: '/pages/category/category',
        })
        // wx.navigateTo({
        //   url: '/pages/products/list?categoryId=' + e.currentTarget.id,
        // })
    },
    toDetailsTap: function (e) {
        wx.navigateTo({
            url: "/pages/products-details/index?id=" + e.currentTarget.dataset.id
        })
    },
    tapBanner: function (e) {
        const url = e.currentTarget.dataset.url;
        if (url) {
            wx.navigateTo({
                url
            })
        }
    },
    adClick: function (e) {
        const url = e.currentTarget.dataset.url;
        if (url) {
            wx.navigateTo({
                url
            })
        }
    },
    bindTypeTap: function (e) {
        this.setData({
            selectCurrent: e.index
        })
    },
    onLoad: function (e) {
        wx.showShareMenu({
            withShareTicket: true
        });
        const that = this;
        if (e && e.scene) {
            const scene = decodeURIComponent(e.scene)
            if (scene) {
                wx.setStorageSync('referrer', scene.substring(11))
            }
        }
        wx.setNavigationBarTitle({
            title: wx.getStorageSync('mallName')
        })
        this.initBanners()
        this.categories() //这个看下要不要放出来，现在还要改造才能用
        WXAPI.products({
            recommendStatus: 1
        }).then(res => {
            if (res.code === 0) {
                that.setData({
                    productsRecommend: res.data
                })
            }
        })
        that.getCoupons()
        that.getNotice()
        // that.bargainProducts()
        that.groupProducts()
        this.wxaMpLiveRooms()
    },
    //获取秒杀商品
    async seckillProducts() {
        const res = await WXAPI.products({
            seckill: true
        })
        if (res.code === 0) {
            res.data.rows.forEach(ele => {
                const _now = new Date().getTime()
                if (ele.dateStart) {
                    ele.dateStartInt = new Date(ele.dateStart.replace(/-/g, '/')).getTime() - _now
                }
                if (ele.dateEnd) {
                    ele.dateEndInt = new Date(ele.dateEnd.replace(/-/g, '/')).getTime() - _now
                }
            })
            this.setData({
                seckillProducts: res.data.rows
            })
        }
    },
    async wxaMpLiveRooms() {
        const res = await WXAPI.wxaMpLiveRooms()
        if (res.code === 0 && res.data.length > 0) {
            this.setData({
                aliveRooms: res.data
            })
        }
    },
    async initBanners() {
        const _data = {}
        // 读取头部轮播图
        const res = await WXAPI.banners({
            type: 'index'
        });
        if (res.code === 700) {
            wx.showModal({
                title: '提示',
                content: '请在后台添加 banner 轮播图片，自定义类型填写 index',
                showCancel: false
            })
        } else {
            _data.banners = res.data
        }
        this.setData(_data)
    },
    onShow: function (e) {
        this.setData({
            shopInfo: wx.getStorageSync('shopInfo')
        });
        // 获取购物车数据，显示TabBarBadge
        let token = wx.getStorageSync('token');
        if (token.length > 0) {
            TOOLS.showTabBarBadge();
        }

        this.productsDynamic();
        // this.seckillProducts()
    },
    async productsDynamic() {
        const res = await WXAPI.productsDynamic(0);
        if (res.code === 0) {
            this.setData({
                productsDynamic: res.data.rows
            })
        }
    },
    async categories() {
        const res = await WXAPI.productsCategory();
        let categories = [];
        let tempCategoryId = "";
        if (res.code === 0 && res.data.length > 0) {
            tempCategoryId = res.data[0].id;
            const _categories = res.data.filter(ele => {
                return ele.level === 1
            });
            categories = categories.concat(_categories)
        }
        this.setData({
            categories: categories,
            activeCategoryId: tempCategoryId,
            curPage: 1
        });
        if (this.data.activeCategoryId !== "") {
            this.getProductsList(this.data.activeCategoryId, true);
        } else {
            this.getProductsList(tempCategoryId, true);
        }
    },
    onPageScroll(e) {
        let scrollTop = this.data.scrollTop;
        this.setData({
            scrollTop: scrollTop
        })
        e.scrollTop = scrollTop
    },
    async getProductsList(categoryId, append) {
        wx.showLoading({title: "分类", mask: true});
        const res = await WXAPI.products({
            categoryId: categoryId,
            page: this.data.curPage,
            pageSize: this.data.pageSize
        });
        wx.hideLoading();
        if (res.code === 404 || res.code === 700) {
            let newData = {
                loadingMoreHidden: false
            };
            if (!append) {
                newData.products = []
            }
            this.setData(newData);
            return
        }
        let products = [];
        if (append) {
            products = this.data.products
        }
        for (let i = 0; i < res.data.rows.length; i++) {
            products.push(res.data.rows[i]);
        }
        this.setData({
            loadingMoreHidden: true,
            products: products,
        });
    },
    getCoupons: function () {
        let that = this;
        WXAPI.coupons().then(function (res) {
            if (res.code === 0) {
                that.setData({
                    coupons: res.data
                });
            }
        })
    },
    onShareAppMessage: function () {
        return {
            title: '"' + wx.getStorageSync('mallName') + '" ' + wx.getStorageSync('share_profile'),
            path: '/pages/index/index?inviterId=' + wx.getStorageSync('userId')
        }
    },
    getNotice: function () {
        let that = this;
        WXAPI.noticeList({pageSize: 5}).then(function (res) {
            if (res.code === 0) {
                that.setData({
                    noticeList: res.data
                });
            }
        })
    },
    onReachBottom: function () {
        this.setData({
            curPage: this.data.curPage + 1
        });
        this.getProductsList(this.data.activeCategoryId, true)
    },
    onPullDownRefresh: function () {
        this.setData({
            curPage: 1
        });
        this.getProductsList(this.data.activeCategoryId, true)
        wx.stopPullDownRefresh()
    },

    // 获取砍价商品
    async bargainProducts() {
        const res = await WXAPI.products({
            bargain: true
        });
        if (res.code === 0) {
            const bargainProductsIds = []
            res.data.rows.forEach(ele => {
                bargainProductsIds.push(ele.id)
            })
            const productsBargainSetRes = await WXAPI.bargainSet(bargainProductsIds.join())
            if (productsBargainSetRes.code === 0) {
                res.data.rows.forEach(ele => {
                    const _process = productsBargainSetRes.data.rows.find(_set => {
                        return _set.id === ele.id
                    })
                    if (_process) {
                        ele.process = 100 * _process.numberBuy / _process.number
                    }
                })
                this.setData({
                    bargainList: res.data.rows
                })
            }
        }
    },
    goCoupons: function (e) {
        wx.navigateTo({
            url: "/pages/coupons/index"
        })
    },
    groupProducts() { // 获取团购商品列表
        const _this = this
        WXAPI.products({
            group: true
        }).then(res => {
            if (res.code === 0) {
                _this.setData({
                    groupList: res.data
                })
            }
        })
    },
    bindInput(e) {
        this.setData({
            inputVal: e.detail.value
        })
    },
    bindConfirm(e) {
        this.setData({
            inputVal: e.detail.value
        })
        wx.navigateTo({
            url: '/pages/products/list?name=' + this.data.inputVal,
        })
    },
    goSearch() {
        wx.navigateTo({
            url: '/pages/products/list?name=' + this.data.inputVal,
        })
    }
})