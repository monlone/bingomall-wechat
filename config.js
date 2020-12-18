module.exports = {
    version: "8.7.0",
    note: '发票管理支持下载电子发票', // 这个为版本描述，无需修改
    subDomain: "tz", // 根据教程 https://www.it120.cc/help/qr6l4m.html 查看并设置你自己的 subDomain
    productsDetailSkuShowType: 0, // 0 为点击立即购买按钮后出现规格尺寸、数量的选择； 1为直接在商品详情页面显示规格尺寸、数量的选择，而不弹框
    shopMod: 0, // 0为单店铺版本,1为多店铺版本
    needDelivery: 1, //配送方式:1表示快递,2到店自取
    selfPickup: 2, //配送方式:1表示快递,2到店自取
    buyNow: 1,  //订单类型，购物车下单或立即支付下单，默认是购物车，
    buyFromCart: 2, //订单类型，购物车下单或立即支付下单，默认是购物车，
}