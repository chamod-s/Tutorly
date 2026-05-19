import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { sendBadRequest } from '../utils/apiResponse';

// ─── express-validator result checker ────────────────────────
//
//  Place after any express-validator chain to abort if invalid.
//  Usage:
//    router.post('/register',
//      body('email').isEmail(),
//      body('password').isLength({ min: 8 }),
//      validate,
//      AuthController.register,
//    )

export const validate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formatted = errors.array().map((err) => ({
      field: err.type === 'field' ? (err as { path: string }).path : 'unknown',
      message: err.msg as string,
    }));

    sendBadRequest(res, 'Validation failed', formatted);
    return;
  }

  next();
};
