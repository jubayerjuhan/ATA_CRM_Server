import { Request, Response } from "express";
import Airport from "../models/airport";

export const getAirports = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    // Explicitly allow any key to be added to the query object
    const query: { [key: string]: any } = {};

    console.log(search);

    if (search) {
      const searchRegex = new RegExp(search as string, "i");
      query["$or"] = [
        { name: searchRegex },
        { code: searchRegex },
        { city: searchRegex },
        { state: searchRegex },
      ];
    }

    const airports = await Airport.find(query);
    res.json(airports);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
