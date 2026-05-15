# Put here your backend for the Spanish Poker Dice Platform

The backend should largely be a copy from Oblig 2. If something is changed, mention it here.

Leave in this file any comments that you want us to read.

## What I have changed
Some things were different in frontend assignment, than in backedn assignment, so it was some changes.

- Added profileImage and preferences to user schema and updated user.validator.js to accept them
- Added allowAnonymous and desiredOpponentElo to match schema
- Added "waiting" to the match status array
- Created a new function to join match (in service, controller, validator, routes) and changed to allow 1 player
- Added http tests as well
- Removed requireAdmin from getAllComments in routes
- Added more seed data to matches to have some waiting matches (to have enough data to make the slider work), and more ongoing matches
- Added multer middleware (middleware/uploads.js) for file uploads, shared between user and trophy routes (had it in trophy routes before, but realized i needed it for users as well)
- Updated PUT /users/:userId to accept profile image uploads via multipart/form-data. req.file path is stored as profileImage
- Changed game categories to 3/10/30 seconds instead of 5/10/15 because the frontend assignment requires it
- Changes login user from email to username in user.service and user.validator. To match the front-end assignment
- Added aboutMe field to user model and validator (validateUpdateUser) to support profile bio editing
- Changed match validator so anonymous users can join games
- Added anonymousCount to Match model and updated joinMatch to increment it for anonymous players instead of pushing to players[], and changed the "start match" condition to players.length + anonymousCount >= 2
- Added eloRating fields to User model for separate Elo ratings per time control, each defaulting to 1000. Updated recordMatch in match.service.js to look up the game category's timeController and update the correct Elo field dynamically
- Updated getUser in user.service.js to return recentGames (last 10 non-waiting matches, populated with players and game category), totalGames (total match count), and ratingChange (sum of eloDelta from finished matches in the last 7 days)
- Changed the userId query param validator in match.validator.js from isMongoId() to notEmpty(), since the frontend passes custom snowflake IDs not MongoDB ObjectIds
- Expanded comment seed (comment.seed.js) to cover all match states just to have something to show as example
- Fixed trophy seed (trophy.seed.js) filenames to use hyphens instead of underscores (e.g. spring-trophy.png)
- Added trophy award step in db.seed.js: after seeding, all trophies are awarded to dragonslayer (just for having something to show, as well, since no tournaments are implemented yet)