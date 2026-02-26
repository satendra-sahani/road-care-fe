'use client';

import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

interface Feedback {
  _id: string;
  overallRating: number;
  ratings: {
    workQuality: number;
    punctuality: number;
    communication: number;
    professionalism: number;
    valueForMoney: number;
  };
  review: {
    title?: string;
    comment?: string;
  };
  serviceAspects: {
    liked: string[];
    needsImprovement: string[];
  };
  wouldRecommend: boolean;
  serviceCompletedSatisfactorily: boolean;
  customer: {
    _id: string;
    fullName: string;
    profileImage?: string;
  };
  mechanic: {
    _id: string;
    user: {
      fullName: string;
      profileImage?: string;
    };
  };
  serviceRequest: {
    requestId: string;
    serviceCategory: string;
    totalCost: number;
    completedDate: string;
  };
  mechanicResponse?: {
    comment: string;
    respondedAt: string;
    respondedBy: {
      fullName: string;
      role: string;
    };
  };
  helpfulVotes: {
    helpful: number;
    notHelpful: number;
  };
  createdAt: string;
  status: string;
}

interface FeedbackDisplayProps {
  feedback: Feedback;
  viewerRole?: 'customer' | 'mechanic' | 'admin';
  viewerId?: string;
  onVoteHelpful?: (feedbackId: string, voteType: 'helpful' | 'not_helpful') => Promise<void>;
  onRespondToFeedback?: (feedbackId: string, response: string) => Promise<void>;
  showServiceDetails?: boolean;
}

export default function FeedbackDisplay({
  feedback,
  viewerRole,
  viewerId,
  onVoteHelpful,
  onRespondToFeedback,
  showServiceDetails = true
}: FeedbackDisplayProps) {
  const [showResponse, setShowResponse] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  const handleResponseSubmit = async () => {
    if (!responseText.trim() || !onRespondToFeedback) return;
    
    setIsSubmittingResponse(true);
    try {
      await onRespondToFeedback(feedback._id, responseText);
      setResponseText('');
      setShowResponse(false);
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response. Please try again.');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const handleVote = async (voteType: 'helpful' | 'not_helpful') => {
    if (!onVoteHelpful) return;
    
    try {
      await onVoteHelpful(feedback._id, voteType);
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to record vote. Please try again.');
    }
  };

  const canRespondToFeedback = viewerRole === 'mechanic' && 
    feedback.mechanic.user && 
    !feedback.mechanicResponse;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            {feedback.customer.profileImage ? (
              <img
                src={feedback.customer.profileImage}
                alt={feedback.customer.fullName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-gray-600 font-medium">
                {feedback.customer.fullName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{feedback.customer.fullName}</h4>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          {renderStars(feedback.overallRating, 'md')}
          <div className="flex items-center mt-1">
            {feedback.wouldRecommend ? (
              <div className="flex items-center text-green-600 text-sm">
                <ThumbsUp className="w-4 h-4 mr-1" />
                <span>Recommends</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600 text-sm">
                <ThumbsDown className="w-4 h-4 mr-1" />
                <span>Not recommended</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Details */}
      {showServiceDetails && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span>
              <strong>Service:</strong> {feedback.serviceRequest.serviceCategory}
            </span>
            <span>
              <strong>ID:</strong> {feedback.serviceRequest.requestId}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span>
              <strong>Cost:</strong> ₹{feedback.serviceRequest.totalCost.toLocaleString()}
            </span>
            <span>
              <strong>Completed:</strong> {new Date(feedback.serviceRequest.completedDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}

      {/* Service Satisfaction */}
      <div className="flex items-center space-x-4">
        {feedback.serviceCompletedSatisfactorily ? (
          <div className="flex items-center text-green-600">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="text-sm">Service completed satisfactorily</span>
          </div>
        ) : (
          <div className="flex items-center text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="text-sm">Service not completed satisfactorily</span>
          </div>
        )}
      </div>

      {/* Detailed Ratings */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <span className="text-xs text-gray-500">Work Quality</span>
          {renderStars(feedback.ratings.workQuality)}
        </div>
        <div>
          <span className="text-xs text-gray-500">Punctuality</span>
          {renderStars(feedback.ratings.punctuality)}
        </div>
        <div>
          <span className="text-xs text-gray-500">Communication</span>
          {renderStars(feedback.ratings.communication)}
        </div>
        <div>
          <span className="text-xs text-gray-500">Professionalism</span>
          {renderStars(feedback.ratings.professionalism)}
        </div>
        <div>
          <span className="text-xs text-gray-500">Value for Money</span>
          {renderStars(feedback.ratings.valueForMoney)}
        </div>
      </div>

      {/* Written Review */}
      {feedback.review.title && (
        <div>
          <h5 className="font-medium text-gray-900 mb-1">{feedback.review.title}</h5>
        </div>
      )}
      
      {feedback.review.comment && (
        <div>
          <p className="text-gray-700 leading-relaxed">{feedback.review.comment}</p>
        </div>
      )}

      {/* Liked Aspects */}
      {feedback.serviceAspects.liked.length > 0 && (
        <div>
          <h6 className="text-sm font-medium text-gray-900 mb-2">What they liked:</h6>
          <div className="flex flex-wrap gap-2">
            {feedback.serviceAspects.liked.map((aspect, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
              >
                {aspect}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Improvement Areas */}
      {feedback.serviceAspects.needsImprovement.length > 0 && (
        <div>
          <h6 className="text-sm font-medium text-gray-900 mb-2">Areas for improvement:</h6>
          <div className="flex flex-wrap gap-2">
            {feedback.serviceAspects.needsImprovement.map((area, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Mechanic Response */}
      {feedback.mechanicResponse && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex items-center mb-2">
            <MessageSquare className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900">
              Response from {feedback.mechanicResponse.respondedBy.fullName}
            </span>
            <span className="text-xs text-blue-600 ml-auto">
              {new Date(feedback.mechanicResponse.respondedAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-blue-800">{feedback.mechanicResponse.comment}</p>
        </div>
      )}

      {/* Response Form */}
      {canRespondToFeedback && showResponse && (
        <div className="border-t pt-4">
          <h6 className="text-sm font-medium text-gray-900 mb-2">Respond to this feedback:</h6>
          <div className="space-y-3">
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Thank your customer and address any concerns..."
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">{responseText.length}/500 characters</span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowResponse(false)}
                  className="px-3 py-1 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResponseSubmit}
                  disabled={!responseText.trim() || isSubmittingResponse}
                  className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingResponse ? 'Submitting...' : 'Submit Response'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center space-x-4">
          {/* Helpful Votes */}
          {onVoteHelpful && viewerRole !== 'mechanic' && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Helpful?</span>
              <button
                onClick={() => handleVote('helpful')}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-green-600"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{feedback.helpfulVotes.helpful}</span>
              </button>
              <button
                onClick={() => handleVote('not_helpful')}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600"
              >
                <ThumbsDown className="w-4 h-4" />
                <span>{feedback.helpfulVotes.notHelpful}</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {canRespondToFeedback && !showResponse && (
            <button
              onClick={() => setShowResponse(true)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Respond</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}