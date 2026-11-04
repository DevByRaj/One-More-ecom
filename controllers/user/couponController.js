import logger from "../../utils/logger.js";
import {getAvailableCouponsService} from "../../services/couponService.js";

export const getCoupons = async (req, res) => {
    try {

        const userId = req.session.user

        const result = await getAvailableCouponsService(userId)

        return res.render("user/coupons", {
            coupons: result.coupons
        });

    } catch (error) {
        logger.error("Failed to fetch available coupons", {
            message: error.message,
            stack: error.stack
        })

        return res.redirect("/")

    }
}