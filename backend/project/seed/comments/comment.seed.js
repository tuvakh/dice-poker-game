import { Comment } from "../../models/Comment.js";

export default async function seedComments(users, tournaments, matches) {
    await Comment.deleteMany({});

    const ago = (days, hours = 0, minutes = 0) =>
        new Date(Date.now() - (days * 86400 + hours * 3600 + minutes * 60) * 1000);

    await Promise.all([
        new Comment({ targetId: matches[0]._id, targetType: "match", comment: "What a great game, well played!", userId: users[0]._id, createdAt: ago(14, 20, 5) }).save(),
        new Comment({ targetId: matches[0]._id, targetType: "match", comment: "That last roll was unbelievable!", userId: users[1]._id, createdAt: ago(14, 20, 12) }).save(),
        new Comment({ targetId: matches[0]._id, targetType: "match", comment: "Good game, rematch soon?", userId: users[2]._id, createdAt: ago(14, 20, 31) }).save(),
        new Comment({ targetId: matches[1]._id, targetType: "match", comment: "That final round was intense!", userId: users[1]._id, createdAt: ago(13, 15, 3) }).save(),
        new Comment({ targetId: matches[1]._id, targetType: "match", comment: "I didn't see that coming at all.", userId: users[3]._id, createdAt: ago(13, 15, 47) }).save(),
        new Comment({ targetId: matches[2]._id, targetType: "match", comment: "Classic match, loved watching this one.", userId: users[0]._id, createdAt: ago(12, 10, 22) }).save(),
        new Comment({ targetId: matches[2]._id, targetType: "match", comment: "The straights rule really changes the strategy.", userId: users[2]._id, createdAt: ago(12, 10, 58) }).save(),
        new Comment({ targetId: matches[3]._id, targetType: "match", comment: "So close! One die away from winning.", userId: users[4]._id, createdAt: ago(11, 18, 7) }).save(),
        new Comment({ targetId: matches[3]._id, targetType: "match", comment: "Great pressure under the 3-second timer.", userId: users[1]._id, createdAt: ago(11, 18, 34) }).save(),
        new Comment({ targetId: matches[4]._id, targetType: "match", comment: "Best of 7 really tests your consistency.", userId: users[3]._id, createdAt: ago(10, 9, 14) }).save(),
        new Comment({ targetId: matches[5]._id, targetType: "match", comment: "Dominant performance!", userId: users[2]._id, createdAt: ago(9, 21, 2) }).save(),
        new Comment({ targetId: matches[6]._id, targetType: "match", comment: "Didn't expect that outcome.", userId: users[5]._id, createdAt: ago(8, 14, 49) }).save(),
        new Comment({ targetId: matches[7]._id, targetType: "match", comment: "What a comeback in the last round!", userId: users[6]._id, createdAt: ago(7, 17, 19) }).save(),
        new Comment({ targetId: matches[8]._id, targetType: "match", comment: "Tight game all the way through.", userId: users[7]._id, createdAt: ago(6, 11, 38) }).save(),
        new Comment({ targetId: matches[9]._id, targetType: "match", comment: "3-0 sweep, impressive stuff.", userId: users[4]._id, createdAt: ago(5, 8, 55) }).save(),

        new Comment({ targetId: matches[10]._id, targetType: "match", comment: "This one is heating up!", userId: users[0]._id, createdAt: ago(2, 16, 4) }).save(),
        new Comment({ targetId: matches[10]._id, targetType: "match", comment: "Anyone else watching this live?", userId: users[2]._id, createdAt: ago(2, 16, 21) }).save(),
        new Comment({ targetId: matches[11]._id, targetType: "match", comment: "Go dragonslayer!", userId: users[3]._id, createdAt: ago(1, 19, 33) }).save(),
        new Comment({ targetId: matches[12]._id, targetType: "match", comment: "Exciting match so far.", userId: users[5]._id, createdAt: ago(1, 12, 8) }).save(),
        new Comment({ targetId: matches[13]._id, targetType: "match", comment: "The 30-second timer makes this so tense.", userId: users[1]._id, createdAt: ago(0, 9, 45) }).save(),

        new Comment({ targetId: matches[16]._id, targetType: "match", comment: "Join this one, it's a good variant!", userId: users[0]._id, createdAt: ago(0, 3, 17) }).save(),
        new Comment({ targetId: matches[17]._id, targetType: "match", comment: "Waiting for a worthy opponent!", userId: users[2]._id, createdAt: ago(0, 1, 52) }).save(),

        new Comment({ targetId: tournaments[0]._id, targetType: "tournament", comment: "Looking forward to this tournament!", userId: users[2]._id, createdAt: ago(4, 13, 6) }).save(),
        new Comment({ targetId: tournaments[0]._id, targetType: "tournament", comment: "Who's the favourite to win this one?", userId: users[0]._id, createdAt: ago(4, 13, 29) }).save(),
        new Comment({ targetId: tournaments[0]._id, targetType: "tournament", comment: "My money is on the top seed!", userId: users[4]._id, createdAt: ago(3, 20, 44) }).save(),
        new Comment({ targetId: tournaments[1]._id, targetType: "tournament", comment: "Good luck everyone!", userId: users[3]._id, createdAt: ago(2, 10, 11) }).save(),
        new Comment({ targetId: tournaments[1]._id, targetType: "tournament", comment: "Already signed up, can't wait!", userId: users[1]._id, createdAt: ago(1, 7, 38) }).save(),
    ]);

    console.log("Inserted all comments");
}