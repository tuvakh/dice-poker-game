// This service handles trophy creation.

import { Trophy } from '../models/Trophy.js';

// The image is passed in as a base64 data URL, converted from the uploaded buffer in the controller.
// If tournamentId is provided, the trophy is linked to that tournament
// and will be automatically awarded to the winner when the tournament final is recorded.
async function createTrophy(trophyData){
    return Trophy.create(trophyData);
}

// Returns all trophies so the admin tournament creation form can show a dropdown
async function getAllTrophies(){
    return Trophy.find({});
}

export default {
    createTrophy,
    getAllTrophies
};
