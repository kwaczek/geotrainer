import mongoose, { Schema, Document } from 'mongoose';

export interface IRoadSign extends Document {
    imageUrl: string;
    description: string;
    googleMapsUrl: string;
    countries: mongoose.Types.ObjectId[];
    isPedestrian: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const RoadSignSchema: Schema = new Schema({
    imageUrl: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
        default: '',
    },
    googleMapsUrl: {
        type: String,
        required: false,
        default: '',
    },
    countries: [{
        type: Schema.Types.ObjectId,
        ref: 'Country',
        required: true,
    }],
    isPedestrian: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

export default mongoose.model<IRoadSign>('RoadSign', RoadSignSchema); 