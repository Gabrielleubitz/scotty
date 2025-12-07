import { useState } from 'react';

interface FeedbackFormState {
  isSubmitting: boolean;
  isSubmitted: boolean;
  error: string | null;
}

export const useFeedbackForm = () => {
  const [formState, setFormState] = useState<FeedbackFormState>({
    isSubmitting: false,
    isSubmitted: false,
    error: null,
  });

  const submitFeedback = async (postId: string, rating: 'positive' | 'negative', text: string) => {
    setFormState({ isSubmitting: true, isSubmitted: false, error: null });

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Feedback submitted:', { postId, rating, text });
      
      setFormState({ isSubmitting: false, isSubmitted: true, error: null });
    } catch (error) {
      setFormState({ 
        isSubmitting: false, 
        isSubmitted: false, 
        error: error instanceof Error ? error.message : 'Failed to submit feedback' 
      });
    }
  };

  return { formState, submitFeedback };
};