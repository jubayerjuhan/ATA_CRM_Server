import { Multer } from "multer";

declare global {
  namespace Express {
    interface Request {
      files?: Multer.File[]; // or `any[]` if you're unsure of the file structure
    }
  }
}
