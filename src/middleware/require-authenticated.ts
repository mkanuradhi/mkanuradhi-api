import { Request, Response, NextFunction } from 'express';
import AppError from '../errors/app-error';
import { clerkClient, getAuth } from '@clerk/express';


const requireAuthenticated = (requiredRoles: string[] = []) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { userId, sessionId, sessionClaims } = getAuth(req);

    if (!userId || !sessionId) {
      return next(new AppError('Unauthorized', 401));
    }

    const publicMetadata = sessionClaims?.metadata as { roles?: string[] };
    const roles = publicMetadata?.roles || [];

    if (requiredRoles.length > 0) {
      if (!roles || !requiredRoles.some(role => roles.includes(role))) {
        return next(new AppError('Forbidden: Insufficient role', 403));
      }
    }

    const user = await clerkClient.users.getUser(userId);
    const email = user.emailAddresses?.find(e => e.id === user.primaryEmailAddressId)?.emailAddress ??
      user.emailAddresses?.[0]?.emailAddress;

    // Attach user profile info to request object
    (req as any).appUser = {
        userId,
        name: user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
        email,
        picture: user.imageUrl,
      };

    // Attach user info to request object
    (req as any).auth = { userId, sessionId, roles };

    return next();
  };
};

export default requireAuthenticated;