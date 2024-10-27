import { Request, Response } from "express";
import Airport from "../models/airport";

export const getAirports = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    // Explicitly allow any key to be added to the query object
    const query: { [key: string]: any } = {};

    if (search) {
      query["code"] = { $regex: search, $options: "i" };
    }

    const airports = await Airport.find(query);
    res.json(airports);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
