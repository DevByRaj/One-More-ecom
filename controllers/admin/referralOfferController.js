import {
    getReferralOffersService,
    createReferralOfferService,
    getReferralOfferByIdService,
    updateReferralOfferService,
    deleteReferralOfferService
} from "../../services/referralOfferService.js";


export const getReferralOfferList = async (req, res) => {
    try {

        const offers = await getReferralOffersService();

        return res.render("admin/referralOffers", {
            offers
        })

    } catch (error) {

        console.log(error);

        return res.redirect("/admin/dashboard")
    }
}

export const getAddReferralOffer = (req, res) => {

    return res.render("admin/referralOfferForm", {
        offer: {},
        error: null,
        isEdit: false
    })
}

export const addReferralOffer = async (req, res) => {
    try {

        const result = await createReferralOfferService(req.body)

        if (!result.success) {

            return res.render("admin/referralOfferForm", {
                offer: req.body,
                error: result.message,
                isEdit: false
            })
        }

        return res.redirect("/admin/referral-offers")

    } catch (error) {

        console.log(error)

        return res.render("admin/referralOfferForm", {
            offer: req.body,
            error: "Unable to create referral offer",
            isEdit: false
        })
    }
}

export const getEditReferralOffer = async (req, res) => {
    try {

        const result = await getReferralOfferByIdService(
            req.params.id
        )

        if (!result.success) {
            return res.redirect("/admin/referral-offers")
        }

        return res.render("admin/referralOfferForm", {
            offer: result.offer,
            error: null,
            isEdit: true
        })

    } catch (error) {

        console.log(error)

        return res.redirect("/admin/referral-offers")
    }
}


export const updateReferralOffer = async (req, res) => {
    try {

        const result = await updateReferralOfferService(
            req.params.id,
            req.body
        )

        if (!result.success) {

            return res.render("admin/referralOfferForm", {
                offer: {
                    ...req.body,
                    _id: req.params.id
                },
                error: result.message,
                isEdit: true
            })
        }

        return res.redirect("/admin/referral-offers")

    } catch (error) {

        console.log(error)

        return res.render("admin/referralOfferForm", {
            offer: {
                ...req.body,
                _id: req.params.id
            },
            error: "Unable to update referral offer",
            isEdit: true
        })
    }
}

export const deleteReferralOffer = async (req, res) => {
    try {

        const result = await deleteReferralOfferService(
            req.params.id
        );

        if (!result.success) {
            return res.redirect("/admin/referral-offers")
        }

        return res.redirect("/admin/referral-offers")

    } catch (error) {

        console.log(error);

        return res.redirect("/admin/referral-offers")
    }
}