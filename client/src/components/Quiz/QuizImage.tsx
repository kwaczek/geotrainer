import React from 'react';

interface QuizImageProps {
  imageUrl: string;
}

const QuizImage: React.FC<QuizImageProps> = ({ imageUrl }) => {
  if (!imageUrl) return null;

  return (
    <div className="mb-4">
      <img 
        src={imageUrl} 
        alt="Quiz visual" 
        className="max-w-full h-auto rounded-md"
      />
    </div>
  );
};

export default QuizImage;
