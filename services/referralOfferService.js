import ReferralOffer from "../models/referralOfferModel.js";


export const getReferralOffersService = async () => {

    const offers = await ReferralOffer.find().sort({createdAt: -1})

    return offers
}

export const createReferralOfferService = async (offerData) => {

    const {
        offerName,
        referrerReward,
        referredUserReward,
        startDate,
        endDate,
        isActive
    } = offerData

    if (!offerName?.trim()) {
        return {
            success: false,
            message: "Offer name is required"
        }
    }

    const referrerAmount = Number(referrerReward)
    const referredAmount = Number(referredUserReward)

    if (referrerAmount <= 0) {
        return {
            success: false,
            message: "Referrer reward must be greater than 0"
        }
    }

    if (referredAmount <= 0) {
        return {
            success: false,
            message: "Referred user reward must be greater than 0"
        }
    }

    if (!startDate || !endDate) {
        return {
            success: false,
            message: "Start date and end date are required"
        }
    }

    if (new Date(endDate) <= new Date(startDate)) {
        return {
            success: false,
            message: "End date must be after start date"
        }
    }

    const offer = await ReferralOffer.create({
        offerName: offerName.trim(),
        referrerReward: referrerAmount,
        referredUserReward: referredAmount,
        startDate,
        endDate,
        isActive: isActive === "on" || isActive === true
    })

    return {
        success: true,
        offer
    }
}


export const getReferralOfferByIdService = async (id) => {

    const offer = await ReferralOffer.findById(id)

    if (!offer) {
        return {
            success: false,
            message: "Referral offer not found"
        }
    }

    return {
        success: true,
        offer
    }
}

export const updateReferralOfferService = async (id, offerData) => {

    const {
        offerName,
        referrerReward,
        referredUserReward,
        startDate,
        endDate,
        isActive
    } = offerData

    const referrerAmount = Number(referrerReward)
    const referredAmount = Number(referredUserReward)

    if (!offerName?.trim()) {
        return {
            success: false,
            message: "Offer name is required"
        }
    }

    if (referrerAmount <= 0 || referredAmount <= 0) {
        return {
            success: false,
            message: "Reward amount must be greater than 0"
        }
    }

    if (new Date(endDate) <= new Date(startDate)) {
        return {
            success: false,
            message: "End date must be after start date"
        };
    }

    const offer = await ReferralOffer.findById(id);

    if (!offer) {
        return {
            success: false,
            message: "Referral offer not found"
        };
    }

    offer.offerName = offerName.trim();
    offer.referrerReward = referrerAmount;
    offer.referredUserReward = referredAmount;
    offer.startDate = startDate;
    offer.endDate = endDate;
    offer.isActive = isActive === "on" || isActive === true;

    await offer.save();

    return {
        success: true,
        offer
    }

    if (!offer) {
        return {
            success: false,
            message: "Referral offer not found"
        }
    }

    return {
        success: true,
        offer
    }
}


export const deleteReferralOfferService = async (id) => {

    const offer = await ReferralOffer.findByIdAndDelete(id)

    if (!offer) {
        return {
            success: false,
            message: "Referral offer not found"
        };
    }

    return {
        success: true
    }
}