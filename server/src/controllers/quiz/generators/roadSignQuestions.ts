import mongoose from 'mongoose';
import RoadSign from '../../../models/RoadSign';
import Country from '../../../models/Country';
import { QuizFilters, QuizQuestion } from '../types';

/**
 * Generate a random road sign question
 */
export async function getRandomRoadSignQuestion(filters?: QuizFilters, previousEntityIds: string[] = []): Promise<QuizQuestion> {
  // Build the aggregation pipeline based on filters
  const pipeline: any[] = [];
  
  // Add continent filter if specified
  if (filters?.continent && filters.continent !== 'all') {
    pipeline.push({
      $lookup: {
        from: 'countries',
        localField: 'countries',
        foreignField: '_id',
        as: 'countryDetails'
      }
    });
    pipeline.push({
      $match: {
        'countryDetails.continent': filters.continent
      }
    });
  }
  
  // Add GeoGuessr filter if specified
  if (filters?.in_geoguessr) {
    if (!pipeline.some(stage => stage.$lookup?.as === 'countryDetails')) {
      pipeline.push({
        $lookup: {
          from: 'countries',
          localField: 'countries',
          foreignField: '_id',
          as: 'countryDetails'
        }
      });
    }
    pipeline.push({
      $match: {
        'countryDetails.in_geoguessr': true
      }
    });
  }
  
  // Filter out road signs that were used in previous questions
  if (previousEntityIds.length > 0) {
    console.log(`Attempting to exclude ${previousEntityIds.length} previous road sign entities`);
    pipeline.push({
      $match: {
        _id: {
          $nin: previousEntityIds.map(id => {
            try {
              return new mongoose.Types.ObjectId(id);
            } catch (e) {
              console.error(`Invalid ID format for exclusion: ${id}`);
              return id; // Return the original id which won't match any MongoDB ObjectId
            }
          })
        }
      }
    });
  }
  
  // Add a sample stage to get a random road sign
  pipeline.push({ $sample: { size: 1 } });
  
  // Execute the aggregation pipeline
  try {
    let validRoadSigns;
    
    try {
      validRoadSigns = await RoadSign.aggregate(pipeline);
    } catch (error) {
      console.error('Error in road sign aggregation pipeline:', error);
      
      // Fallback: just get a random road sign without filters
      validRoadSigns = await RoadSign.aggregate([{ $sample: { size: 1 } }]);
    }
    
    if (!validRoadSigns || validRoadSigns.length === 0) {
      console.error('No road signs found with the specified filters');
      
      // Fallback to getting any road sign
      console.log('Falling back to getting any road sign');
      validRoadSigns = await RoadSign.aggregate([{ $sample: { size: 1 } }]);
      
      if (!validRoadSigns || validRoadSigns.length === 0) {
        throw new Error('No road signs found in the database');
      }
    }
    
    const selectedRoadSign = validRoadSigns[0];
    
    // Lookup the country for this road sign
    await RoadSign.populate(selectedRoadSign, { path: 'countries' });
    const countryId = selectedRoadSign.countries[0]?._id;
    
    if (!countryId) {
      throw new Error('Road sign has no associated country');
    }
    
    // Get 3 more random countries for options
    const otherCountries = await Country.aggregate([
      { 
        $match: { 
          _id: { $ne: countryId },
          // If GeoGuessr filter is active, only include GeoGuessr countries
          ...(filters?.in_geoguessr ? { in_geoguessr: true } : {})
        } 
      },
      { $sample: { size: 3 } }
    ]);
    
    // Build the question structure
    const correctCountry = selectedRoadSign.countries[0];
    
    // Create options array with the correct answer and 3 incorrect ones
    const options = [
      {
        id: correctCountry._id.toString(),
        text: correctCountry.name,
        isCorrect: true
      },
      ...otherCountries.map(country => ({
        id: country._id.toString(),
        text: country.name,
        isCorrect: false
      }))
    ];
    
    // Shuffle the options
    const shuffledOptions = options.sort(() => Math.random() - 0.5);
    
    // Return the question
    return {
      id: selectedRoadSign._id.toString(),
      question: 'Which country does this road sign belong to?',
      imageUrl: selectedRoadSign.imageUrl,
      options: shuffledOptions,
      metadata: {
        description: selectedRoadSign.description,
        googleMapsUrl: selectedRoadSign.googleMapsUrl,
        allCorrectCountryNames: [correctCountry.name]
      }
    };
  } catch (error) {
    console.error('Error generating road sign question:', error);
    throw error;
  }
} 