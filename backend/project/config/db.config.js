import mongoose from "mongoose";

const { MONGODB_URI, NODE_ENV } = process.env;

export async function connectDB(){
    if(MONGODB_URI){
        mongoose.connection.on("error", err=>{
            console.error("Unhandled Mongoose/MongoDB connection error:", err);
        });
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

export async function disconnectDB(){
    return mongoose.disconnect();
}