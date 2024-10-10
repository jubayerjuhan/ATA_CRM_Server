import mongoose, { Schema, Document } from "mongoose";

interface IAirline extends Document {
  id: string;
  name: string;
  alias?: string;
  iata?: string;
  icao?: string;
  callsign?: string;
  country?: string;
  active?: string;
}

const airlineSchema: Schema<IAirline> = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  alias: String,
  iata: String,
  icao: String,
  callsign: String,
  country: String,
  active: String,
});

const Airline = mongoose.model<IAirline>("Airline", airlineSchema);

export default Airline;
