export interface LicensePlateData {
  _id?: string;
  imageUrl: string;
  description: string;
  googleMapsUrl: string;
  countries: string[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export const plates: LicensePlateData[] = [];