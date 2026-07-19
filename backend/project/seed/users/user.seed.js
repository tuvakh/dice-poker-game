import { User } from "../../models/User.js";
import usersRawData from "./users.json" with { type: "json"};

export default async function seedUsers() {
    await User.deleteMany({});
    
    const userDocs = usersRawData.map(user => new User(user));
    const users = await Promise.all(userDocs.map(user => user.save()));
    
    console.log("Inserted all users");
    
    return users;
}

