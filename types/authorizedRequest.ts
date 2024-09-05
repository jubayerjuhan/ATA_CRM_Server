import { Request } from "express";
import { IUser } from "../models/user";

export interface AuthorizedRequest extends Request {
  user?: IUser;
}
