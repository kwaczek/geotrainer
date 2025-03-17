import { Request, Response, NextFunction } from 'express';

export const requireApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  
  next();
}; 