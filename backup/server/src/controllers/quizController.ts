import { Request, Response } from 'express';
import Quiz from '../models/Quiz';
import User from '../models/User';
import Country from '../models/Country';

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Public
export const getQuizzes = async (req: Request, res: Response): Promise<void> => {
  try {
    const quizzes = await Quiz.find({}).select('title category difficulty requiredLevel');
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// @desc    Get all continents
// @route   GET /api/quizzes/continents
// @access  Public
export const getContinents = async (req: Request, res: Response): Promise<void> => {
  try {
    const continents = await Country.distinct('continent');
    res.json(continents);
  } catch (error) {
    console.error('Error fetching continents:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// @desc    Get quiz by ID
// @route   GET /api/quizzes/:id
// @access  Public
export const getQuizById = async (req: Request, res: Response): Promise<void> => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (quiz) {
      res.json(quiz);
    } else {
      res.status(404).json({ message: 'Quiz not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// @desc    Get random countries for capitals quiz
// @route   GET /api/quizzes/capitals
// @access  Public
export const getCapitalsQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get a random country for the correct answer
    const countries = await Country.aggregate([
      { $sample: { size: 1 } }
    ]);
    
    if (!countries || countries.length === 0) {
      res.status(404).json({ message: 'No countries found' });
      return;
    }
    
    const correctCountry = countries[0];
    
    // Get 3 random incorrect countries (different from the correct one)
    const incorrectCountries = await Country.aggregate([
      { $match: { _id: { $ne: correctCountry._id } } },
      { $sample: { size: 3 } }
    ]);
    
    // Format the response
    const quizQuestion = {
      question: `Which country has ${correctCountry.capital} as its capital?`,
      options: [
        {
          id: correctCountry._id.toString(),
          text: correctCountry.name,
          isCorrect: true
        },
        ...incorrectCountries.map(country => ({
          id: country._id.toString(),
          text: country.name,
          isCorrect: false
        }))
      ]
    };
    
    // Shuffle the options
    quizQuestion.options.sort(() => Math.random() - 0.5);
    
    res.json(quizQuestion);
  } catch (error) {
    console.error('Error generating capitals quiz:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// @desc    Get random countries for flags quiz
// @route   GET /api/quizzes/flags
// @access  Public
export const getFlagsQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get a random country with a valid code for the correct answer
    const countries = await Country.aggregate([
      { $match: { code: { $exists: true, $ne: null } } },
      { $sample: { size: 1 } }
    ]);
    
    if (!countries || countries.length === 0) {
      res.status(404).json({ message: 'No countries found with valid flag codes' });
      return;
    }
    
    const correctCountry = countries[0];
    
    // Get 3 random incorrect countries (different from the correct one)
    const incorrectCountries = await Country.aggregate([
      { 
        $match: { 
          _id: { $ne: correctCountry._id },
          code: { $exists: true, $ne: null }
        } 
      },
      { $sample: { size: 3 } }
    ]);
    
    // Format the response
    const quizQuestion = {
      question: `Which country does this flag belong to?`,
      imageUrl: `https://flagcdn.com/w320/${correctCountry.code.toLowerCase()}.png`,
      options: [
        {
          id: correctCountry._id.toString(),
          text: correctCountry.name,
          isCorrect: true
        },
        ...incorrectCountries.map(country => ({
          id: country._id.toString(),
          text: country.name,
          isCorrect: false
        }))
      ]
    };
    
    // Shuffle the options
    quizQuestion.options.sort(() => Math.random() - 0.5);
    
    res.json(quizQuestion);
  } catch (error) {
    console.error('Error generating flags quiz:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// @desc    Get random countries for flags quiz with filters
// @route   GET /api/quizzes/flags/filtered
// @access  Public
export const getFilteredFlagsQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const { continent, in_geoguessr } = req.query;
    
    // Build the filter query
    const filter: any = { code: { $exists: true, $ne: null } };
    
    if (continent && continent !== 'all') {
      filter.continent = continent;
    }
    
    if (in_geoguessr === 'true') {
      filter.in_geoguessr = true;
    }
    
    console.log('Applying filter:', filter);
    
    // Get a random country for the correct answer
    const countries = await Country.aggregate([
      { $match: filter },
      { $sample: { size: 1 } }
    ]);
    
    if (!countries || countries.length === 0) {
      res.status(404).json({ 
        message: 'No countries found with the specified filters',
        filters: { continent, in_geoguessr }
      });
      return;
    }
    
    const correctCountry = countries[0];
    
    // Build filter for incorrect options - copy all filters from the correct answer filter
    const incorrectFilter: any = {
      ...filter,  // This includes both continent and in_geoguessr filters if they were set
      _id: { $ne: correctCountry._id },  // Exclude the correct answer
    };
    
    console.log('Applying incorrect options filter:', incorrectFilter);
    
    // Get 3 random incorrect countries (different from the correct one)
    const incorrectCountries = await Country.aggregate([
      { $match: incorrectFilter },
      { $sample: { size: 3 } }
    ]);
    
    // If we don't have enough incorrect options with the filter, get more while maintaining the GeoGuessr filter
    if (incorrectCountries.length < 3) {
      console.log(`Only found ${incorrectCountries.length} incorrect countries with filter, getting more with relaxed filter`);
      
      const additionalCountries = await Country.aggregate([
        { 
          $match: { 
            $and: [
              { _id: { $ne: correctCountry._id } },
              { code: { $exists: true, $ne: null } },
              ...(incorrectCountries.length > 0 ? [{ _id: { $nin: incorrectCountries.map(c => c._id) } }] : []),
              ...(in_geoguessr === 'true' ? [{ in_geoguessr: true }] : [])
            ]
          } 
        },
        { $sample: { size: 3 - incorrectCountries.length } }
      ]);
      
      incorrectCountries.push(...additionalCountries);
    }
    
    // Format the response
    const quizQuestion = {
      question: `Which country does this flag belong to?`,
      imageUrl: `https://flagcdn.com/w320/${correctCountry.code.toLowerCase()}.png`,
      options: [
        {
          id: correctCountry._id.toString(),
          text: correctCountry.name,
          isCorrect: true
        },
        ...incorrectCountries.map(country => ({
          id: country._id.toString(),
          text: country.name,
          isCorrect: false
        }))
      ]
    };
    
    // Shuffle the options
    quizQuestion.options.sort(() => Math.random() - 0.5);
    
    res.json(quizQuestion);
  } catch (error) {
    console.error('Error generating filtered flags quiz:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// @desc    Get random countries for capitals quiz with filters
// @route   GET /api/quizzes/capitals/filtered
// @access  Public
export const getFilteredCapitalsQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const { continent, in_geoguessr } = req.query;
    
    console.log('Received filter params:', { continent, in_geoguessr });
    
    // Build the filter based on query parameters
    let filter: any = {};
    
    if (continent && continent !== 'all') {
      filter.continent = continent;
    }
    
    if (in_geoguessr === 'true') {
      filter.in_geoguessr = true;
    }
    
    console.log('Applying filters:', filter);
    
    // Check if there are enough countries with the given filter
    const countryCount = await Country.countDocuments(filter);
    console.log(`Found ${countryCount} countries matching the filter`);
    
    if (countryCount < 4) {
      console.log(`Not enough countries (${countryCount}) with the filter: ${JSON.stringify(filter)}`);
      
      // If we don't have enough countries with the filter, only keep the in_geoguessr filter if it's set
      // This ensures we still respect the GeoGuessr filter even when relaxing other constraints
      const originalFilter = { ...filter };
      filter = in_geoguessr === 'true' ? { in_geoguessr: true } : {};
      
      console.log(`Relaxing filters from ${JSON.stringify(originalFilter)} to ${JSON.stringify(filter)}`);
    }
    
    // Get a random country for the correct answer that matches the filter
    const countries = await Country.aggregate([
      { $match: filter },
      { $sample: { size: 1 } }
    ]);
    
    if (!countries || countries.length === 0) {
      res.status(404).json({ 
        message: 'No countries found matching the specified filters',
        filters: filter
      });
      return;
    }
    
    const correctCountry = countries[0];
    
    // Get 3 random incorrect countries (different from the correct one)
    // Use the same filter to keep options consistent
    const incorrectCountries = await Country.aggregate([
      { 
        $match: { 
          _id: { $ne: correctCountry._id },
          ...filter
        } 
      },
      { $sample: { size: 3 } }
    ]);
    
    // If we don't have enough incorrect countries with the filter, get some without the filter
    if (incorrectCountries.length < 3) {
      console.log(`Only found ${incorrectCountries.length} incorrect countries with filter, getting more without filter`);
      
      const additionalCountries = await Country.aggregate([
        { 
          $match: { 
            $and: [
              { _id: { $ne: correctCountry._id } },
              { _id: { $nin: incorrectCountries.map(c => c._id) } },
              ...(in_geoguessr === 'true' ? [{ in_geoguessr: true }] : [])
            ]
          } 
        },
        { $sample: { size: 3 - incorrectCountries.length } }
      ]);
      
      incorrectCountries.push(...additionalCountries);
    }
    
    // Format the response
    const quizQuestion = {
      question: `Which country has ${correctCountry.capital} as its capital?`,
      options: [
        {
          id: correctCountry._id.toString(),
          text: correctCountry.name,
          isCorrect: true
        },
        ...incorrectCountries.map(country => ({
          id: country._id.toString(),
          text: country.name,
          isCorrect: false
        }))
      ]
    };
    
    // Shuffle the options
    quizQuestion.options.sort(() => Math.random() - 0.5);
    
    res.json(quizQuestion);
  } catch (error) {
    console.error('Error generating filtered capitals quiz:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// @desc    Submit quiz answer
// @route   POST /api/quizzes/:id/submit
// @access  Private
export const submitQuizAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { questionIndex, answer } = req.body;
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      res.status(404).json({ message: 'Quiz not found' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Check if the answer is correct
    const isCorrect = quiz.questions[questionIndex].correctAnswer === answer;

    // Update user progress if answer is correct
    if (isCorrect) {
      const user = await User.findById(req.user._id);

      if (user) {
        // Add points
        user.progress.points += 10;

        // Type assertion to handle the _id
        const quizId = quiz._id as unknown as string;

        // Check if quiz is completed
        if (!user.progress.completedQuizzes.includes(quizId)) {
          user.progress.completedQuizzes.push(quizId);
        }

        // Level up if enough points
        if (user.progress.points >= user.progress.level * 100) {
          user.progress.level += 1;
        }

        await user.save();
      }
    }

    res.json({
      isCorrect,
      explanation: quiz.questions[questionIndex].explanation,
      correctAnswer: quiz.questions[questionIndex].correctAnswer,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
