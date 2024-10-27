import { Request, Response } from "express";
import Airline from "../models/airlines";

export const getAirlines = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    const query: { [key: string]: any } = {};
    if (search) {
      const searchRegex = new RegExp(search as string, "i");
      query["$or"] = [{ iata: searchRegex }];
    }

    const airlines = await Airline.find(query);

    airlines.filter((airline) => {
      if ((airline.iata?.length as any) > 1) {
        return airline;
      }
    });

    res.json(airlines);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
