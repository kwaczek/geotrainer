# GeoTrainer

GeoTrainer is an interactive quiz platform designed to help [GeoGuessr](https://www.geoguessr.com/) players improve their geographic knowledge. Test yourself on capital cities, country flags, bollards, license plates, and more!

🌐 **Live Demo:** [https://geoprep.fun/](https://geoprep.fun/)

📱 **Reddit Discussion:** [Join the conversation](https://www.reddit.com/r/geoguessr/comments/1jcm67f/yet_another_bollard_and_more_quiz_test_it_if_you/)

## Features

### Current Features

- **Quiz Types:**

  - Capital Cities Quiz
  - Country Flags Quiz
  - Bollards Quiz
  - License Plates Quiz (in progress)

- **Customization Options:**

  - Filter by continent
  - GeoGuessr-only mode
  - Write mode for non-capitals quizzes
  - Adjustable timer settings
  - Customizable question count

- **Results & Analytics:**
  - Detailed quiz results
  - Statistics on accuracy and time
  - Shareable results via unique quiz ID

### Planned Features

- More quiz types (road signs, cars, potatoes, etc.)
- Regional content (US license plates, phone prefixes)
- User accounts with progress tracking
- Adaptive quizzes based on performance

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB
- **Deployment:** GitHub Actions, EC2

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/geotrainer.git
   cd geotrainer
   ```

2. **Install dependencies**

   ```bash
   # Install root dependencies
   npm install

   # Install client and server dependencies
   npm run install:all
   ```

3. **Configure environment variables**

   Create `.env` files in both the client and server directories:

   **server/.env**

   ```
   PORT=5001
   MONGO_URI=mongodb://localhost:27017/geotrainer
   JWT_SECRET=your_secret_key
   NODE_ENV=development
   ```

   **client/.env**

   ```
   DEBUG=true
   ```

   **Admin Environment Variables**

   For admin functionality, add these variables to your client/.env:

   ```
   REACT_APP_ADMIN_USERNAME=your_admin_username
   REACT_APP_ADMIN_PASSWORD=your_admin_password
   REACT_APP_ADMIN_API_KEY=your_api_key
   ```

   The API key should match the ADMIN_API_KEY in your server/.env:

   ```
   ADMIN_API_KEY=your_api_key
   ```

   > Note: For production deployments via GitHub Actions, add these variables as GitHub Secrets with the same names.

4. **Seed the database**

   ```bash
   cd server
   npm run seed:all
   ```

5. **Start the development servers**

   ```bash
   # From the root directory
   npm run dev
   ```

   This will start both the client (on port 3000) and server (on port 5001) concurrently.

6. **Access the application**

   Open your browser and navigate to `http://localhost:3000`

## Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

Please make sure your code follows the existing style and includes appropriate tests.

## Data Contribution

If you want to help populate the database with more quiz content (especially bollards, license plates, etc.), please reach out through the [Reddit discussion](https://www.reddit.com/r/geoguessr/comments/1jcm67f/yet_another_bollard_and_more_quiz_test_it_if_you/).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- The GeoGuessr community for inspiration and feedback
- All contributors who help improve this project

## CODEOWNERS Test
