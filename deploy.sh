   #!/bin/bash
   
   # Install dependencies
   npm install
   
   # Build the application (if needed)
   npm run build
   
   # Start MongoDB using Docker Compose if not already running
   docker-compose up -d
   
   # Restart the application using PM2
   pm2 restart all || pm2 start npm --name "app" -- start