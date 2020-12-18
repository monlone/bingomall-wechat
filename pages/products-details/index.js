const WXAPI = require('apifm-wxapi')
const app = getApp();
const CONFIG = require('../../config.js')
const AUTH = require('../../utils/auth')
const SelectSizePrefix = "请选择规格数量："
import Poster from 'wxa-plugin-canvas/poster/poster'

Page({
    data: {
        wechatLogin: true,
        productsDetail: {},
        hasMoreSelect: false,
        selectSize: SelectSizePrefix,
        selectSizePrice: 0,
        selectSizeOPrice: 0,
        totalScoreToPay: 0,
        shoppingCartNumber: 0,
        hideShopPopup: true,
        buyNumber: 0,
        buyNumMin: 1,
        buyNumMax: 10,
        canSubmit: false, //  选中规格尺寸时候是否允许加入购物车
        productType: "addShopCart", //购物类型，加入购物车或立即购买，默认为加入购物车
        originalPrice: 0,
        minPrice: 0,
        groupPrice: 0,  //团购价
        stock: 10,
        shopId: "",
        title: "",
        currentSelect: {},
        productOptionIds: {},
        propertyChildNames: {},
    },
    async onLoad(e) {
        if (e && e.scene) {
            const scene = decodeURIComponent(e.scene) // 处理扫码进商品详情页面的逻辑
            if (scene && scene.split(',').length >= 2) {
                e.id = scene.split(',')[0]
                wx.setStorageSync('referrer', scene.split(',')[1])
            }
        }
        this.data.id = e.id
        this.data.bargainJoinUid = e.bargainJoinUid
        this.setData({
            productsDetailSkuShowType: CONFIG.productsDetailSkuShowType,
            currentUid: wx.getStorageSync('userId')
        })
        this.reputation(e.id);
        this.shoppingCartInfo()
    },
    async shoppingCartInfo() {
        const res = await WXAPI.shoppingCartInfo();
        if (res.code === 0) {
            let number = 0
            for (let i in res.data) {
                number++;
            }
            this.setData({
                shoppingCartNumber: number
            })
        }
    },
    onShow() {
        AUTH.checkHasLogged().then(isLoggedIn => {
            if (isLoggedIn) {
                this.setData({
                    wechatLogin: isLoggedIn
                })
                this.productsFavCheck()
            }
        })
        this.getProductsDetailAndBargainInfo(this.data.id)
    },
    async productsFavCheck() {
        const res = await WXAPI.productsFavCheck(this.data.id)
        if (res.code === 0) {
            this.setData({
                favourite: true
            })
        } else {
            this.setData({
                favourite: false
            })
        }
    },
    async addFav() {
        AUTH.checkHasLogged().then(isLoggedIn => {
            this.setData({
                wechatLogin: isLoggedIn
            })
            if (isLoggedIn) {
                if (this.data.favourite) {
                    // 取消收藏
                    WXAPI.productsFavDelete('', this.data.id).then(res => {
                        this.productsFavCheck()
                    })
                } else {
                    // 加入收藏
                    WXAPI.productsFavPut(this.data.id).then(res => {
                        this.productsFavCheck()
                    })
                }
            }
        })
    },
    async getProductsDetailAndBargainInfo(id) {
        const that = this;
        const productsDetailRes = await WXAPI.productsDetail(id)
        let productsBargainSetRes = null;
        if (productsDetailRes.data.product.priceType === 2) {
            productsBargainSetRes = await WXAPI.bargainSet(id)
        }

        if (productsDetailRes.code === 0) {
            let selectSizeTemp = SelectSizePrefix;
            let price = productsDetailRes.data.product.price;
            if (productsDetailRes.data.optionList) {
                for (let i = 0; i < productsDetailRes.data.optionList.length; i++) {
                    selectSizeTemp = selectSizeTemp + " " + productsDetailRes.data.optionList[i].desc;
                    if (price < productsDetailRes.data.optionList[i].price) {
                        price = productsDetailRes.data.optionList[i].price;
                    }
                }
                that.setData({
                    hasMoreSelect: true,
                    selectSize: selectSizeTemp,
                    selectSizePrice: price,
                    selectSizeOPrice: productsDetailRes.data.product.originalPrice,
                    totalScoreToPay: productsDetailRes.data.product.score
                });
            }
            if (productsDetailRes.data.product.shopId) {
                this.shopSubDetail(productsDetailRes.data.product.shopId)
            }
            if (productsDetailRes.data.product.priceType === 4) {
                that.groupList(id)
            }
            that.data.productsDetail = productsDetailRes.data;
            if (productsDetailRes.data.videoId) {
                that.getVideoSrc(productsDetailRes.data.videoId);
            }
            let _data = {
                productsDetail: productsDetailRes.data,
                selectSizePrice: productsDetailRes.data.product.price,
                selectSizeOPrice: productsDetailRes.data.product.originalPrice,
                totalScoreToPay: productsDetailRes.data.product.score,
                buyNumMax: productsDetailRes.data.product.stock,
                buyNumber: (productsDetailRes.data.product.stock > 0) ? 1 : 0
            }
            if (productsBargainSetRes && productsBargainSetRes.code === 0 && !productsBargainSetRes.data) {
                _data.curProductsBargain = productsBargainSetRes.data
                that.data.bargainId = _data.curProductsBargain.id
                // 获取当前砍价进度
                if (!that.data.bargainJoinUid) {
                    that.data.bargainJoinUid = wx.getStorageSync('userId')
                }
                const curBargainProgress = await WXAPI.bargainDetail(_data.curProductsBargain.id, that.data.bargainJoinUid)
                const myHelpDetail = await WXAPI.bargainHelpDetail(_data.curProductsBargain.id, that.data.bargainJoinUid)
                if (curBargainProgress.code === 0) {
                    _data.curBargainProgress = curBargainProgress.data
                }
                if (myHelpDetail.code === 0) {
                    _data.myHelpDetail = myHelpDetail.data
                }
            }
            if (productsDetailRes.data.group) {
                const groupSetRes = await WXAPI.groupSet(id)
                if (groupSetRes.code === 0) {
                    _data.groupSet = groupSetRes.data
                    // 如果是拼团商品， 默认显示拼团价格
                    _data.selectSizePrice = productsDetailRes.data.price
                }
            }
            that.setData(_data);
        }
    },
    async shopSubDetail(shopId) {
        const res = await WXAPI.shopSubDetail(shopId)
        if (res.code === 0) {
            this.setData({
                shopSubDetail: res.data
            })
        }
    },
    goShopCar: function () {
        wx.reLaunch({
            url: "/pages/shopping-cart/index"
        });
    },
    toAddShopCart: function () {
        this.setData({
            productType: "addShopCart"
        })
        this.bindGuiGeTap();
    },
    toBuy: function () {
        this.setData({
            productType: "toBuy"
        });
        this.bindGuiGeTap();
    },
    toGroup: function (e) {
        let groupOpenid = ""
        if (e.currentTarget.dataset.groupOpenid) {
            groupOpenid = e.currentTarget.dataset.groupOpenid
        }
        this.setData({
            productType: "toGroup",
            selectSizePrice: this.data.productsDetail.groupPrice,
            selectSizeOPrice: this.data.productsDetail.originalPrice,
            groupOpenid: groupOpenid,
            hideShopPopup: false,
            skuProductsPic: this.data.productsDetail.imageUrl
        });
    },
    /**
     * 规格选择弹出框
     */
    bindGuiGeTap: function () {
        this.setData({
            hideShopPopup: false,
            selectSizePrice: this.data.productsDetail.product.price,
            selectSizeOPrice: this.data.productsDetail.product.originalPrice,
            skuProductsPic: this.data.productsDetail.product.imageUrl
        })
    },
    /**
     * 规格选择弹出框隐藏
     */
    closePopupTap: function () {
        this.setData({
            hideShopPopup: true
        })
    },
    numReduceTap: function () {
        if (this.data.buyNumber > this.data.buyNumMin) {
            let currentNum = this.data.buyNumber;
            currentNum--;
            this.setData({
                buyNumber: currentNum
            })
        }
    },
    numAddTap: function () {
        if (this.data.buyNumber < this.data.buyNumMax) {
            let currentNum = this.data.buyNumber;
            currentNum++;
            this.setData({
                buyNumber: currentNum
            })
        }
    },
    /**
     * 选择商品规格
     * @param {Object} e
     */
    async labelItemTap(e) {
        let optionList = this.data.productsDetail.optionList;
        const optionType = e.currentTarget.dataset.type
        const propertyChildIndex = e.currentTarget.dataset.productoptionid

        let option = optionList[optionType]
        let child = {}

        // 获取所有的选中规格尺寸数据
        const needSelectNum = Object.keys(optionList).length
        let productOptionIds = this.data.productOptionIds;
        let propertyChildNames = this.data.propertyChildNames;
        let currentSelect = this.data.currentSelect;

        Object.keys(optionList).forEach((key) => {
            let index = key - 1
            option[index].active = false
            if (option[index].productOptionId === propertyChildIndex) {
                option[index].active = true;
                productOptionIds[optionType] = propertyChildIndex;
                propertyChildNames[optionType] = option[index].desc;
                child = option[index]
                currentSelect[optionType] = true;
            }
        })
        // 设置当前选中状态
        option.optionValueId = child.productOptionId

        let canSubmit = false;
        if (needSelectNum === Object.keys(currentSelect).length) {
            canSubmit = true;
        }
        //TODO 要在后台把sku与productOption做一个关联，算出第个productOption的库存，用来给前端显示,前端在没有库存时，要置灰
        // 计算当前价格
        if (canSubmit) {
            const res = await WXAPI.productsPrice(this.data.productsDetail.product.id, productOptionIds)
            if (res.code === 0) {
                let _price = res.data.sku.price
                if (this.data.productType === 'toGroup') {
                    _price = res.data.product.groupPrice
                }
                this.setData({
                    selectSizePrice: _price,
                    selectSizeOPrice: res.data.product.originPrice,
                    totalScoreToPay: res.data.product.score,
                    productOptionIds: productOptionIds,
                    propertyChildNames: propertyChildNames,
                    buyNumMax: res.data.sku.stock,
                    buyNumber: (res.data.stock > 0) ? 1 : 0
                });
            }
        }
        let skuProductsPic = this.data.skuProductsPic
        if (this.data.productsDetail.imageList && this.data.productsDetail.imageList.length > 0) {
            const _subPic = this.data.productsDetail.imageList.find(ele => {
                return ele.optionValueId === child.productOptionId
            })
            if (_subPic) {
                skuProductsPic = _subPic
            }
        }
        this.setData({
            productsDetail: this.data.productsDetail,
            canSubmit: canSubmit,
            skuProductsPic
        })
    },
    /**
     * 加入购物车
     */
    async addShopCart() {
        let optionList = this.data.productsDetail.optionList;
        if (!this.data.canSubmit) {
            if (!this.data.canSubmit) {
                wx.showToast({
                    title: '请选择规格',
                    icon: 'none'
                })
            }
            this.bindGuiGeTap()
            return
        }
        if (this.data.buyNumber < 1) {
            wx.showToast({
                title: '请选择购买数量',
                icon: 'none'
            })
            this.bindGuiGeTap()
            return
        }
        const isLoggedIn = await AUTH.checkHasLogged()
        if (!isLoggedIn) {
            this.setData({
                wechatLogin: false
            })
            return
        }
        const id = this.data.productsDetail.product.id
        const productOptionIds = []
        if (optionList) {
            for (let key in optionList) {
                for (let k in optionList[key]) {
                    if (optionList[key][k].active === true) {
                        productOptionIds.push(optionList[key][k].productOptionId)
                    }
                }
            }
        }
        const res = await WXAPI.addItemToShoppingCart(id, this.data.buyNumber, productOptionIds)
        if (res.code !== 0) {
            wx.showToast({
                title: res.message,
                icon: 'none'
            })
            return
        }

        this.closePopupTap();
        wx.showToast({
            title: '加入购物车',
            icon: 'success'
        })
        this.setData({
            canSubmit: false
        })
        if (optionList) {
            for (let key in optionList) {
                optionList[key].forEach(function (element) {
                    element.active = false
                });
            }
        }
        this.data.productsDetail.optionList = optionList
        this.setData({
            productsDetail: this.data.productsDetail
        })
        this.shoppingCartInfo()
    },
    /**
     * 立即购买
     */
    buyNow: function (e) {
        let that = this
        let productType = e.currentTarget.dataset.productType
        if (!this.data.canSubmit) {
            this.bindGuiGeTap();
            return;
        }
        if (this.data.buyNumber < 1) {
            wx.showModal({
                title: '提示',
                content: '购买数量不能为0！',
                showCancel: false
            })
            this.bindGuiGeTap();
            return;
        }
        //组建立即购买信息
        let buyNowInfo = this.buildBuyNowInfo(productType);
        // 写入本地存储
        wx.setStorage({
            key: "buyNowInfo",
            data: buyNowInfo
        })
        this.closePopupTap();
        if (productType === 'toGroup') {
            if (this.data.groupOpenid) {
                wx.navigateTo({
                    url: "/pages/to-pay-order/index?orderType=buyNow&groupOpenId=" + this.data.groupOpenid
                })
            } else {
                WXAPI.groupOpen(that.data.productsDetail.product.id).then(function (res) {
                    if (res.code === 2000) {
                        that.setData({
                            wechatLogin: false
                        })
                        return
                    }
                    if (res.code !== 0) {
                        wx.showToast({
                            title: res.message,
                            icon: 'none',
                            duration: 2000
                        })
                        return
                    }
                    wx.navigateTo({
                        url: "/pages/to-pay-order/index?orderType=buyNow&groupOpenId=" + res.data.id
                    })
                })
            }
        } else {
            wx.navigateTo({
                url: "/pages/to-pay-order/index?orderType=buyNow"
            })
        }

    },
    /**
     * 组建立即购买信息
     */
    buildBuyNowInfo: function (productType) {
        let shopCartMap = {};
        shopCartMap.id = this.data.productsDetail.product.id;
        shopCartMap.imageUrl = this.data.productsDetail.product.imageUrl;
        shopCartMap.title = this.data.productsDetail.product.title;
        // shopCartMap.label=this.data.productsDetail.basicInfo.id; 规格尺寸
        shopCartMap.productOptionIds = this.data.productOptionIds;
        shopCartMap.label = this.data.propertyChildNames;
        shopCartMap.price = this.data.selectSizePrice;
        // if (productType == 'toGroup') { // 20190714 拼团价格注释掉
        //   shopCartMap.price = this.data.productsDetail.basicInfo.groupPrice;
        // }
        shopCartMap.score = this.data.totalScoreToPay;
        shopCartMap.left = "";
        shopCartMap.active = true;
        shopCartMap.number = this.data.buyNumber;
        shopCartMap.logisticsType = this.data.productsDetail.product.logisticsType;
        shopCartMap.logistics = this.data.productsDetail.product.logistics;
        shopCartMap.weight = this.data.productsDetail.product.weight;
        shopCartMap.shipperName = "" //物流的名称？lee comment

        let buyNowInfo = {};
        buyNowInfo.shoppingCartNumber = 0;
        buyNowInfo.cartList = [];

        /*    let hasSameProductsIndex = -1;
            for (let i = 0; i < toBuyInfo.cartList.length; i++) {
              let tmpShopCarMap = toBuyInfo.cartList[i];
              if (tmpShopCarMap.id == shopCartMap.id && tmpShopCarMap.productOptionIds == shopCartMap.productOptionIds) {
                hasSameProductsIndex = i;
                shopCartMap.number = shopCartMap.number + tmpShopCarMap.number;
                break;
              }
            }
            toBuyInfo.shoppingCartNumber = toBuyInfo.shoppingCartNumber + this.data.buyNumber;
            if (hasSameProductsIndex > -1) {
              toBuyInfo.cartList.splice(hasSameProductsIndex, 1, shopCartMap);
            } else {
              toBuyInfo.cartList.push(shopCartMap);
            }*/

        buyNowInfo.cartList.push(shopCartMap);
        buyNowInfo.bargainId = this.data.bargainId;
        return buyNowInfo;
    },
    onShareAppMessage() {
        let _data = {
            title: this.data.productsDetail.product.title,
            path: '/pages/products-details/index?id=' + this.data.productsDetail.product.id + '&inviterId=' + wx.getStorageSync('userId'),
            success: function (res) {
                // 转发成功
            },
            fail: function (res) {
                // 转发失败
            }
        }
        if (this.data.bargainJoinUid) {
            _data.title = this.data.curBargainProgress.joiner.nick + '邀请您帮TA砍价'
            _data.path += '&bargainJoinUid=' + this.data.bargainJoinUid
        }
        return _data
    },
    reputation: function (id) {
        let that = this;
        WXAPI.productsReputation({
            id: id
        }).then(function (res) {
            if (res.code === 0) {
                that.setData({
                    reputation: res.data
                });
            }
        })
    },
    groupList: function (id) {
        let that = this;
        WXAPI.groupList({
            id: id,
            status: 0
        }).then(function (res) {
            if (res.code === 0) {
                that.setData({
                    groupList: res.data.result
                });
            }
        })
    },
    getVideoSrc: function (videoId) {
        let that = this;
        WXAPI.videoDetail(videoId).then(function (res) {
            if (res.code === 0) {
                that.setData({
                    videoMp4Src: res.data.fdMp4
                });
            }
        })
    },
    joinBargain() {
        AUTH.checkHasLogged().then(isLoggedIn => {
            if (isLoggedIn) {
                this.doneJoinBargain();
            } else {
                this.setData({
                    wechatLogin: false
                })
            }
        })
    },
    doneJoinBargain: function () { // 报名参加砍价活动
        const _this = this;
        if (!_this.data.curProductsBargain) {
            return;
        }
        wx.showLoading({
            title: '加载中',
            mask: true
        })
        WXAPI.bargainJoin(_this.data.curProductsBargain.id).then(function (res) {
            wx.hideLoading()
            if (res.code === 0) {
                _this.setData({
                    bargainJoinUid: wx.getStorageSync('userId'),
                    myHelpDetail: null
                })
                _this.getProductsDetailAndBargainInfo(_this.data.productsDetail.product.id)
            } else {
                wx.showToast({
                    title: res.message,
                    icon: 'none'
                })
            }
        })
    },
    joinGroup: function (e) {
        let groupOpenid = e.currentTarget.dataset.groupOpenid
        wx.navigateTo({
            url: "/pages/to-pay-order/index?orderType=buyNow&groupOpenId=" + groupOpenid
        })
    },
    goIndex() {
        wx.switchTab({
            url: '/pages/index/index',
        });
    },
    helpBargain() {
        const _this = this;
        AUTH.checkHasLogged().then(isLoggedIn => {
            _this.setData({
                wechatLogin: isLoggedIn
            })
            if (isLoggedIn) {
                _this.helpBargainDone()
            }
        })
    },
    helpBargainDone() {
        const _this = this;
        WXAPI.bargainHelp(_this.data.bargainId, _this.data.bargainJoinUid, '').then(function (res) {
            if (res.code !== 0) {
                wx.showToast({
                    title: res.message,
                    icon: 'none'
                })
                return;
            }
            _this.setData({
                myHelpDetail: res.data
            });
            wx.showModal({
                title: '成功',
                content: '成功帮TA砍掉 ' + res.data.bargainPrice + ' 元',
                showCancel: false
            })
            _this.getProductsDetailAndBargainInfo(_this.data.productsDetail.product.id)
        })
    },
    cancelLogin() {
        this.setData({
            wechatLogin: true
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
    closePop() {
        this.setData({
            posterShow: false
        })
    },
    previewImage(e) {
        const url = e.currentTarget.dataset.url
        wx.previewImage({
            current: url, // 当前显示图片的http链接
            urls: [url] // 需要预览的图片http链接列表
        })
    },
    async drawSharePic() {
        const _this = this
        const qrCodeRes = await WXAPI.wxaQrcode({
            scene: _this.data.productsDetail.id + ',' + wx.getStorageSync('userId'),
            page: 'pages/products-details/index',
            is_hyaline: true,
            autoColor: true,
            expireHours: 1
        })
        if (qrCodeRes.code !== 0) {
            wx.showToast({
                title: qrCodeRes.message,
                icon: 'none'
            })
            return
        }
        const qrCode = qrCodeRes.data
        const pic = _this.data.productsDetail.product.imageUrl
        wx.getImageInfo({
            src: pic,
            success(res) {
                const height = 490 * res.height / res.width
                _this.drawSharePicDone(height, qrCode)
            },
            fail(e) {
                console.error(e)
            }
        })
    },
    drawSharePicDone(picHeight, qrcode) {
        const _this = this
        const _baseHeight = 74 + (picHeight + 120)
        this.setData({
            posterConfig: {
                width: 750,
                height: picHeight + 660,
                backgroundColor: '#fff',
                debug: false,
                blocks: [
                    {
                        x: 76,
                        y: 74,
                        width: 604,
                        height: picHeight + 120,
                        borderWidth: 2,
                        borderColor: '#c2aa85',
                        borderRadius: 8
                    }
                ],
                images: [
                    {
                        x: 133,
                        y: 133,
                        url: _this.data.productsDetail.product.imageUrl, // 商品图片
                        width: 490,
                        height: picHeight
                    },
                    {
                        x: 76,
                        y: _baseHeight + 199,
                        url: qrcode, // 二维码
                        width: 222,
                        height: 222
                    }
                ],
                texts: [
                    {
                        x: 375,
                        y: _baseHeight + 80,
                        width: 650,
                        lineNum: 2,
                        text: _this.data.productsDetail.product.title,
                        textAlign: 'center',
                        fontSize: 40,
                        color: '#333'
                    },
                    {
                        x: 375,
                        y: _baseHeight + 180,
                        text: '￥' + _this.data.productsDetail.product.minPrice,
                        textAlign: 'center',
                        fontSize: 50,
                        color: '#e64340'
                    },
                    {
                        x: 352,
                        y: _baseHeight + 320,
                        text: '长按识别小程序码',
                        fontSize: 28,
                        color: '#999'
                    }
                ],
            }
        }, () => {
            Poster.create();
        });
    },
    onPosterSuccess(e) {
        console.log('success:', e)
        this.setData({
            posterImg: e.detail,
            showPosterImg: true
        })
    },
    onPosterFail(e) {
        console.error('fail:', e)
    },
    savePosterPic() {
        const _this = this
        wx.saveImageToPhotosAlbum({
            filePath: this.data.posterImg,
            success: (res) => {
                wx.showModal({
                    content: '已保存到手机相册',
                    showCancel: false,
                    confirmText: '知道了',
                    confirmColor: '#333'
                })
            },
            complete: () => {
                _this.setData({
                    showPosterImg: false
                })
            },
            fail: (res) => {
                wx.showToast({
                    title: res.errMsg,
                    icon: 'none',
                    duration: 2000
                })
            }
        })
    },
})
