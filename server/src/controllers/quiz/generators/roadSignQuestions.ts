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
    
    // Handle case where a road sign belongs to multiple countries
    if (!selectedRoadSign.countries || selectedRoadSign.countries.length === 0) {
      throw new Error('Road sign has no associated countries');
    }
    
    // If there are multiple correct countries, randomly select just one for the question
    const randomIndex = Math.floor(Math.random() * selectedRoadSign.countries.length);
    const correctCountry = selectedRoadSign.countries[randomIndex];
    const countryId = correctCountry._id;
    
    // Track all correct countries for write mode
    const allCorrectCountries = selectedRoadSign.countries.map((country: any) => ({
      id: country._id.toString(),
      text: country.name,
      isCorrect: true
    }));
    const allCorrectCountryNames = selectedRoadSign.countries.map((country: any) => country.name);
    
    // Get 3 more random countries for options
    let otherCountries = await Country.aggregate([
      { 
        $match: { 
          _id: { $ne: countryId },
          // If GeoGuessr filter is active, only include GeoGuessr countries
          ...(filters?.in_geoguessr ? { in_geoguessr: true } : {}),
          // If continent filter is active, only include countries from the same continent
          ...(filters?.continent && filters.continent !== 'all' ? { continent: filters.continent } : {})
        } 
      },
      { $sample: { size: 3 } }
    ]);
    
    // If we don't have enough countries with filters, fallback to countries without continent filter
    if (otherCountries.length < 3 && filters?.continent && filters.continent !== 'all') {
      console.log(`Only found ${otherCountries.length} countries with continent filter, falling back to any country`);
      
      // Get additional countries without continent filter but still respecting GeoGuessr filter if set
      const additionalCountries = await Country.aggregate([
        { 
          $match: { 
            _id: { 
              $ne: countryId,
              $nin: otherCountries.map(c => c._id) // Exclude already selected countries
            },
            // Still respect GeoGuessr filter if set
            ...(filters?.in_geoguessr ? { in_geoguessr: true } : {})
          } 
        },
        { $sample: { size: 3 - otherCountries.length } }
      ]);
      
      otherCountries = [...otherCountries, ...additionalCountries];
    }
    
    // If we still don't have enough countries, as a last resort, get any countries
    if (otherCountries.length < 3) {
      console.log(`Only found ${otherCountries.length} countries with filters, falling back to any country`);
      
      const lastResortCountries = await Country.aggregate([
        { 
          $match: { 
            _id: { 
              $ne: countryId,
              $nin: otherCountries.map(c => c._id) // Exclude already selected countries
            }
          } 
        },
        { $sample: { size: 3 - otherCountries.length } }
      ]);
      
      otherCountries = [...otherCountries, ...lastResortCountries];
    }
    
    // Build the question structure
    
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
    
    // Get the road sign ID for entity tracking
    const roadSignId = selectedRoadSign._id.toString();
    console.log(`Using road sign with ID: ${roadSignId}`);
    
    // Return the question
    return {
      id: new mongoose.Types.ObjectId().toString(),
      question: 'Which country does this road sign belong to?',
      imageUrl: selectedRoadSign.imageUrl,
      options: shuffledOptions,
      metadata: {
        description: selectedRoadSign.description,
        googleMapsUrl: selectedRoadSign.googleMapsUrl,
        allCorrectCountryNames: allCorrectCountryNames,
        roadSignId: roadSignId // Include the actual road sign ID in metadata for tracking
      }
    };
  } catch (error) {
    console.error('Error generating road sign question:', error);
    throw error;
  }
} 