// This service handles fetching game categories.

import { GameCategory } from '../models/GameCategory.js';
import { CustomError } from '../utils/customError.js';

// getAllGameCategories returns all 18 game categories
export async function getAllGameCategories(){
    const gameCategory = await GameCategory.find();
    return gameCategory;
}

// getGameCategory finds a single category by its numeric gameCategoryId
// and it throws a 404 if the category doesn't exist
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