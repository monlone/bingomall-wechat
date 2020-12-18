const WXAPI = require('apifm-wxapi')

// 显示购物车tabBar的Badge
function showTabBarBadge() {
    WXAPI.shoppingCartInfo().then(res => {
        if (res.code === 700) {
            wx.removeTabBarBadge({
                index: 2
            });
        }
        if (res.code === 0) {
            if (res.data.length === 0) {
                wx.removeTabBarBadge({
                    index: 2
                });
            } else {
                wx.setTabBarBadge({
                    index: 2,
                    text: `${res.data.length}`
                });
            }
        }
    })
}

module.exports = {
    showTabBarBadge: showTabBarBadge
}