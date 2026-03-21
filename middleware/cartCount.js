const Cart=require("../models/cartSchema")

const cartCountMiddleware=async (req, res, next) => {
  try {
    if (req.session.user) {
      const cart = await Cart.findOne({ user_id: req.session.user });

      let count = 0;

      if (cart) {
        count = cart.items.reduce((total, item) => {
          return total + item.quantity;
        }, 0);
      }

      res.locals.cartCount = count;
    } else {
      res.locals.cartCount = 0;
    }
  } catch (error) {
    res.locals.cartCount = 0;
  }

  next();
}

module.exports=cartCountMiddleware