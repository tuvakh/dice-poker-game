import { Tournament } from "../../models/Tournament.js";
import { Trophy } from "../../models/Trophy.js";

export default async function seedTournaments(users, categories, trophies) {
    await Tournament.deleteMany({});

    const admin = users.find(user => user.role === 'admin');

    const tournaments = await Promise.all([
        new Tournament({
            title: "Spring Championship",
            description: "First tournament of the year",
            date: "2026-04-01T10:00:00.000Z",
            breaks: 10,
            numberOfRounds: 3,
            gameCategory: categories[0]._id,
            participants: [users[0]._id, users[1]._id, users[2]._id, users[3]._id],
            status: "finished",
            trophy: trophies[0]._id,
            createdBy: admin._id
        }).save(),

        new Tournament({
            title: "Summer Slam",
            description: "Hot summer tournament",
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            breaks: 15,
            numberOfRounds: 5,
            gameCategory: categories[6]._id,
            participants: [users[4]._id, users[5]._id, users[6]._id, users[7]._id],
            status: "upcoming",
            trophy: trophies[1]._id,
            createdBy: admin._id
        }).save(),

        new Tournament({
            title: "Demo Open — Play Now!",
            description: "A live demo tournament — join and it starts automatically once 2 players are in.",
            date: new Date(Date.now() - 10 * 1000),
            breaks: 1,
            numberOfRounds: 2,
            gameCategory: categories[6]._id,
            participants: [], 
            status: "upcoming",
            trophy: trophies[2]._id,
            createdBy: admin._id
        }).save()
    ]);

    await Trophy.findByIdAndUpdate(trophies[0]._id, { tournamentId: tournaments[0]._id });
    await Trophy.findByIdAndUpdate(trophies[1]._id, { tournamentId: tournaments[1]._id });
    await Trophy.findByIdAndUpdate(trophies[2]._id, { tournamentId: tournaments[2]._id });
    console.log("Updated trophies with tournament IDs");

    console.log("Inserted all tournaments");
    return tournaments;
}