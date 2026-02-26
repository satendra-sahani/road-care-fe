'use client';

import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Camera } from 'lucide-react';

interface FeedbackFormProps {
  serviceRequestId: string;
  mechanicName: string;
  serviceCategory: string;
  onSubmit: (feedbackData: any) => Promise<void>;
  onCancel: () => void;
}

interface FeedbackData {
  overallRating: number;
  workQuality: number;
  punctuality: number;
  communication: number;
  professionalism: number;
  valueForMoney: number;
  reviewTitle: string;
  reviewComment: string;
  wouldRecommend: boolean | null;
  serviceCompletedSatisfactorily: boolean;
  liked: string[];
  needsImprovement: string[];
}

const LIKED_ASPECTS = [
  'Quick service',
  'Professional behavior',
  'Quality work',
  'Fair pricing',
  'Good communication',
  'Clean work area',
  'Explained the problem well',
  'Used quality parts',
  'On-time arrival'
];

const IMPROVEMENT_AREAS = [
  'Punctuality',
  'Communication',
  'Work quality',
  'Pricing transparency',
  'Professionalism',
  'Cleanliness',
  'Problem explanation',
  'Follow-up'
];

export default function FeedbackForm({
  serviceRequestId,
  mechanicName,
  serviceCategory,
  onSubmit,
  onCancel
}: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [feedbackData, setFeedbackData] = useState<FeedbackData>({
    overallRating: 0,
    workQuality: 0,
    punctuality: 0,
    communication: 0,
    professionalism: 0,
    valueForMoney: 0,
    reviewTitle: '',
    reviewComment: '',
    wouldRecommend: null,
    serviceCompletedSatisfactorily: true,
    liked: [],
    needsImprovement: []
  });

  const handleRatingChange = (field: keyof FeedbackData, rating: number) => {
    setFeedbackData(prev => ({ ...prev, [field]: rating }));
  };

  const handleMultiSelectChange = (field: 'liked' | 'needsImprovement', value: string) => {
    setFeedbackData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackData.overallRating === 0) {
      alert('Please provide an overall rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...feedbackData,
        platform: 'web'
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (rating: number, onChange: (rating: number) => void, label: string) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`p-1 transition-colors ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'
            }`}
          >
            <Star className="w-6 h-6 fill-current" />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Rate Your Service Experience</h2>
        <p className="text-gray-600">
          How was your service with <span className="font-semibold">{mechanicName}</span>?
        </p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Service:</strong> {serviceCategory}
        </p>
      </div>

      {/* Overall Rating */}
      <div className="text-center">
        {renderStarRating(
          feedbackData.overallRating,
          (rating) => handleRatingChange('overallRating', rating),
          'Overall Rating *'
        )}
      </div>

      {/* Service Completion Satisfaction */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">
          Was the service completed to your satisfaction? *
        </label>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setFeedbackData(prev => ({ ...prev, serviceCompletedSatisfactorily: true }))}
            className={`flex items-center px-4 py-2 rounded-lg border ${
              feedbackData.serviceCompletedSatisfactorily
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-300 text-gray-700 hover:border-green-300'
            }`}
          >
            <ThumbsUp className="w-4 h-4 mr-2" />
            Yes, satisfied
          </button>
          <button
            type="button"
            onClick={() => setFeedbackData(prev => ({ ...prev, serviceCompletedSatisfactorily: false }))}
            className={`flex items-center px-4 py-2 rounded-lg border ${
              !feedbackData.serviceCompletedSatisfactorily
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-300 text-gray-700 hover:border-red-300'
            }`}
          >
            <ThumbsDown className="w-4 h-4 mr-2" />
            No, not satisfied
          </button>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          disabled={feedbackData.overallRating === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Detailed Ratings</h2>
        <p className="text-gray-600">Help us understand specific aspects of the service</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderStarRating(
          feedbackData.workQuality,
          (rating) => handleRatingChange('workQuality', rating),
          'Quality of Work'
        )}
        {renderStarRating(
          feedbackData.punctuality,
          (rating) => handleRatingChange('punctuality', rating),
          'Punctuality'
        )}
        {renderStarRating(
          feedbackData.communication,
          (rating) => handleRatingChange('communication', rating),
          'Communication'
        )}
        {renderStarRating(
          feedbackData.professionalism,
          (rating) => handleRatingChange('professionalism', rating),
          'Professionalism'
        )}
        {renderStarRating(
          feedbackData.valueForMoney,
          (rating) => handleRatingChange('valueForMoney', rating),
          'Value for Money'
        )}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => setCurrentStep(3)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Additional Feedback</h2>
        <p className="text-gray-600">Share your detailed experience</p>
      </div>

      {/* What did you like? */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">What did you like about the service?</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {LIKED_ASPECTS.map((aspect) => (
            <button
              key={aspect}
              type="button"
              onClick={() => handleMultiSelectChange('liked', aspect)}
              className={`p-2 text-sm rounded-lg border transition-colors ${
                feedbackData.liked.includes(aspect)
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 text-gray-700 hover:border-green-300'
              }`}
            >
              {aspect}
            </button>
          ))}
        </div>
      </div>

      {/* Areas for improvement */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Areas that could be improved?</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {IMPROVEMENT_AREAS.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => handleMultiSelectChange('needsImprovement', area)}
              className={`p-2 text-sm rounded-lg border transition-colors ${
                feedbackData.needsImprovement.includes(area)
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-300 text-gray-700 hover:border-orange-300'
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Would recommend */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">
          Would you recommend this mechanic to others?
        </label>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setFeedbackData(prev => ({ ...prev, wouldRecommend: true }))}
            className={`flex items-center px-4 py-2 rounded-lg border ${
              feedbackData.wouldRecommend === true
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-300 text-gray-700 hover:border-green-300'
            }`}
          >
            <ThumbsUp className="w-4 h-4 mr-2" />
            Yes, definitely
          </button>
          <button
            type="button"
            onClick={() => setFeedbackData(prev => ({ ...prev, wouldRecommend: false }))}
            className={`flex items-center px-4 py-2 rounded-lg border ${
              feedbackData.wouldRecommend === false
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-300 text-gray-700 hover:border-red-300'
            }`}
          >
            <ThumbsDown className="w-4 h-4 mr-2" />
            No, not really
          </button>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => setCurrentStep(4)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Write a Review</h2>
        <p className="text-gray-600">Share your experience with other customers</p>
      </div>

      {/* Review Title */}
      <div className="space-y-2">
        <label htmlFor="reviewTitle" className="text-sm font-medium text-gray-700">
          Review Title (Optional)
        </label>
        <input
          type="text"
          id="reviewTitle"
          value={feedbackData.reviewTitle}
          onChange={(e) => setFeedbackData(prev => ({ ...prev, reviewTitle: e.target.value }))}
          placeholder="e.g., Great service, highly recommend!"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          maxLength={100}
        />
      </div>

      {/* Review Comment */}
      <div className="space-y-2">
        <label htmlFor="reviewComment" className="text-sm font-medium text-gray-700">
          Detailed Review (Optional)
        </label>
        <textarea
          id="reviewComment"
          value={feedbackData.reviewComment}
          onChange={(e) => setFeedbackData(prev => ({ ...prev, reviewComment: e.target.value }))}
          placeholder="Tell other customers about your experience..."
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          maxLength={1000}
        />
        <p className="text-xs text-gray-500">
          {feedbackData.reviewComment.length}/1000 characters
        </p>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep(3)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </>
          ) : (
            <>
              <MessageSquare className="w-4 h-4 mr-2" />
              Submit Feedback
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step}
            </div>
            {step < 4 && (
              <div
                className={`w-16 h-1 ${
                  step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </form>
    </div>
  );
}