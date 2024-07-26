import mongoose from "mongoose";

export const connectDatabase = async () => {
  try {
    let databaseURI;

    if (process.env.NODE_ENV === "production") {
      databaseURI = process.env.MONGODB_PROD_DATABASE_URI || "";
    } else {
      databaseURI = process.env.MONGODB_LOCAL_DATABASE_URI || "";
    }

    if (!databaseURI) {
      throw new Error("Database URI is not defined.");
    }

    await mongoose.connect(databaseURI);
    console.log("Connected to the database:", databaseURI);
  } catch (error) {
    console.error("Database connection error:", error);
  }
};
