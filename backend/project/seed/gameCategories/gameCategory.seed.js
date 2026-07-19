import { GameCategory } from "../../models/GameCategory.js";
import gameCategoryRawData from "./gamecategories.json" with { type: "json"};

export default async function gameCategorySeed(){
    await GameCategory.deleteMany({});

    const gameCategoryDocs = gameCategoryRawData.map(gameCategory => new GameCategory(gameCategory));
    const gameCategories = await Promise.all(gameCategoryDocs.map(gameCategory => gameCategory.save()));
    
    console.log("Inserted all categories")

    return gameCategories
}