import { matchedData } from "express-validator";
import trophyServices from "../services/trophy.service.js";
import { CustomError } from '../utils/customError.js';

export async function createTrophy(req, res, next){
    try {
        const { title, tournamentId } = matchedData(req);
        
        if (!req.file) {
            return next(new CustomError("Image file is required", 400, "BAD_REQUEST"));
        }
        
        const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
        const result = await trophyServices.createTrophy({ title, tournamentId, image: dataUrl });
        res.status(201).json(result)
    } catch (error) {
        next(error);
    }
}

export async function getAllTrophies(req, res, next){
    try {
        const result = await trophyServices.getAllTrophies();
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export default {
    createTrophy,
    getAllTrophies
};