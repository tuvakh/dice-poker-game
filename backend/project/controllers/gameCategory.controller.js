import { matchedData } from "express-validator";
import gameCategoryServices from "../services/gameCategory.service.js";

export async function getAllGameCategories(req, res, next){
    try {
        const result = await gameCategoryServices.getAllGameCategories();
        res.status(200).json(result) 
    } catch (error) {
        next(error);
    }
}

export async function getGameCategory(req, res, next){
    try {
        const { gameCategoryId } = matchedData(req);
        const result = await gameCategoryServices.getGameCategory(gameCategoryId);
        res.status(200).json(result) 
    } catch (error) {
        next(error);
    }
}

export default {
    getAllGameCategories,
    getGameCategory
};