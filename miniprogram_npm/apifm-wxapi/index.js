module.exports =
    (function (modules) { // webpackBootstrap
        // The module cache
        let installedModules = {};

        // The require function
        function __webpack_require__(moduleId) {
            // Check if module is in cache
            if (installedModules[moduleId]) {
                return installedModules[moduleId].exports;
            }
            // Create a new module (and put it into the cache)
            let module = installedModules[moduleId] = {
                i: moduleId,
                l: false,
                exports: {}

            };
            // Execute the module function
            modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
            // Flag the module as loaded
            module.l = true;
            // Return the exports of the module
            return module.exports;
        }

        // expose the modules object (__webpack_modules__)
        __webpack_require__.m = modules;
        // expose the module cache
        __webpack_require__.c = installedModules;
        // define getter function for harmony exports
        __webpack_require__.d = function (exports, name, getter) {
            if (!__webpack_require__.o(exports, name)) {
                Object.defineProperty(exports, name, {enumerable: true, get: getter});
            }
        };
        // define __esModule on exports
        __webpack_require__.r = function (exports) {
            if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
                Object.defineProperty(exports, Symbol.toStringTag, {value: 'Module'});
            }
            Object.defineProperty(exports, '__esModule', {value: true});
        };

        // create a fake namespace object
        // mode & 1: value is a module id, require it
        // mode & 2: merge all properties of value into the ns
        // mode & 4: return value when already ns object
        // mode & 8|1: behave like require
        __webpack_require__.t = function (value, mode) {
            if (mode & 1) value = __webpack_require__(value);
            if (mode & 8) return value;

            if ((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;

            let ns = Object.create(null);

            __webpack_require__.r(ns);

            Object.defineProperty(ns, 'default', {enumerable: true, value: value});

            if (mode & 2 && typeof value != 'string') for (let key in value) __webpack_require__.d(ns, key, function (key) {
                return value[key];
            }.bind(null, key));

            return ns;
        };

        // getDefaultExport function for compatibility with non-harmony modules
        __webpack_require__.n = function (module) {
            let getter = module && module.__esModule ?
                function getDefault() {
                    return module['default'];
                } :
                function getModuleExports() {
                    return module;
                };

            __webpack_require__.d(getter, 'a', getter);

            return getter;
        };

        // Object.prototype.hasOwnProperty.call
        __webpack_require__.o = function (object, property) {
            return Object.prototype.hasOwnProperty.call(object, property);
        };

        // __webpack_public_path__
        __webpack_require__.p = "";

        // Load entry module and return exports
        return __webpack_require__(__webpack_require__.s = 0);

    })
    /************************************************************************/
    ([
        (function (module, exports, __webpack_require__) {
            "use strict";
            /* eslint-disable */
            // 小程序开发api接口工具包，https://github.com/gooking/wxapi
            let API_BASE_URL = 'http://127.0.0.1:8088';
            // let API_BASE_URL = 'http://127.0.0.1:8081';
            let subDomain = '-';

            const request = function request(url, needSubDomain, method, data) {
                needSubDomain = false; //为了适应自己开发的代码，而不采用api工厂
                let _url = API_BASE_URL + (needSubDomain ? '/' + subDomain : '') + url;
                let token = wx.getStorageSync('token');

                return new Promise(function (resolve, reject) {
                    wx.request({
                        url: _url,
                        method: method,
                        data: data,
                        header: {
                            // 'Content-Type': 'application/x-www-form-urlencoded'
                            'Content-Type': 'application/json', //小程序登录时用到json，其他要是也可以的话，就不改了。不然就改一下，用x-www-form-urlencoded
                            'Gin-Access-Token': token
                        },
                        success: function success(request) {
                            resolve(request.data);
                        },
                        fail: function fail(error) {
                            reject(error);
                        },
                        complete: function complete(aaa) {
                            // 加载完成
                        }
                    });
                });
            };

            /**
             * 小程序的promise没有finally方法，自己扩展下
             */
            Promise.prototype.finally = function (callback) {
                let Promise = this.constructor;
                return this.then(function (value) {
                    Promise.resolve(callback()).then(function () {
                        return value;
                    });
                }, function (reason) {
                    Promise.resolve(callback()).then(function () {
                        throw reason;
                    });
                });
            };

            module.exports = {
                init2: function init2(a, b) {
                    API_BASE_URL = a;
                    subDomain = b;
                },
                init: function init(b) {
                    subDomain = b;
                },
                request: request,
                queryMobileLocation: function queryMobileLocation() {
                    let mobile = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

                    return request('/common/mobile-segment/location', false, 'get', {mobile: mobile});
                },
                nextMobileSegment: function nextMobileSegment(data) {
                    return request('/common/mobile-segment/next', false, 'post', data);
                },
                queryConfigValue: function queryConfigValue(key) {
                    return request('/config/value', true, 'get', {key: key});
                },
                queryConfigBatch: function queryConfigBatch(keys) {
                    return request('/api/config/values', true, 'get', {keys: keys});
                },
                scoreSign: function scoreSign() {
                    return request('/score/sign', true, 'post', {});
                },
                scoreSignLogs: function scoreSignLogs() {
                    return request('/score/sign/logs', true, 'post', {});
                },
                scoreExchange: function scoreExchange(number) {
                    return request('/score/exchange', true, 'post', {
                        number: number
                    });
                },
                scoreExchangeCash: function scoreExchangeCash(deductionScore) {
                    return request('/score/exchange/cash', true, 'post', {
                        deductionScore: deductionScore
                    });
                },
                scoreLogs: function scoreLogs(data) {
                    return request('/score/logs', true, 'post', data);
                },
                shareGroupGetScore: function shareGroupGetScore(code, referrer, encryptedData, iv) {
                    return request('/score/share/wxa/group', true, 'post', {
                        code: code,
                        referrer: referrer,
                        encryptedData: encryptedData,
                        iv: iv
                    });
                },
                bargainSet: function bargainSet(productId) {
                    return request('/api/shop/bargain_set', true, 'get', {productId: productId});
                },
                bargainJoin: function bargainJoin(bargainId) {
                    return request('/shop/products/bargain/join', true, 'post', {
                        bargainId: bargainId
                    });
                },
                bargainDetail: function bargainDetail(bargainId, joiner) {
                    return request('/shop/products/bargain/info', true, 'get', {
                        bargainId: bargainId,
                        joiner: joiner
                    });
                },
                bargainHelp: function bargainHelp(bargainId, joiner) {
                    let remark = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';

                    return request('/shop/products/bargain/help', true, 'post', {
                        bargainId: bargainId,
                        joinerUser: joiner,
                        remark: remark
                    });
                },

                bargainHelpDetail: function bargainHelpDetail(bargainId, joiner) {
                    return request('/shop/products/bargain/myHelp', true, 'get', {
                        bargainId: bargainId,
                        joinerUser: joiner
                    });
                },
                checkToken: function checkToken() {
                    return request('/api/auth/checkToken', true, 'get', {});
                },

                wechatPay: function wechatPay(data) {
                    return request('/api/pay/micro_wechat_pay', true, 'post', data);
                },
                updateOrder: function wechatPay(data) {
                    return request('/api/pay/update_order', true, 'post', data);
                },
                login_wechat: function login_wechat(code) {
                    return request('/api/auth/loginByWeChat', true, 'post', {
                        code: code,
                        type: 2
                    });
                },

                register_complex: function register_complex(data) {
                    return request('/api/auth/registerByWeChat', true, 'post', data);
                },

                banners: function banners(data) {
                    return request('/api/shop/banner_list', true, 'get', data);
                },
                productsCategory: function productsCategory() {
                    return request('/api/shop/category_list', true, 'get');
                },

                products: function products(data) {
                    return request('/api/shop/product_list', true, 'get', data);
                },
                productsDetail: function productsDetail(id) {
                    return request('/api/shop/product_detail', true, 'get', {
                        productId: id
                    });
                },

                productsPrice: function productsPrice(productId, productOptionIds) {
                    return request('/api/shop/product_price', true, 'post', {
                        productId: productId, productOptionIds: productOptionIds
                    });
                },

                productsReputation: function productsReputation(data) {
                    return request('/api/shop/product_detail', true, 'get', data);
                },
                productsFavList: function productsFavList(data) {
                    return request('/shop/products/fav/list', true, 'post', data);
                },
                productsFavPut: function productsFavPut(productId) {
                    return request('/shop/products/fav/add', true, 'post', {
                        productId: productId
                    });
                },
                productsFavCheck: function productsFavCheck(token, productId) {
                    return request('/shop/products/fav/check', true, 'get', {
                        productId: productId
                    });
                },
                productsFavDelete: function productsFavDelete() {
                    let id = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
                    let productId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

                    return request('/shop/products/fav/delete', true, 'post', {
                        id: id, productId: productId
                    });
                },
                coupons: function coupons(data) {
                    return request('/api/user/coupons', true, 'get', data);
                },
                couponDetail: function couponDetail(id) {
                    return request('/discounts/detail', true, 'get', {
                        id: id
                    });
                },
                myCoupons: function myCoupons(data) {
                    return request('/discounts/my', true, 'get', data);
                },

                fetchCoupons: function fetchCoupons(data) {
                    return request('/discounts/fetch', true, 'post', data);
                },
                noticeList: function noticeList(data) {
                    return request('/notice/list', true, 'post', data);
                },
                noticeDetail: function noticeDetail(id) {
                    return request('/notice/detail', true, 'get', {
                        id: id
                    });
                },
                addAddress: function addAddress(data) {
                    return request('/api/user/address_add', true, 'post', data);
                },
                updateAddress: function updateAddress(data) {
                    return request('/api/user/address_update', true, 'post', data);
                },
                setDefaultAddress: function updateAddress(data) {
                    return request('/api/user/set_default_address', true, 'post', data);
                },
                deleteAddress: function deleteAddress(id) {
                    return request('/api/user/address/_delete', true, 'post', {
                        id: id
                    });
                },
                queryAddress: function queryAddress() {
                    return request('/api/user/address_list', true, 'get', {});
                },
                defaultAddress: function defaultAddress() {
                    return request('/api/user/address_default', true, 'get', {});
                },
                addressDetail: function addressDetail(id) {
                    return request('/api/user/address_detail', true, 'get', {
                        addressId: id
                    });
                },
                groupSet: function groupSet(productId) {
                    return request('/shop/products/group/set', true, 'get', {
                        productId: productId
                    });
                },

                groupOpen: function groupOpen(productId) {
                    return request('/shop/products/group/open', true, 'post', {
                        productId: productId
                    });
                },
                groupList: function groupList(data) {
                    return request('/shop/products/group/list/v2', true, 'post', data);
                },

                videoDetail: function videoDetail(videoId) {
                    return request('/media/video/detail', true, 'get', {
                        videoId: videoId
                    });
                },
                bindMobileWxa: function bindMobileWxa(encryptedData, iv) {
                    let pwd = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';

                    return request('/user/bindMobile', true, 'post', {
                        encryptedData: encryptedData, iv: iv, pwd: pwd
                    });
                },
                userDetail: function userDetail() {
                    return request('/api/user/info', true, 'get', {});
                },
                userAmount: function userAmount() {
                    return request('/api/user/wallet', true, 'get', {});
                },
                orderCreate: function orderCreate(data) {
                    return request('/api/user/order_create', true, 'post', data);
                },
                orderList: function orderList(data) {
                    return request('/api/user/order_list', true, 'get', data);
                },
                orderDetail: function orderDetail(id) {
                    let verificationNumber = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
                    return request('/order/detail', true, 'get', {
                        id: id,
                        verificationNumber: verificationNumber
                    });
                },
                orderDelivery: function orderDelivery(orderId) {
                    return request('/order/delivery', true, 'post', {
                        orderId: orderId
                    });
                },
                orderReputation: function orderReputation(data) {
                    return request('/order/reputation', true, 'post', data);
                },
                orderClose: function orderClose(orderId) {
                    return request('/order/close', true, 'post', {
                        orderId: orderId,
                    });
                },
                orderPay: function orderPay(orderId) {
                    return request('/order/pay', true, 'post', {
                        orderId: orderId
                    });
                },
                orderHX: function orderHX(verificationNumber) {
                    return request('/order/hx', true, 'post', {
                        verificationNumber: verificationNumber
                    });
                },
                orderStatistics: function orderStatistics() {
                    return request('/api/user/order_statistics', true, 'get', {});
                },
                withDrawApply: function withDrawApply(money) {
                    return request('/user/withDraw/apply', true, 'post', {
                        money: money
                    });
                },
                withDrawLogs: function withDrawLogs(data) {
                    return request('/user/withDraw/list', true, 'post', data);
                },
                province: function province() {
                    return request('/api/common/province_list', false, 'get');
                },
                nextRegion: function nextRegion(pCode) {
                    return request('/api/common/city_list', false, 'get', {
                        provinceCode: pCode
                    });
                },
                nextArea: function nextArea(cCode) {
                    return request('/api/common/area_list', false, 'get', {
                        cityCode: cCode
                    });
                },
                cashLogs: function cashLogs(data) {
                    return request('/api/user/cashLog', true, 'get', data);
                },
                rechargeSendRules: function rechargeSendRules() {
                    return request('/user/recharge/send/rule', true, 'get');
                },
                payBillDiscounts: function payBillDiscounts() {
                    return request('/payBill/discounts', true, 'get');
                },
                payBill: function payBill(money) {
                    return request('/payBill/pay', true, 'post', {money: money});
                },
                wxaQrcode: function wxaQrcode(data) {
                    return request('/qrcode/wxa/unlimited', true, 'post', data);
                },
                uploadFile: function uploadFile(tempFilePath) {
                    let expireHours = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
                    // let uploadUrl = API_BASE_URL + '/' + subDomain + '/dfs/upload/file';
                    let uploadUrl = API_BASE_URL + '/dfs/upload/file';

                    return new Promise(function (resolve, reject) {
                        wx.uploadFile({
                            url: uploadUrl,
                            filePath: tempFilePath,
                            name: 'upFile',
                            formData: {
                                expireHours: expireHours
                            },
                            success: function success(res) {
                                resolve(JSON.parse(res.data));
                            },
                            fail: function fail(error) {
                                reject(error);
                            },
                            complete: function complete(aaa) {
                                // 加载完成
                            }
                        });
                    });
                },
                refundApply: function refundApply(data) {
                    return request('/order/refundApply/apply', true, 'post', data);
                },
                refundApplyDetail: function refundApplyDetail(orderId) {
                    return request('/order/refundApply/info', true, 'get', {
                        orderId: orderId
                    });
                },
                refundApplyCancel: function refundApplyCancel(orderId) {
                    return request('/order/refundApply/cancel', true, 'post', {
                        orderId: orderId
                    });
                },
                invoiceList: function invoiceList(data) {
                    return request('/invoice/list', true, 'post', data);
                },
                invoiceApply: function invoiceApply(data) {
                    return request('/api/invoice/apply', true, 'post', data);
                },
                depositList: function depositList(data) {
                    return request('/deposit/list', true, 'post', data);
                },
                payDeposit: function payDeposit(data) {
                    return request('/deposit/pay', true, 'post', data);
                },
                fetchShops: function fetchShops(data) {
                    return request('/shop/subShop/list', true, 'post', data);
                },
                shopSubDetail: function shopSubDetail(id) {
                    return request('/api/shop/product_detail', true, 'get', {productId: id});
                },

                modifyUserInfo: function modifyUserInfo(data) {
                    return request('/user/modify', true, 'post', data);
                },

                loginOut: function loginOut(token) {
                    return request('/user/loginOut', true, 'get', {token: token});
                },

                encryptedData: function encryptedData(code, _encryptedData, iv) {
                    return request('/user/wxapp/decode/encryptedData', true, 'post', {
                        code: code, encryptedData: _encryptedData, iv: iv
                    });
                },
                scoreDeductionRules: function scoreDeductionRules() {
                    let type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

                    return request('/score/deduction/rules', true, 'get', {type: type});
                },

                productsDynamic: function productsDynamic(type) {
                    return request('/api/shop/product_dynamic', true, 'get', {type: type});
                },

                shoppingCartInfo: function shoppingCartInfo() {
                    return request('/api/user/shoppingCart/info', true, 'get', {});
                },
                addItemToShoppingCart: function addItemToShoppingCart(productId, number, productOptionIds) {
                    return request('/api/user/shoppingCart/add', true, 'post', {
                        productId: productId, number: number, productOptionIds: productOptionIds
                    });
                },
                shoppingCartInfoModifyNumber: function shoppingCartInfoModifyNumber(shoppingCartId, number) {
                    return request('/api/user/shoppingCart/modifyNumber', true, 'post', {
                        shoppingCartId: shoppingCartId, number: number
                    });
                },
                shoppingCartInfoRemoveItem: function shoppingCartInfoRemoveItem(shoppingCartId) {
                    return request('/api/user/shoppingCart/remove', true, 'post', {
                        shoppingCartId: shoppingCartId
                    });
                },
                shoppingCartInfoRemoveAll: function shoppingCartInfoRemoveAll() {
                    return request('/api/user/shoppingCart/empty', true, 'post', {});
                },
                growthLogs: function growthLogs(data) {
                    return request('/growth/logs', true, 'post', data);
                },
                exchangeScoreToGrowth: function exchangeScoreToGrowth(deductionScore) {
                    return request('/growth/exchange', true, 'post', {
                        deductionScore: deductionScore
                    });
                },
                wxaMpLiveRooms: function wxaMpLiveRooms() {
                    return request('/wx/live/rooms', true, 'get');
                }
            };
        })
    ]);