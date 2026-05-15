// This controller only handles the HTTP request and response, while the actual logic lives in the service files.
// matchedData(req) gives us the fields that passed validation, instead of raw data from the request.

import queueServices from '../services/queue.service.js';
import { matchedData } from 'express-validator';

// This function makes it possible for a player to join the matchmaking queue. 
// If a suitable opponent is already waiting, a match is created immediately and returned. 
// Otherwise the player waits in the queue until a match is found.
export async function joinQueue(req, res, next) {
    try {
        const data = matchedData(req);
        const result = await queueServices.joinQueue(data);
        res.status(200).json(result);
    // next(error) forwards the error (if any) to middleware/error.js      
    } catch (error) {
        next(error);
    }
}

// This function removes a player from the queue
// Only their userId is needed to find and delete their entry
export async function leaveQueue(req, res, next) {
    try {
        const data = matchedData(req);
        const result = await queueServices.leaveQueue(data.userId);
        res.status(200).json(result);
    // next(error) forwards the error (if any) to middleware/error.js      
    } catch (error) {
        next(error);
    }
}

// This exports the functions as a default objects, so routes can import them in one line
export default { 
    joinQueue, 
    leaveQueue 
};
