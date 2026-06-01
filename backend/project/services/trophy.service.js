// This service handles trophy creation.

import { Trophy } from '../models/Trophy.js';

// The image filename is passed in from the controller after multer saves the file to uploads/.
// If tournamentId is provided, the trophy is linked to that tournament
// and will be automatically awarded to the winner when the tournament final is recorded.
export async function createTrophy(trophyData){
    const newTrophy = await Trophy.create(trophyData);
    return newTrophy;
}

// Returns all trophies so the admin tournament creation form can show a dropdown
export async function getAllTrophies(){
    return await Trophy.find({});
}

export default {
    createTrophy,
    getAllTrophies
};