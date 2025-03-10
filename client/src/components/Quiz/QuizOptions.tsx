import React from 'react';

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizOptionsProps {
  options: Option[];
  selectedOption: string | null;
  isAnswered: boolean;
  onOptionSelect: (optionId: string) => void;
}

const QuizOptions: React.FC<QuizOptionsProps> = ({ 
  options, 
  selectedOption, 
  isAnswered, 
  onOptionSelect 
}) => {
  return (
    <div className="space-y-3">
      {options.map((option) => {
        const isSelected = selectedOption === option.id;
        let buttonClass = "w-full text-left p-3 rounded-lg border transition-all duration-200 ";
        
        if (isAnswered) {
          if (option.isCorrect) {
            buttonClass += "bg-green-100 border-green-500 text-green-800";
          } else if (isSelected) {
            buttonClass += "bg-red-100 border-red-500 text-red-800";
          } else {
            buttonClass += "bg-gray-50 border-gray-200 text-gray-500";
          }
        } else {
          buttonClass += isSelected
            ? "bg-blue-100 border-blue-500 text-blue-800"
            : "bg-white border-gray-200 hover:border-blue-500 hover:bg-blue-50";
        }

        return (
          <button
            key={option.id}
            className={buttonClass}
            onClick={() => onOptionSelect(option.id)}
            disabled={isAnswered}
          >
            {option.text}
          </button>
        );
      })}
    </div>
  );
};

export default QuizOptions;
