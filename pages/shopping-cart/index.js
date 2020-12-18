const WXAPI = require('apifm-wxapi')
const TOOLS = require('../../utils/tools.js')
const AUTH = require('../../utils/auth')

const app = getApp()

Page({
    data: {
        wechatLogin: true,
        saveHidden: true,
        allSelect: true,
        noSelect: false,
        delBtnWidth: 120, //删除按钮宽度单位（rpx
        totalScore: 0,
        totalPrice: 0
    },

    //获取元素自适应后的实际宽度
    getEleWidth: function (w) {
        let real = 0;
        try {
            let res = wx.getSystemInfoSync().windowWidth;
            let scale = (750 / 2) / (w / 2);
            // console.log(scale);
            real = Math.floor(res / scale);
            return real;
        } catch (e) {
            return false;
            // Do something when catch error
        }
    },
    initEleWidth: function () {
        let delBtnWidth = this.getEleWidth(this.data.delBtnWidth);
        this.setData({
            delBtnWidth: delBtnWidth
        });
    },
    onLoad: function () {
        this.initEleWidth();
        this.onShow();
    },
    onShow: function () {
        AUTH.checkHasLogged().then(isLoggedIn => {
            this.setData({
                wechatLogin: isLoggedIn
            });
            if (isLoggedIn) {
                this.shoppingCartInfo()
            }
        })
    },
    async shoppingCartInfo() {
        const res = await WXAPI.shoppingCartInfo();
        let totalPrice = 0;
        let totalScore = 0;
        this.setData({
            shoppingCartInfo: null
        })
        if (res.code === 0) {
            for (let key in res.data) {
                if (!res.data.hasOwnProperty(key)) continue;
                let productOptionIds = res.data[key].sku.combineId.split("_")
                for (let k in res.data[key].optionList) {
                    if (!res.data[key].optionList.hasOwnProperty(k)) continue;
                    res.data[key].optionList[k].forEach(function (element) {
                        element.active = false
                        for (let i = 0, l = productOptionIds.length; i < l; i++) {
                            if (element.optionId.toString() === productOptionIds[i]) {
                                element.active = (element.optionId.toString() === productOptionIds[i]);
                            }
                        }
                    });
                }
                totalPrice += res.data[key].sku.price * res.data[key].number;
            }
            this.setData({
                shoppingCartInfo: res.data,
                totalPrice: totalPrice,
                totalScore: totalScore
            })
        }
    },
    toIndexPage: function () {
        wx.switchTab({
            url: "/pages/index/index"
        });
    },

    touchS: function (e) {
        if (e.touches.length === 1) {
            this.setData({
                startX: e.touches[0].clientX
            });
        }
    },
    touchM: function (e) {
        const index = e.currentTarget.dataset.index;
        if (e.touches.length === 1) {
            let moveX = e.touches[0].clientX;
            let disX = this.data.startX - moveX;
            let delBtnWidth = this.data.delBtnWidth;
            let left = "";
            if (disX === 0 || disX < 0) { //如果移动距离小于等于0，container位置不变
                left = "margin-left:0px";
            } else if (disX > 0) { //移动距离大于0，container left值等于手指移动距离
                left = "margin-left:-" + disX + "px";
                if (disX >= delBtnWidth) {
                    left = "left:-" + delBtnWidth + "px";
                }
            }
            this.data.shoppingCartInfo.items[index].left = left
            this.setData({
                shoppingCartInfo: this.data.shoppingCartInfo
            })
        }
    },

    touchE: function (e) {
        let index = e.currentTarget.dataset.index;
        if (e.changedTouches.length === 1) {
            let endX = e.changedTouches[0].clientX;
            let disX = this.data.startX - endX;
            let delBtnWidth = this.data.delBtnWidth;
            //如果距离小于删除按钮的1/2，不显示删除按钮
            this.data.shoppingCartInfo[index].left = disX > delBtnWidth / 2 ? "margin-left:-" + delBtnWidth + "px" : "margin-left:0px";
            this.setData({
                shoppingCartInfo: this.data.shoppingCartInfo
            })
        }
    },
    async delItem(e) {
        const key = e.currentTarget.dataset.key;
        this.delItemDone(key)
    },
    async delItemDone(shoppingCartId) {
        const res = await WXAPI.shoppingCartInfoRemoveItem(shoppingCartId);
        if (res.code !== 0 && res.code !== 700) {
            wx.showToast({
                title: res.message,
                icon: 'none'
            })
        } else {
            this.shoppingCartInfo();
            TOOLS.showTabBarBadge()
        }
    },
    async addBtnTap(e) {
        const index = e.currentTarget.dataset.index;
        const item = this.data.shoppingCartInfo.items[index];
        const number = item.number + 1;
        await WXAPI.shoppingCartInfoModifyNumber(item.shoppingCartId, number);
        this.shoppingCartInfo()
    },
    async reduceBtnTap(e) {
        const index = e.currentTarget.dataset.index;
        const item = this.data.shoppingCartInfo.items[index];
        const number = item.number - 1;
        if (number <= 0) {
            // 弹出删除确认
            wx.showModal({
                content: '确定要删除该商品吗？',
                success: (res) => {
                    if (res.confirm) {
                        this.delItemDone(item.shoppingCartId)
                    }
                }
            })
            return
        }
        await WXAPI.shoppingCartInfoModifyNumber(item.shoppingCartId, number);
        this.shoppingCartInfo()
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
            });
            return;
        }
        AUTH.register(this);
    },
    changeCarNumber(e) {
        const shoppingCartId = e.currentTarget.dataset.key;
        const num = e.detail.value;
        WXAPI.shoppingCartInfoModifyNumber(shoppingCartId, num).then(res => {
            this.shoppingCartInfo()
        })
    },
})
