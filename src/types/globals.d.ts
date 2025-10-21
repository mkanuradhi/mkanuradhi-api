import Role from "../enums/role";
import AppUser from "../interfaces/i-app-user";

export {}

declare global {
  namespace Express {
    interface Request {
      appUser?: AppUser;
    }
  }
}