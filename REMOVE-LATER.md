

**The new features** include:

- **Tournament list page** (reachable from the main menu and/or from the button/link under the tournament overview component above), which should provide more detail than the tournament overview component, including tournament rules, status (upcoming, ongoing, finished), author, trophy description and image. The list should include pagination (a load-more button). The page should show separately upcoming/ongoing tournaments and past tournaments (same info, but separate components).
- **Individual tournament page** should provide even more detail than the tournament list page, including the full description (not just a title), full-size trophy image, list of joined (and awaiting the tournament start) players, current standings (for ongoing tournaments), tournament comments, and a button to join/leave the tournament (if available to the user). Tournament rules include a game variant, if it's open to specific Elo ranges, and size of buy-in (the number of points the player need to have to enter). *Platform admins* should see a button to delete a tournament, a button to cancel a tournament (users can still see it, but can't join), and a button/link to the page to edit the tournament. Clicking the edit button should redirect to the admin page for tournament creation (see below) with fields pre-filled with current values. Tournament-related logic includes:
  - Users can only join a tournament before it starts.
  - Users can leave a tournament at any point.
  - Players (the users that have joined the tournament) are automatically re-directed from the tournament page to a game page and back (upon game completion). Other users are instead shown the list of on-going games in the tournament. They click on any game and view it.
  - The tournament page shows a countdown till the next round of games starts.
  - Only one type of tournaments has to be implemented[^1], random-pairing round-based tournaments: a tournament has a fixed number of rounds (the rounds here are a different concept from the in-game rounds[^2]) and players are assigned into games randomly. The process is repeated for each round. The ranking and tournament winner are determined based on the number of points obtained in it.
  - Players may be given some extra points (see the point on points below) for winning a tournament.
- **Sorting:** the lists of tournaments (tournament list page) should be sortable (by date, title, and # of players) and searchable (by title, simple string partial match after at least 3 characters entered).


- **Playing the game** functionality:
  - If a player runs out of time (or abandons the game), the dice are still rolled for them, but they can't hold any or re-roll, and always match the amount in the pot.  
  
  - If the user enabled sounds (using the settings button in the header), sounds are played for round starts and ends, rolls, holds, and game end.



- Implement actual **authentication and authorization**, using refresh and access tokens and relevant technologies (cookies, JWT, hashing and salting). New users have to have their email verified before they can play games: send an email with a link with a verification code to the user's email. The user clicks the link and is shown a message (can be a dedicated page in your frontend), either that verification passed and they can login now or that the code was not okay (either invalid or expired), also offering to re-send the code. The code expires after 15 minutes.

- Show **platform activity** on the homepage: the number of active players and played games in the last week, and number of available games right now.




- Implement four **admin pages**: 
  - The dashboard should be accessible from an extra top-menu item shown only to admins. It should display platform activity: # of new profiles in the last week, security incidents, and the info shown to the regular users on the homepage as platform activity (see above). The dashboard should also display the links to the other three admin pages. The two types of security incidents to display are:
    - Somebody hitting API limits, e.g., more than 100 requests per minute. Record and display their IPs and user agents and the time of the incidents.
    - Someone's IP changing[^3]: when the user requests an access token (JWT), you record their IP in the token and compare that IP against the IP of incoming requests with the token. If there is a mismatch, you record the incident and respond with 401, triggering the client to re-obtain a new access token.
  - *Tournament creation* Creating one redirects to that individual tournament page.
  - All admin pages should show no footer and no other controls in the header besides the logo (as the link to homepage) and links to the admin pages themselves.


[^1]: You are welcome to implement other types of tournaments.
[^2]: You can re-name in-game rounds into something else, e.g., steps, cycles, or phases, if you wish to differentiate them further from the tournament rounds.
[^3]: You would not do such IP comparisons in a real project (you would instead look for suspicious signals for refresh token, e.g., you would infer a country from the IP and estimate if the travel was possible in the time since the last refresh token). This is simply an exercise in logging security incidents.

### Technical Requirements

The project has to be implemented using React and Web Components on the frontend and Express.js with MongoDB/Mongoose on the backend. The solution has to be deployable locally and include a seeding script with enough DB inputs to showcase the project. The solution has to be robust and secure enough to resist common forms of platform abuse.
