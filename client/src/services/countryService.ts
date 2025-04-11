import axios from 'axios';

export interface CountryInfo {
  id?: string;
  name: string;
  capital?: string;
  continent?: string;
  flagUrl?: string;
  code?: string;
  in_geoguessr?: boolean;
  population?: number;
  area?: number;
  phone_prefix?: string;
  driving_side?: 'left' | 'right';
  domain?: string[];
  currency?: { name: string; symbol: string; code: string }[];
  camera_generation?: Record<string, string>;
  bollards?: Bollard[];
  signs?: RoadSign[];
  plates?: LicensePlate[];
  languages?: Language[];
  googleCars?: GoogleCar[];
  poles?: Pole[];
}

export interface Bollard {
  _id: string;
  imageUrl: string;
  description: string;
  googleMapsUrl: string;
  countries: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LicensePlate {
  _id: string;
  imageUrl: string;
  description: string;
  countries: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RoadSign {
  _id: string;
  imageUrl: string;
  description: string;
  googleMapsUrl: string;
  countries: (string | { _id: string; name: string; code?: string; flagUrl?: string })[];
  createdAt: string;
  updatedAt: string;
  types: string[];
}

export interface Language {
  _id: string;
  imageUrl: string;
  description: string;
  countries: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GoogleCar {
  _id: string;
  imageUrl: string;
  description: string;
  googleMapsUrl?: string;
  generation?: string;
  year?: string;
  countries: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Pole {
  _id: string;
  imageUrl: string;
  description: string;
  googleMapsUrl: string;
  countries: string[];
  createdAt: string;
  updatedAt: string;
}

export const fetchCountryDetails = async (countryName: string, initialFlagUrl?: string): Promise<CountryInfo> => {
  // Start with basic info
  const initialCountryData: CountryInfo = {
    name: countryName,
    flagUrl: initialFlagUrl
  };
  
  try {
    const encodedName = encodeURIComponent(countryName);
    const response = await axios.get(`/api/countries/name/${encodedName}`);
    
    if (response.data && response.data.success) {
      const { country } = response.data;
      return {
        id: country.id,
        name: country.name,
        capital: country.capital,
        continent: country.continent,
        code: country.code,
        flagUrl: country.flagUrl || initialFlagUrl,
        in_geoguessr: country.in_geoguessr
      };
    }
  } catch (error) {
    console.log('Could not fetch additional country details, using basic info');
  }
  
  return initialCountryData;
};

export const fetchBollardsByCountry = async (countryId: string): Promise<Bollard[]> => {
  try {
    const response = await axios.get(`/api/bollards/country/${countryId}`);
    
    if (response.data && response.data.success) {
      return response.data.bollards;
    }
    return [];
  } catch (error) {
    console.error('Error fetching bollards for country:', error);
    return [];
  }
};

export const fetchLicensePlatesByCountry = async (countryId: string): Promise<LicensePlate[]> => {
  try {
    const response = await axios.get(`/api/licenseplates/country/${countryId}`);
    
    if (response.data && response.data.success) {
      return response.data.licensePlates;
    }
    return [];
  } catch (error) {
    console.error('Error fetching license plates for country:', error);
    return [];
  }
};

export const fetchRoadSignsByCountry = async (countryId: string): Promise<RoadSign[]> => {
  try {
    const response = await axios.get(`/api/roadsigns/country/${countryId}`);
    
    if (response.data && response.data.success) {
      return response.data.roadSigns;
    }
    return [];
  } catch (error) {
    console.error('Error fetching road signs for country:', error);
    return [];
  }
};

export const fetchLanguagesByCountry = async (countryId: string): Promise<Language[]> => {
  try {
    const response = await axios.get(`/api/languages/country/${countryId}`);
    
    if (response.data && response.data.success) {
      return response.data.languages;
    }
    return [];
  } catch (error) {
    console.error('Error fetching languages for country:', error);
    return [];
  }
};

export const fetchGoogleCarsByCountry = async (countryId: string): Promise<GoogleCar[]> => {
  try {
    const response = await axios.get(`/api/google-cars/country/${countryId}`);
    
    if (response.data && response.data.success) {
      return response.data.googleCars;
    }
    return [];
  } catch (error) {
    console.error('Error fetching Google cars for country:', error);
    return [];
  }
};

export const fetchPolesByCountry = async (countryId: string): Promise<Pole[]> => {
  try {
    const response = await axios.get(`/api/poles/country/${countryId}`);
    
    if (response.data && response.data.success) {
      return response.data.poles;
    }
    return [];
  } catch (error) {
    console.error('Error fetching poles for country:', error);
    return [];
  }
};
