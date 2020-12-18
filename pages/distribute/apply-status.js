const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const ImageUtil = require('../../utils/image')

Page({

    /**
     * 页面的初始数据
     */
    data: {
        wechatLogin: true,

        applyStatus: -2, // -1 表示未申请，0 审核中 1 不通过 2 通过
        applyInfo: {},
        canvasHeight: 0,

        currentPages: undefined,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {

    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        AUTH.checkHasLogged().then(isLoggedIn => {
            this.setData({
                wechatLogin: isLoggedIn
            })
            if (isLoggedIn) {
                this.doneShow();
            }
        })
    },
    async doneShow() {
        const _this = this
        const userDetail = await WXAPI.userDetail()
        WXAPI.distributeApplyProgress().then(res => {
            let applyStatus = userDetail.data.isSeller ? 2 : -1
            if (res.code === 2000) {
                this.setData({
                    wechatLogin: false
                })
                return
            }
            if (res.code === 700) {
                _this.setData({
                    applyStatus: applyStatus
                })
            }
            if (res.code === 0) {
                if (userDetail.data.isSeller) {
                    applyStatus = 2
                } else {
                    applyStatus = res.data.status
                }
                _this.setData({
                    applyStatus: applyStatus,
                    applyInfo: res.data
                })
            }
            if (applyStatus === 2) {
                _this.fetchQrCode()
            }
        })
        this.setData({
            currentPages: getCurrentPages()
        })
    },
    fetchQrCode() {
        const _this = this
        wx.showLoading({
            title: '加载中',
            mask: true
        })
        WXAPI.wxaQrcode({
            scene: 'inviterId=' + wx.getStorageSync('userId'),
            page: 'pages/index/index',
            is_hyaline: true,
            autoColor: true,
            expireHours: 1
        }).then(res => {
            wx.hideLoading()
            if (res.code === 0) {
                _this.showCanvas(res.data)
            }
        })
    },
    showCanvas(qrCode) {
        const _this = this
        let ctx
        wx.getImageInfo({
            src: qrCode,
            success: (res) => {
                const imageSize = ImageUtil.imageUtil(res.width, res.height)
                const qrCodeWidth = imageSize.windowWidth / 2
                _this.setData({
                    canvasHeight: qrCodeWidth
                })
                ctx = wx.createCanvasContext('firstCanvas', {})
                ctx.setFillStyle('#fff')
                ctx.fillRect(0, 0, imageSize.windowWidth, imageSize.imageHeight + qrCodeWidth)
                ctx.drawImage(res.path, (imageSize.windowWidth - qrCodeWidth) / 2, 0, qrCodeWidth, qrCodeWidth)
                setTimeout(function () {
                    wx.hideLoading()
                    ctx.draw()
                }, 1000)
            }
        })
    },
    onShareAppMessage() {
        return {
            title: '"' + wx.getStorageSync('mallName') + '" ' + wx.getStorageSync('share_profile'),
            path: '/pages/index/index?inviterId=' + wx.getStorageSync('userId'),
            success: function (res) {
                // 转发成功
            },
            fail: function (res) {
                // 转发失败
            }
        }
    },
    bindSave: function (e) {
        wx.navigateTo({
            url: "/pages/distribute/apply"
        })
    },
    goShop: function (e) {
        wx.switchTab({
            url: '/pages/index/index',
        })
    },
    saveToMobile() { //下载二维码到手机
        wx.canvasToTempFilePath({
            canvasId: 'firstCanvas',
            success: function (res) {
                let tempFilePath = res.tempFilePath
                wx.saveImageToPhotosAlbum({
                    filePath: tempFilePath,
                    success: (res) => {
                        wx.showModal({
                            content: '二维码已保存到手机相册',
                            showCancel: false,
                            confirmText: '知道了',
                            confirmColor: '#333'
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
            }
        })
    },
    goIndex() {
        wx.switchTab({
            url: '/pages/index/index',
        });
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