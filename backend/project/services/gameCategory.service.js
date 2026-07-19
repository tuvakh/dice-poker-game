import { GameCategory } from '../models/GameCategory.js';
import { CustomError } from '../utils/customError.js';

export async function getAllGameCategories(){
    const gameCategory = await GameCategory.find();
    return gameCategory;
}

export async function getGameCategory(gameCategoryId){
    const gameCategory = await GameCategory.findOne({gameCategoryId});

    if(!gameCategory){
		throw new CustomError(`We have 18 game categories, but ${gameCategoryId} is sadly not one of them.`, 404, "NOT_FOUND");
	}

    return gameCategory;
}

export default {
    getAllGameCategories,
    getGameCategory,
};