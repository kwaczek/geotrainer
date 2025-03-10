import mongoose, { Document, Schema } from 'mongoose';

export interface ICountry extends Document {
  name: string;
  capital: string;
  continent: string;
  in_geoguessr: boolean;
  code: string;
}

const countrySchema = new Schema<ICountry>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    capital: {
      type: String,
      required: true,
    },
    continent: {
      type: String,
      required: true,
      enum: ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Antarctica'],
    },
    in_geoguessr: {
      type: Boolean,
      default: false,
    },
    code: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICountry>('Country', countrySchema);
