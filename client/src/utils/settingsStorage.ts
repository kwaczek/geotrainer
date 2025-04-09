import { QuizType } from '../types/quiz';

// Settings interface
export interface QuizSettings {
  timerEnabled: boolean;
  timerDuration: number;
  questionCount: number;
  writeMode?: boolean;
  continent?: string;
  in_geoguessr?: boolean;
  blurred?: boolean;
  blurIntensity?: number;
  types?: string[];
}

// The key used to store all settings in localStorage
const STORAGE_KEY = 'geotrainer_quiz_settings';

// Default settings for each quiz type
const DEFAULT_SETTINGS: Record<QuizType, QuizSettings> = {
  flags: {
    timerEnabled: true,
    timerDuration: 30,
    questionCount: 10,
    writeMode: false,
    continent: 'all',
    in_geoguessr: false,
    blurred: false,
    blurIntensity: 15,
    types: []
  },
  capitals: {
    timerEnabled: true,
    timerDuration: 30,
    questionCount: 10,
    writeMode: false,
    continent: 'all',
    in_geoguessr: false,
    blurred: false,
    blurIntensity: 15,
    types: []
  },
  bollards: {
    timerEnabled: true,
    timerDuration: 30,
    questionCount: 10,
    writeMode: false,
    continent: 'all',
    in_geoguessr: false,
    blurred: false,
    blurIntensity: 15,
    types: []
  },
  licenseplates: {
    timerEnabled: true,
    timerDuration: 30,
    questionCount: 10,
    writeMode: false,
    continent: 'all',
    in_geoguessr: false,
    blurred: false,
    blurIntensity: 15,
    types: []
  },
  roadsigns: {
    timerEnabled: true,
    timerDuration: 30,
    questionCount: 10,
    writeMode: false,
    continent: 'all',
    in_geoguessr: false,
    blurred: false,
    blurIntensity: 15,
    types: []
  },
  languages: {
    timerEnabled: true,
    timerDuration: 30,
    questionCount: 10,
    writeMode: false,
    continent: 'all',
    in_geoguessr: false,
    blurred: false,
    blurIntensity: 15,
    types: []
  },
  cars: {
    timerEnabled: true,
    timerDuration: 30,
    questionCount: 10,
    writeMode: false,
    continent: 'all',
    in_geoguessr: false,
    blurred: false,
    blurIntensity: 15,
    types: []
  }
};

/**
 * Get all quiz settings from localStorage
 */
export function getAllSettings(): Record<QuizType, QuizSettings> {
  try {
    console.log('Retrieving all settings from localStorage');
    const storedSettings = localStorage.getItem(STORAGE_KEY);
    
    if (storedSettings) {
      console.log('Found stored settings:', storedSettings);
      const parsedSettings = JSON.parse(storedSettings);
      
      // Ensure all quiz types have settings by merging with defaults
      const mergedSettings = {
        flags: { ...DEFAULT_SETTINGS.flags, ...parsedSettings.flags },
        capitals: { ...DEFAULT_SETTINGS.capitals, ...parsedSettings.capitals },
        bollards: { ...DEFAULT_SETTINGS.bollards, ...parsedSettings.bollards },
        licenseplates: { ...DEFAULT_SETTINGS.licenseplates, ...parsedSettings.licenseplates },
        roadsigns: { ...DEFAULT_SETTINGS.roadsigns, ...(parsedSettings.roadsigns || {}) },
        languages: { ...DEFAULT_SETTINGS.languages, ...(parsedSettings.languages || {}) },
        cars: { ...DEFAULT_SETTINGS.cars, ...(parsedSettings.cars || {}) }
      };
      
      console.log('Merged with defaults:', mergedSettings);
      return mergedSettings;
    } else {
      console.log('No settings found in localStorage, using defaults');
    }
  } catch (error) {
    console.error('Error reading quiz settings from localStorage:', error);
  }
  
  // Return default settings if there's an error or no stored settings
  return { ...DEFAULT_SETTINGS };
}

/**
 * Get settings for a specific quiz type
 */
export function getSettings(quizType: QuizType): QuizSettings {
  console.log(`Getting settings for ${quizType}`);
  const allSettings = getAllSettings();
  const settings = allSettings[quizType] || DEFAULT_SETTINGS[quizType];
  console.log(`Retrieved settings for ${quizType}:`, settings);
  return settings;
}

/**
 * Save settings for a specific quiz type
 */
export function saveSettings(quizType: QuizType, settings: QuizSettings): void {
  try {
    console.log(`Saving settings for ${quizType}:`, settings);
    
    // Get current settings
    const allSettings = getAllSettings();
    
    // Update settings for the specified quiz type
    allSettings[quizType] = {
      ...allSettings[quizType],
      ...settings
    };
    
    // Save to localStorage
    const settingsJSON = JSON.stringify(allSettings);
    localStorage.setItem(STORAGE_KEY, settingsJSON);
    console.log(`Settings saved to localStorage: ${settingsJSON.substring(0, 100)}...`);
  } catch (error) {
    console.error('Error saving quiz settings to localStorage:', error);
  }
}

/**
 * Reset settings for a specific quiz type to defaults
 */
export function resetSettings(quizType: QuizType): void {
  try {
    // Get current settings
    const allSettings = getAllSettings();
    
    // Reset the specified quiz type to defaults
    allSettings[quizType] = { ...DEFAULT_SETTINGS[quizType] };
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSettings));
  } catch (error) {
    console.error('Error resetting quiz settings in localStorage:', error);
  }
} 