import { Trophy } from '../models/Trophy.js';

async function createTrophy(trophyData){
    return Trophy.create(trophyData);
}

async function getAllTrophies(){
    return Trophy.find({});
}

export default {
    createTrophy,
    getAllTrophies
};
