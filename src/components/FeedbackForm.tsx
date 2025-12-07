import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';

interface FeedbackFormProps {
  formState: {
    isSubmitting: boolean;
    isSubmitted: boolean;
    error: string | null;
  };
  submitFeedback: (rating: 'positive' | 'negative', text: string) => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ formState, submitFeedback }) => {
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [showTextArea, setShowTextArea] = useState(false);

  const handleRatingClick = (selectedRating: 'positive' | 'negative') => {
    setRating(selectedRating);
    setShowTextArea(true);
  };

  const handleSubmit = () => {
    if (rating) {
      submitFeedback(rating, feedbackText);
      setRating(null);
      setFeedbackText('');
      setShowTextArea(false);
    }
  };

  if (formState.isSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
        <div className="flex items-center space-x-2">
          <ThumbsUp size={16} className="text-green-600" />
          <span className="text-sm text-green-800 font-medium">
            Thank you for your feedback!
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 pt-6 mt-6">
      <div className="flex items-center space-x-3 mb-4">
        <MessageSquare size={16} className="text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          Was this update helpful?
        </span>
      </div>

      <div className="flex items-center space-x-3 mb-4">
        <button
          onClick={() => handleRatingClick('positive')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
            rating === 'positive'
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-300 hover:border-green-300 text-gray-600 hover:text-green-600'
          }`}
        >
          <ThumbsUp size={16} />
          <span className="text-sm">Yes</span>
        </button>

        <button
          onClick={() => handleRatingClick('negative')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
            rating === 'negative'
              ? 'border-red-500 bg-red-50 text-red-700'
              : 'border-gray-300 hover:border-red-300 text-gray-600 hover:text-red-600'
          }`}
        >
          <ThumbsDown size={16} />
          <span className="text-sm">No</span>
        </button>
      </div>

      {showTextArea && (
        <div className="space-y-3">
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Tell us more about your experience (optional)"
            rows={3}
            className="text-sm"
          />
          
          <div className="flex items-center space-x-3">
            <Button
              size="sm"
              onClick={handleSubmit}
              loading={formState.isSubmitting}
              disabled={!rating}
            >
              Submit Feedback
            </Button>
            
            <button
              onClick={() => {
                setShowTextArea(false);
                setRating(null);
                setFeedbackText('');
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {formState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
          <span className="text-sm text-red-800">{formState.error}</span>
        </div>
      )}
    </div>
  );
};

export default FeedbackForm;