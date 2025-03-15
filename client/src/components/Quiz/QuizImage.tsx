import React from 'react';
import { getImageUrl } from '../../config/apiConfig';

interface QuizImageProps {
  imageUrl: string;
}

const QuizImage: React.FC<QuizImageProps> = ({ imageUrl }) => {
  if (!imageUrl) return null;

  return (
    <div className="mb-4">
      <img 
        src={getImageUrl(imageUrl)} 
        alt="Quiz visual" 
        className="max-w-full h-auto rounded-md"
      />
    </div>
  );
};

export default QuizImage;
