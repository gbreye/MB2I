import dotenv from 'dotenv';
import { connect } from 'mongoose';
import connectDB from "./config/database"

dotenv.config({
    path: './.env'
});

const startServer = async () => {
    try {
        await connectDB()

        application.on("error", (error) => {
            console.log("ERROR", error);
            throw error;
        });

        application.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port: ${process.env.PORT}`)
        });
    } catch {
        console.log("MongoDb connection failed!!", err)
    }
}

startServer();