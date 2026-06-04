import { Trophy } from "../../models/Trophy.js";

export default async function seedTrophies() {
    await Trophy.deleteMany({});

    const trophies = await Promise.all([
        new Trophy({ title: "Spring Championship Trophy", image: "spring-trophy.png" }).save(),
        new Trophy({ title: "Summer Slam Trophy", image: "summer-trophy.png" }).save(),
        new Trophy({ title: "Winter Classic Trophy", image: "winter-trophy.png" }).save(),
        new Trophy({ title: "Valentine's Cup", image: "valentines-trophy.png" }).save(),
        new Trophy({ title: "Autumn Open Trophy", image: "autumn-trophy.png" }).save(),
    ]);

    console.log("Inserted all trophies");
    return trophies;
}