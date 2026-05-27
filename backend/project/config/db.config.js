// This DB connection structure is the same example that where shown in the lectures! 
// I have added my own comments to show that I understand it
import mongoose from "mongoose";

// This part reads connection details from environment variables to avoid hardcoding sensitive info
const { MONGODB_URI, NODE_ENV } = process.env;

// This function checks that all required env variables exist before attempting to connect to the database
// Then catches errors that occur after the initial connection is made (e.g. if MongoDB drops mid-session)
// When database is connected, appName helps identify the app in MongoDB logs
// and maxPoolSize allows up to 50 simultaneous connections, for better performance under load
// Finally, the throw at the bottom handles missing env variables.
export async function connectDB(){
    if(MONGODB_URI){
        mongoose.connection.on("error", err=>{
            console.error("Unhandled Mongoose/MongoDB connection error:", err);
        });
        console.log("Connecting to MongoDB now...", MONGODB_URI);
        return mongoose.connect(
            MONGODB_URI,
            {
                appName: "dice-poker-api-" + NODE_ENV,
                maxPoolSize: 50 
            }
        );
    }
    throw new Error("Missing MONGODB_URI environment variable");
}

// disconnectDB is used for graceful shutdown
export async function disconnectDB(){
    return mongoose.disconnect();
}