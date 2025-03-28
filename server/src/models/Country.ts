import mongoose, { Document, Schema } from 'mongoose';

export interface ICurrency {
  name: string;
  symbol: string;
  code: string;
}

export interface ICountry extends Document {
  name: string;
  capital: string;
  continent: string;
  in_geoguessr: boolean;
  code?: string;
  domain?: string[];
  currency?: ICurrency[];
  population?: number;
  area?: number;
  phone_prefix?: string;
  driving_side?: 'left' | 'right';
  camera_generation?: Map<string, string>;
}

const currencySchema = new Schema<ICurrency>({
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  code: { type: String, required: true },
}, { _id: false });

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
    domain: {
      type: [String],
      required: false,
    },
    currency: {
      type: [currencySchema],
      required: false,
    },
    population: {
      type: Number,
      required: false,
    },
    area: {
      type: Number,
      required: false,
    },
    phone_prefix: {
      type: String,
      required: false,
    },
    driving_side: {
      type: String,
      enum: ['left', 'right'],
      required: false,
    },
    camera_generation: {
      type: Map,
      of: String,
      required: false,
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICountry>('Country', countrySchema);
