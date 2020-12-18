const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
Page({
    data: {
        provinces: undefined,// 省份数据数组
        pIndex: 0,//选择的省下标
        cities: undefined,// 城市数据数组
        cIndex: 0,//选择的市下标
        areas: undefined,// 区县数数组
        aIndex: 0,//选择的区下标
    },
    async provinces(provinceCode, cityCode, districtCode) {
        const res = await WXAPI.province();
        if (res.code === 0) {
            const provinces = [{
                code: 0,
                name: '请选择'
            }].concat(res.data);
            let pIndex = 0;
            if (provinceCode) {
                pIndex = provinces.findIndex(ele => {
                    return ele.code === provinceCode
                })
            }
            this.setData({
                pIndex,
                provinces: provinces
            })

            if (provinceCode) {
                const e = {detail: {value: pIndex}};
                this.provinceChange(e, cityCode, districtCode)
            }
        }
    },
    async provinceChange(e, cityCode, districtCode) {
        const index = e.detail.value
        this.setData({
            pIndex: index
        })
        const provinceCode = this.data.provinces[index].code
        if (provinceCode === 0) {
            this.setData({
                cities: null,
                cIndex: 0,
                areas: null,
                aIndex: 0
            })
            return
        }
        const res = await WXAPI.nextRegion(provinceCode);
        if (res.code === 0) {
            const cities = [{
                code: 0,
                name: '请选择'
            }].concat(res.data)
            let cIndex = 0
            if (cityCode) {
                cIndex = cities.findIndex(ele => {
                    return ele.code === cityCode
                })
            }
            this.setData({
                cIndex,
                cities: cities
            })
            if (cityCode) {
                const e = {detail: {value: cIndex}}
                this.cityChange(e, districtCode)
            }
        }
    },
    async cityChange(e, districtCode) {
        const index = e.detail.value
        this.setData({
            cIndex: index
        })
        const cityCode = this.data.cities[index].code
        if (cityCode === 0) {
            this.setData({
                areas: null,
                aIndex: 0
            })
            return
        }
        const res = await WXAPI.nextArea(cityCode);
        if (res.code === 0) {
            const areas = [{
                code: 0,
                name: '请选择'
            }].concat(res.data)
            let aIndex = 0
            if (districtCode) {
                aIndex = areas.findIndex(ele => {
                    return ele.code === districtCode
                })
            }
            this.setData({
                aIndex,
                areas: areas
            })
            if (districtCode) {
                const e = {detail: {value: aIndex}}
                this.areaChange(e)
            }
        }
    },
    async areaChange(e) {
        const index = e.detail.value
        this.setData({
            aIndex: index
        })
    },
    async bindSave(e) {
        if (this.data.pIndex === 0) {
            wx.showToast({
                title: '请选择省份',
                icon: 'none'
            })
            return
        }
        if (this.data.cIndex === 0) {
            wx.showToast({
                title: '请选择城市',
                icon: 'none'
            })
            return
        }
        const contact = e.detail.value.contact;
        const address = e.detail.value.address;
        const phone = e.detail.value.phone;
        const code = '322000';
        if (contact === "") {
            wx.showToast({
                title: '请填写联系人姓名',
                icon: 'none'
            })
            return
        }
        if (phone === "") {
            wx.showToast({
                title: '请填写手机号码',
                icon: 'none'
            })
            return
        }
        if (address === "") {
            wx.showToast({
                title: '请填写详细地址',
                icon: 'none'
            })
            return
        }
        const postData = {
            contact: contact,
            address: address,
            phone: phone,
            code: code,
            isDefault: true,
        }
        if (this.data.pIndex > 0) {
            postData.provinceCode = this.data.provinces[this.data.pIndex].code
            postData.province = this.data.provinces[this.data.pIndex].name
        }
        if (this.data.cIndex > 0) {
            postData.cityCode = this.data.cities[this.data.cIndex].code
            postData.city = this.data.cities[this.data.cIndex].name
        }
        if (this.data.aIndex > 0) {
            postData.areaCode = this.data.areas[this.data.aIndex].code
            postData.area = this.data.areas[this.data.aIndex].name
        }
        let apiResult
        if (this.data.id) {
            postData.addressId = this.data.id
            apiResult = await WXAPI.updateAddress(postData)
        } else {
            apiResult = await WXAPI.addAddress(postData)
        }
        if (apiResult.code !== 0) {
            // 登录错误
            wx.hideLoading();
            wx.showToast({
                title: apiResult.message,
                icon: 'none'
            })
        } else {
            wx.navigateBack()
        }
    },
    async onLoad(e) {
        if (e.id) { // 修改初始化数据库数据
            const res = await WXAPI.addressDetail(e.id)
            if (res.code === 0) {
                this.setData({
                    id: e.id,
                    addressData: res.data
                })
                this.provinces(res.data.provinceCode, res.data.cityCode, res.data.areaCode)
            } else {
                wx.showModal({
                    title: '错误',
                    content: '无法获取快递地址数据',
                    showCancel: false
                })
            }
        } else {
            this.provinces()
        }
    },
    deleteAddress: function (e) {
        const id = e.currentTarget.dataset.id;
        wx.showModal({
            title: '提示',
            content: '确定要删除该收货地址吗？',
            success: function (res) {
                if (res.confirm) {
                    WXAPI.deleteAddress(id).then(function () {
                        wx.navigateBack({})
                    })
                } else {
                    console.log('用户点击取消')
                }
            }
        })
    },
    async readFromWx() {
        let that = this;
        wx.chooseAddress({
            success: function (res) {
                console.log(res)
                const provinceName = res.provinceName;
                const cityName = res.cityName;
                const districtName = res.countyName;
                // 读取省
                const pIndex = that.data.provinces.findIndex(ele => {
                    return ele.name === provinceName
                })
                if (pIndex !== -1) {
                    const e = {
                        detail: {
                            value: pIndex
                        }
                    }
                    that.provinceChange(e, 0, 0).then(() => {
                        // 读取市
                        const cIndex = that.data.cities.findIndex(ele => {
                            return ele.name === cityName
                        })
                        if (cIndex !== -1) {
                            const e = {
                                detail: {
                                    value: cIndex
                                }
                            }
                            that.cityChange(e, 0).then(() => {
                                // 读取区县
                                const aIndex = that.data.areas.findIndex(ele => {
                                    return ele.name === districtName
                                })
                                if (aIndex !== -1) {
                                    const e = {
                                        detail: {
                                            value: aIndex
                                        }
                                    }
                                    that.areaChange(e)
                                }
                            })
                        }
                    })
                }
                const addressData = {}
                addressData.contact = res.userName
                addressData.phone = res.telNumber
                addressData.address = res.detailInfo
                that.setData({
                    addressData
                });
            }
        })
    },
})
