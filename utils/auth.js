const WXAPI = require('apifm-wxapi');

async function checkSession() {
    return new Promise((resolve, reject) => {
        wx.checkSession({
            success() {
                return resolve(true)
            },
            fail() {
                return resolve(false)
            }
        })
    })
}

// 检测登录状态，返回 true / false
async function checkHasLogged() {
    const token = wx.getStorageSync('token');
    if (!token) {
        return false
    }
    const logged = await checkSession();
    if (!logged) {
        wx.removeStorageSync('token');
        return false
    }
    const checkTokenRes = await WXAPI.checkToken();
    if (checkTokenRes.code !== 0) {
        wx.removeStorageSync('token');
        return false
    }
    return true
}

async function wxaCode() {
    return new Promise((resolve, reject) => {
        wx.login({
            success(res) {
                return resolve(res.code)
            },
            fail() {
                wx.showToast({
                    title: '获取code失败',
                    icon: 'none'
                });
                return resolve('获取code失败')
            }
        })
    })
}

async function getUserInfo() {
    return new Promise((resolve, reject) => {
        wx.getUserInfo({
            success: res => {
                return resolve(res);
            },
            fail: err => {
                console.error(err);
                return resolve();
            }
        })
    })
}

async function login(that) {
    wx.login({
        success: function (res) {
            WXAPI.login_wechat(res.code).then(function (res) {
                if (res.code === 10000) {
                    // 去注册
                    this.register(that);
                    return;
                }
                if (res.code !== 0) {
                    // 登录错误
                    wx.showModal({
                        title: '无法登录',
                        content: res.message,
                        showCancel: false
                    });
                    return;
                }

                wx.setStorageSync('token', res.data.token);
                wx.setStorageSync('userId', res.data.userId);

                if (that) {
                    that.onShow()
                }
            })
        }
    })
}

async function register(point) {
    let _this = this;
    wx.login({
        success: function (res) {
            let code = res.code; // 微信登录接口返回的 code 参数，下面注册接口需要用到
            wx.getUserInfo({
                success: function (res) {
                    let iv = res.iv;
                    let encryptedData = res.encryptedData;
                    let referrer = ''; // 推荐人
                    let referrer_storage = wx.getStorageSync('referrer');
                    if (referrer_storage) {
                        referrer = referrer_storage;
                    }
                    // 下面开始调用注册接口
                    WXAPI.register_complex({
                        code: code,
                        encryptedData: encryptedData,
                        iv: iv,
                        referrer: referrer
                    }).then(function () {
                        _this.login(point);
                    })
                }
            })
        }
    })
}

function loginOut() {
    wx.removeStorageSync('token')
    wx.removeStorageSync('userId')
}

async function checkAndAuthorize(scope) {
    return new Promise((resolve, reject) => {
        wx.getSetting({
            success(res) {
                if (!res.authSetting[scope]) {
                    wx.authorize({
                        scope: scope,
                        success() {
                            resolve() // 无返回参数
                        },
                        fail(e) {
                            console.error(e)
                            // if (e.errMsg.indexof('auth deny') != -1) {
                            //   wx.showToast({
                            //     title: e.errMsg,
                            //     icon: 'none'
                            //   })
                            // }
                            wx.showModal({
                                title: '无权操作',
                                content: '需要获得您的授权',
                                showCancel: false,
                                confirmText: '立即授权',
                                confirmColor: '#e64340',
                                success(res) {
                                    wx.openSetting();
                                },
                                fail(e) {
                                    console.error(e)
                                    reject(e)
                                },
                            })
                        }
                    })
                } else {
                    resolve() // 无返回参数
                }
            },
            fail(e) {
                console.error(e);
                reject(e)
            }
        })
    })
}

module.exports = {
    checkHasLogged: checkHasLogged,
    wxaCode: wxaCode,
    getUserInfo: getUserInfo,
    login: login,
    register: register,
    loginOut: loginOut,
    checkAndAuthorize: checkAndAuthorize
}