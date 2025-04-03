import mongoose, { Schema, Document } from 'mongoose';

export interface ILanguage extends Document {
    imageUrl: string;
    description: string;
    countries: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const LanguageSchema: Schema = new Schema({
    imageUrl: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    countries: [{
        type: Schema.Types.ObjectId,
        ref: 'Country',
        required: true,
    }],
}, {
    timestamps: true,
});

export default mongoose.model<ILanguage>('Language', LanguageSchema); 