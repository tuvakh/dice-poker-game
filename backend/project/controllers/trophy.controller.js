// This controller only handles the HTTP request and response, while the actual logic lives in the service files.
// matchedData(req) gives us the fields that passed validation, instead of raw data from the request.

import { matchedData } from "express-validator";
import trophyServices from "../services/trophy.service.js";
import { CustomError } from '../utils/customError.js';

// This function creates a trophy with a title, optional tournamentId, and an uploaded image file.
export async function createTrophy(req, res, next){
    try {
        const { title, tournamentId } = matchedData(req);
        
        // req.file is checked manually here because multer handles file uploads outside of express-validator,
        // so the image can't be validated in the normal validator chain.
        if (!req.file) {
            return next(new CustomError("Image file is required", 400, "BAD_REQUEST"));
        }
        
        const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
        const result = await trophyServices.createTrophy({ title, tournamentId, image: dataUrl });
        res.status(201).json(result)
    // next(error) forwards the error (if any) to middleware/error.js      
    } catch (error) {
        next(error);
    }
}

// Returns all trophies — used by the admin tournament creation form
export async function getAllTrophies(req, res, next){
    try {
        const result = await trophyServices.getAllTrophies();
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

// This exports the function as a default object, so routes can import it in one line
export default {
    createTrophy,
    getAllTrophies
};