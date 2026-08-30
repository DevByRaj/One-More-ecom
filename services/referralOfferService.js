import ReferralOffer from "../models/referralOfferModel.js";
import User from "../models/userModel.js";
import { creditWallet } from "./walletService.js";

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

export const processReferralRewardService = async (userId) => {

    const referredUser = await User.findById(userId)

    if (!referredUser) {
        return {
            success: false,
            message: "User not found"
        }
    }

    if (!referredUser.referredBy) {
        return {
            success: false,
            message: "User was not referred"
        }
    }

    if (referredUser.referralRewardClaimed) {
        return {
            success: false,
            message: "Referral reward already claimed"
        }
    }

    const now = new Date()

    const referralOffer = await ReferralOffer.findOne({
        isActive: true,
        startDate: {$lte: now},
        endDate: {$gte: now}
    }).sort({
        createdAt: -1
    })

    if (!referralOffer) {
        return {
            success: false,
            message: "No active referral offer"
        }
    }

    const referrer = await User.findById(
        referredUser.referredBy
    )

    if (!referrer) {
        return {
            success: false,
            message: "Referring user not found"
        };
    }

    await creditWallet(
        referrer._id,
        referralOffer.referrerReward,
        "Referral reward",
        null,
        "Credit"
    );

    await creditWallet(
        referredUser._id,
        referralOffer.referredUserReward,
        "Referral signup reward",
        null,
        "Credit"
    )

    referredUser.referralRewardClaimed = true;

    await referredUser.save()

    return {
        success: true,
        message: "Referral rewards credited successfully",
        referrerReward: referralOffer.referrerReward,
        referredUserReward: referralOffer.referredUserReward
    }
}