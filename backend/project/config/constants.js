// Shared validation limits used/imported across model and validator files
// Used to keep limits consistent, and to avoid having to update multiple places if something change
export const MIN_USERNAME_LENGTH = 3; // characters
export const MAX_USERNAME_LENGTH = 128; // characters

export const MIN_PASSWORD_LENGTH = 8; // characters
export const MAX_PASSWORD_LENGTH = 128; // characters

export const MIN_AGE = 18; // years

export const MIN_TITLE_LENGTH = 3; // characters
export const MAX_TITLE_LENGTH = 128; // characters
export const MIN_DESCRIPTION_LENGTH = 1; // characters
export const MAX_DESCRIPTION_LENGTH = 1000; // characters

export const MIN_COMMENT_LENGTH = 1; // characters
export const MAX_COMMENT_LENGTH = 1000; // characters

export const GAME_RULES = ["straights_allowed", "straights_not_allowed"];
export const NUMBER_OF_ROUNDS = [3, 5, 7];
export const TIME_CONTROLLERS = [10, 30, 90];

export const TOURNAMENT_STATUS = ["upcoming", "ongoing", "finished"];
export const MATCH_STATUS = ["waiting", "ongoing", "finished"];
export const USER_ROLE = ["user", "admin"];
export const COMMENT_TARGET = ["match", "tournament"];

export const LEADERBOARD_SORT_OPTIONS = ["wins", "winPercentage", "matches", "elo"];

export const MONTHLY_COIN_GRANT = 100;

export const REVEAL_DELAY_MS = 3000;

