import mongoose, { Schema, Document } from "mongoose";

interface IAirport extends Document {
  code: string;
  lat?: string;
  lon?: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  woeid?: string;
  tz?: string;
  phone?: string;
  type?: string;
  email?: string;
  url?: string;
  runway_length?: number;
  elev?: number;
  icao?: string;
  direct_flights?: string;
  carriers?: string;
}

const airportSchema: Schema<IAirport> = new Schema({
  code: { type: String, required: true },
  lat: String,
  lon: String,
  name: { type: String, required: true },
  city: String,
  state: String,
  country: String,
  woeid: String,
  tz: String,
  phone: String,
  type: String,
  email: String,
  url: String,
  runway_length: Number,
  elev: Number,
  icao: String,
  direct_flights: String,
  carriers: String,
});

const Airport = mongoose.model<IAirport>("Airport", airportSchema);

export default Airport;
