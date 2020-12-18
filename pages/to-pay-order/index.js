const app = getApp()
const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const wechatPay = require('../../utils/pay.js')
const CONFIG = require('../../config.js')

Page({
    data: {
        wechatLogin: true,
        totalScoreToPay: 0,
        productList: [],
        isNeedLogistics: 0, // 是否需要物流信息
        totalProductAmount: 0,
        logisticsAmount: 0,
        pay: 0,
        payProductList: "",
        orderType: CONFIG.buyFromCart,
        groupOpenId: undefined, //拼团的话记录团号
        hasCoupons: true,
        coupons: [],
        discountedAmount: 0, //优惠券金额
        curCoupon: null, // 当前选择使用的优惠券
        curCouponShowText: '请选择使用优惠券', // 当前选择使用的优惠券
        deliveryType: CONFIG.needDelivery,
        remark: '',
        shopIndex: -1,
        couponList: [],
        config: CONFIG,
        totalPrice: 0,
    },
    onShow() {
        AUTH.checkHasLogged().then(isLoggedIn => {
            this.setData({
                wechatLogin: isLoggedIn
            })
            if (isLoggedIn) {
                this.doneShow()
            }
        })
    },
    async doneShow() {
        let cartList = [];
        let fromType = "buyNow"
        //立即购买下单
        if (CONFIG.buyNow === this.data.orderType) {
            let buyNowInfoMem = wx.getStorageSync('buyNowInfo');
            this.data.bargainId = buyNowInfoMem.bargainId;
            if (buyNowInfoMem && buyNowInfoMem.cartList) {
                cartList = buyNowInfoMem.cartList;
            }

        } else {
            //购物车下单
            const res = await WXAPI.shoppingCartInfo();
            if (res.code === 0) {
                cartList = res.data;
                fromType = "shoppingCart";
            }
        }
        let totalPrice;
        for (let key in cartList) {
            let productOptionIds = cartList[key].sku.combineId.split("_");
            cartList[key].shoppingCartId = cartList[key].id;
            for (let k in cartList[key].optionList) {
                if (!cartList[key].optionList.hasOwnProperty(k)) continue;
                cartList[key].optionList[k].forEach(function (element) {
                    element.active = false
                    for (let i = 0, l = productOptionIds.length; i < l; i++) {
                        if (element.productOptionId === productOptionIds[i]) {
                            element.active = true;
                        }
                    }
                });
            }
            totalPrice += cartList[key].sku.price;
        }
        this.setData({
            productList: cartList,
            deliveryType: this.data.deliveryType,
            totalPrice: totalPrice,
            fromType: fromType,
        });
        this.initShippingAddress()
    },

    onLoad(e) {
        let _data = {
            isNeedLogistics: 1
        }
        if (e.orderType) {
            _data.orderType = e.orderType
        }
        if (e.groupOpenId) {
            _data.groupOpenId = e.groupOpenId
        }
        this.setData(_data);
    },

    remarkChange(e) {
        this.data.remark = e.detail.value
    },

    goCreateOrder() {
        const subscribeIds = wx.getStorageSync('subscribe_ids')
        if (subscribeIds) {
            wx.requestSubscribeMessage({
                tmplIds: subscribeIds.split(','),
                success(res) {

                },
                fail(e) {
                    console.error(e)
                },
                complete: (e) => {
                    this.createOrder(true)
                },
            })
        } else {
            this.createOrder(true)
        }
    },
    createOrder: function (e) {
        let that = this;
        let remark = this.data.remark; // 备注信息

        let postData = {
            payProductList: that.data.payProductList,
            remark: remark,
            deliveryType: that.data.deliveryType,
            BuyChannel: "wechatMini",
            fromType: that.data.fromType,
        };
        if (that.data.bargainId) {
            postData.bargainId = that.data.bargainId
        }
        if (that.data.groupOpenId) {
            postData.groupOpenId = that.data.groupOpenId
        }
        if (e && that.data.isNeedLogistics > 0 && postData.deliveryType === CONFIG.needDelivery) {
            if (!that.data.currentAddressData) {
                wx.hideLoading();
                wx.showToast({
                    title: '请设置收货地址',
                    icon: 'none'
                })
                return;
            }
            if (postData.deliveryType === CONFIG.needDelivery) {
                postData.provinceCode = that.data.currentAddressData.provinceCode;
                postData.cityId = that.data.currentAddressData.cityId;
                if (that.data.currentAddressData.districtId) {
                    postData.districtId = that.data.currentAddressData.districtId;
                }
                postData.address = that.data.currentAddressData.address;
                postData.contact = that.data.currentAddressData.contact;
                postData.mobile = that.data.currentAddressData.mobile;
                postData.code = that.data.currentAddressData.code;
            }
        }
        if (that.data.curCoupon) {
            postData.couponId = that.data.curCoupon.id;
        }
        if (!e) {
            postData.calculate = true;
            postData.prepare = true;
        } else {
            if (postData.deliveryType === CONFIG.selfPickup && this.data.shops && this.data.shopIndex === -1) {
                wx.showToast({
                    title: '请选择自提门店',
                    icon: 'none'
                })
                return;
            }
            if (postData.deliveryType === CONFIG.selfPickup && this.data.shops) {
                postData.shopIdZt = this.data.shops[this.data.shopIndex].id
                postData.shopNameZt = this.data.shops[this.data.shopIndex].name
            }
        }

        WXAPI.orderCreate(postData).then(function (res) {
            if (res.code !== 0) {
                wx.showModal({
                    title: '错误',
                    content: res.message,
                    showCancel: false
                })
                return;
            }

            if (e && CONFIG.buyNow !== that.data.type) {
                // 清空购物车数据
                WXAPI.shoppingCartInfoRemoveAll()
            }
            if (!e) {
                let hasCoupons = false
                let coupons = null
                if (res.data.couponList) {
                    hasCoupons = true
                    res.data.couponList.forEach(ele => {
                        ele.nameExt = ele.name + ' [满' + ele.moneyThreshold + '元可减' + ele.money + '元]'
                    })
                    coupons = res.data.couponList
                }

                that.setData({
                    totalScoreToPay: res.data.score,
                    isNeedLogistics: res.data.isNeedLogistics,
                    totalProductAmount: res.data.totalAmount,
                    totalAmount: res.data.logisticsAmount + res.data.totalAmount,
                    logisticsAmount: res.data.logisticsAmount,
                    hasCoupons: hasCoupons,
                    coupons: coupons
                });
                return;
            }
            that.processAfterCreateOrder(res)
        })
    },
    async processAfterCreateOrder(res) {
        // 直接弹出支付，取消支付的话，去订单列表
        const resUserAmount = await WXAPI.userAmount()
        if (resUserAmount.code !== 0) {
            wx.showToast({
                title: '无法获取用户资金信息',
                icon: 'none'
            })
            wx.redirectTo({
                url: "/pages/order-list/index"
            });
            return
        }
        const money = res.data.logisticsAmount + res.data.totalAmount - resUserAmount.data.balance
        // if (money <= 0) {
        //     wx.redirectTo({
        //         url: "/pages/order-list/index"
        //     })
        // } else {
        //     console.log(res.data)
        //     wechatPay.wechatPay('order', money, res.data.orderId, "/pages/order-list/index");
        // }
        // 拉起支付
        wechatPay.wechatPay('order', money, res.data.id, "/pages/order-list/index");
    },
    async initShippingAddress() {
        const res = await WXAPI.defaultAddress()
        if (res.code === 0) {
            this.setData({
                currentAddressData: res.data
            });
        } else {
            this.setData({
                currentAddressData: null
            });
        }
        this.processFreight();
    },
    processFreight() {
        let productList = this.data.productList;
        if (productList.length === 0) {
            return
        }
        let payProductList = [];
        let isNeedLogistics = 0;
        let totalProductAmount = 0;

        let inviterId = 0;
        let inviterId_storage = wx.getStorageSync('referrer');
        if (inviterId_storage) {
            inviterId = inviterId_storage;
        }
        const ArrayChangeJson = (ar) => JSON.stringify(ArrayChangeJson(ar));
        for (let i = 0; i < productList.length; i++) {
            let cartShopBean = productList[i];
            if (cartShopBean.logistics || cartShopBean.logisticsId) {
                isNeedLogistics = 1;
            }
            totalProductAmount += cartShopBean.price * cartShopBean.number;

            let productObj = new Object({
                id: null,
                number: 0,
                propertyChildIds: "",
                logisticsType: "",
                inviterId: ""
            })

            productObj.id = cartShopBean.id;
            productObj.number = cartShopBean.number;
            // productObj.sku = cartShopBean.sku;
            productObj.logisticsType = cartShopBean.logisticsType;
            productObj.inviterId = cartShopBean.inviterId;
            productObj.shoppingCartId = cartShopBean.shoppingCartId;
            productObj.productId = cartShopBean.productId;
            payProductList.push(productObj)
        }

        this.setData({
            isNeedLogistics: isNeedLogistics,
            payProductList: payProductList
        });
        this.createOrder();
    },
    addAddress: function () {
        wx.navigateTo({
            url: "/pages/address-add/index"
        })
    },
    selectAddress: function () {
        wx.navigateTo({
            url: "/pages/select-address/index"
        })
    },
    bindChangeCoupon: function (e) {
        const selIndex = e.detail.value;
        this.setData({
            discountedAmount: this.data.coupons[selIndex].money,
            curCoupon: this.data.coupons[selIndex],
            curCouponShowText: this.data.coupons[selIndex].nameExt
        });
    },
    radioChange(e) {
        this.setData({
            deliveryType: e.detail.value
        })
        this.processFreight()
        if (e.detail.value === CONFIG.selfPickup) {
            this.fetchShops()
        }
    },
    cancelLogin() {
        wx.navigateBack()
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
    async fetchShops() {
        const res = await WXAPI.fetchShops()
        if (res.code === 0) {
            let shopIndex = this.data.shopIndex
            const shopInfo = wx.getStorageSync('shopInfo')
            if (shopInfo) {
                shopIndex = res.data.findIndex(ele => {
                    return ele.id === shopInfo.id
                })
            }
            this.setData({
                shops: res.data,
                shopIndex
            })
        }
    },
    shopSelect(e) {
        this.setData({
            shopIndex: e.detail.value
        })
    },
    goMap() {
        const shop = this.data.shops[this.data.shopIndex]
        const latitude = shop.latitude
        const longitude = shop.longitude
        wx.openLocation({
            latitude,
            longitude,
            scale: 18
        })
    },
    callMobile() {
        const shop = this.data.shops[this.data.shopIndex]
        wx.makePhoneCall({
            phoneNumber: shop.phone,
        })
    },
})