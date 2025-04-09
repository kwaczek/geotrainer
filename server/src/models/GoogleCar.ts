import mongoose, { Schema, Document } from 'mongoose';

export interface IGoogleCar extends Document {
    imageUrl: string;
    description: string;
    googleMapsUrl: string;
    countries: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const GoogleCarSchema: Schema = new Schema({
    imageUrl: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    googleMapsUrl: {
        type: String,
        required: true,
    },
    countries: [{
        type: Schema.Types.ObjectId,
        ref: 'Country', // Assuming Google Cars also relate to Countries
        required: true,
    }],
}, {
    timestamps: true,
});

export default mongoose.model<IGoogleCar>('GoogleCar', GoogleCarSchema); 