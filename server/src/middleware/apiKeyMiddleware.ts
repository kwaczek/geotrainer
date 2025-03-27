import { Request, Response, NextFunction } from 'express';

// Parse admin credentials from environment variables
// Format for env variables: ADMIN_PASSWORDS=pass1,pass2,pass3
const parseAdminPasswords = (): string[] => {
  // Try the array format first
  const passwords = (process.env.ADMIN_PASSWORDS || '').split(',').filter(p => p.trim());
  
  // If no passwords in array format, use the single password format
  if (passwords.length === 0 && process.env.ADMIN_API_KEY) {
    return [process.env.ADMIN_API_KEY];
  }
  
  return passwords;
};

const ADMIN_PASSWORDS = parseAdminPasswords();

export const requireApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'];
  
  // Check if API key is present and matches any of the admin passwords
  if (!apiKey || !ADMIN_PASSWORDS.includes(apiKey as string)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  
  next();
}; 