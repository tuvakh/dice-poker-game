import { matchedData } from "express-validator";
import matchServices from "../services/match.service.js";

export async function getAllMatches(req, res, next){
    try {
        const { page, limit, status, gameCategoryId, userId } = matchedData(req);
        const result = await matchServices.getAllMatches({ page, limit, status, gameCategoryId, userId });
                
        res.status(200).json(result)  
    } catch (error) {
        next(error);
    }
}

export async function getMatch(req, res, next){
    try {
        const { matchId } = matchedData(req);
        const result = await matchServices.getMatch(matchId);
        res.status(200).json(result)  
    } catch (error) {
        next(error);
    }
}

export async function createMatch(req, res, next){
    try {
        const matchData = matchedData(req);
        const result = await matchServices.createMatch(matchData);
        res.status(201).json(result); 
    } catch (error) {
        next(error);
    }
}

export async function recordMatch(req, res, next){
    try {
        const { matchId, ...matchData } = matchedData(req);
        const result = await matchServices.recordMatch(matchId, matchData);
        res.status(200).json(result);  
    } catch (error) {
        next(error);
    }
}

export async function joinMatch(req, res, next) {
    try {
        const { matchId } = matchedData(req);
        const result = await matchServices.joinMatch(matchId, req.mongoId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function leaveMatch(req, res, next) {
    try {
        const { matchId } = matchedData(req);
        const result = await matchServices.leaveMatch(matchId, req.mongoId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export default {
    getAllMatches,
    getMatch,
    createMatch,
    recordMatch,
    joinMatch,
    leaveMatch
};