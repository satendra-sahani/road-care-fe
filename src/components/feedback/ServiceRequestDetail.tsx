'use client';

import { useState, useEffect } from 'react';
import { Star, MessageSquare, Calendar, MapPin, User, Wrench, Phone } from 'lucide-react';
import FeedbackForm from './FeedbackForm';
import FeedbackDisplay from './FeedbackDisplay';

interface ServiceRequest {
  _id: string;
  requestId: string;
  status: string;
  serviceCategory: string;
  description: string;
  location: {
    address: string;
    city: string;
    state: string;
  };
  vehicle: {
    type: string;
    brand: string;
    model: string;
    year: string;
    registrationNumber: string;
  };
  customer: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage?: string;
  };
  mechanic?: {
    _id: string;
    user: {
      fullName: string;
      email: string;
      phone: string;
      profileImage?: string;
    };
    specializations: string[];
    rating: number;
    completedJobs: number;
  };
  completedDate?: string;
  totalCost: number;
  feedback?: string; // Feedback ID
  feedbackStatus: string;
  isFeedbackEligible: boolean;
  createdAt: string;
}

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

interface ServiceRequestDetailProps {
  serviceRequestId: string;
  viewerRole: 'customer' | 'mechanic' | 'admin';
  viewerId: string;
}

export default function ServiceRequestDetail({
  serviceRequestId,
  viewerRole,
  viewerId
}: ServiceRequestDetailProps) {
  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceRequestDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = '/api';
      switch (viewerRole) {
        case 'customer':
          url += `/user/service-requests/${serviceRequestId}`;
          break;
        case 'mechanic':
          url += `/mechanic/service-requests/${serviceRequestId}`;
          break;
        case 'admin':
          url += `/admin/service-requests/${serviceRequestId}`;
          break;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch service request details');
      }

      const data = await response.json();
      setServiceRequest(data.data);

      // Fetch feedback if it exists
      if (data.data.feedback) {
        await fetchFeedback(serviceRequestId);
      }
    } catch (error) {
      console.error('Error fetching service request:', error);
      setError('Failed to load service request details');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async (requestId: string) => {
    try {
      let url = '/api';
      switch (viewerRole) {
        case 'customer':
          url += `/user/service-requests/${requestId}/feedback`;
          break;
        case 'mechanic':
          url += `/mechanic/service-requests/${requestId}/feedback`;
          break;
        case 'admin':
          url += `/admin/service-requests/${requestId}/feedback`;
          break;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.data);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  const handleSubmitFeedback = async (feedbackData: any) => {
    try {
      const response = await fetch(`/api/user/service-requests/${serviceRequestId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(feedbackData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit feedback');
      }

      const data = await response.json();
      setFeedback(data.data);
      setShowFeedbackForm(false);
      
      // Refresh service request to update feedback status
      await fetchServiceRequestDetails();
      
      alert('Feedback submitted successfully!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  };

  const handleVoteHelpful = async (feedbackId: string, voteType: 'helpful' | 'not_helpful') => {
    try {
      const response = await fetch(`/api/user/feedbacks/${feedbackId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ voteType })
      });

      if (!response.ok) {
        throw new Error('Failed to record vote');
      }

      const data = await response.json();
      
      // Update feedback with new vote counts
      if (feedback) {
        setFeedback({
          ...feedback,
          helpfulVotes: {
            helpful: data.data.helpful,
            notHelpful: data.data.notHelpful
          }
        });
      }
    } catch (error) {
      console.error('Error voting:', error);
      throw error;
    }
  };

  const handleMechanicResponse = async (feedbackId: string, response: string) => {
    try {
      const responseData = await fetch(`/api/mechanic/feedbacks/${feedbackId}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ comment: response })
      });

      if (!responseData.ok) {
        throw new Error('Failed to submit response');
      }

      const data = await responseData.json();
      setFeedback(data.data);
    } catch (error) {
      console.error('Error submitting response:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchServiceRequestDetails();
  }, [serviceRequestId, viewerRole]);

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      on_way: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchServiceRequestDetails}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!serviceRequest) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Service Request Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Service Request #{serviceRequest.requestId}
          </h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(serviceRequest.status)}`}>
            {serviceRequest.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Service Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Wrench className="w-4 h-4 mr-2 text-gray-500" />
                <span>{serviceRequest.serviceCategory}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                <span>{serviceRequest.location.address}, {serviceRequest.location.city}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <span>Created: {new Date(serviceRequest.createdAt).toLocaleDateString()}</span>
              </div>
              {serviceRequest.completedDate && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Completed: {new Date(serviceRequest.completedDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Vehicle Information</h3>
            <div className="text-sm space-y-1">
              <p>{serviceRequest.vehicle.type} - {serviceRequest.vehicle.brand} {serviceRequest.vehicle.model}</p>
              <p>Year: {serviceRequest.vehicle.year}</p>
              <p>Registration: {serviceRequest.vehicle.registrationNumber}</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="font-medium text-gray-900 mb-2">Problem Description</h3>
          <p className="text-gray-700">{serviceRequest.description}</p>
        </div>

        {serviceRequest.totalCost > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-1">Service Cost</h3>
            <p className="text-2xl font-bold text-green-600">₹{serviceRequest.totalCost.toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Mechanic Information */}
      {serviceRequest.mechanic && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Assigned Mechanic</h2>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              {serviceRequest.mechanic.user.profileImage ? (
                <img
                  src={serviceRequest.mechanic.user.profileImage}
                  alt={serviceRequest.mechanic.user.fullName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                {serviceRequest.mechanic.user.fullName}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  <span>{serviceRequest.mechanic.rating.toFixed(1)} rating</span>
                </div>
                <span>{serviceRequest.mechanic.completedJobs} jobs completed</span>
              </div>
              <div className="flex items-center mt-1">
                <Phone className="w-4 h-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-600">{serviceRequest.mechanic.user.phone}</span>
              </div>
              <div className="mt-2">
                <div className="flex flex-wrap gap-2">
                  {serviceRequest.mechanic.specializations.map((spec, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Customer Feedback
          </h2>
          
          {/* Feedback Actions */}
          {viewerRole === 'customer' && serviceRequest.status === 'completed' && !feedback && (
            <button
              onClick={() => setShowFeedbackForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Star className="w-4 h-4 mr-2" />
              Leave Feedback
            </button>
          )}
        </div>

        {showFeedbackForm && (
          <FeedbackForm
            serviceRequestId={serviceRequestId}
            mechanicName={serviceRequest.mechanic?.user.fullName || 'Mechanic'}
            serviceCategory={serviceRequest.serviceCategory}
            onSubmit={handleSubmitFeedback}
            onCancel={() => setShowFeedbackForm(false)}
          />
        )}

        {feedback && (
          <FeedbackDisplay
            feedback={feedback}
            viewerRole={viewerRole}
            viewerId={viewerId}
            showServiceDetails={false}
            onVoteHelpful={viewerRole === 'customer' ? handleVoteHelpful : undefined}
            onRespondToFeedback={viewerRole === 'mechanic' ? handleMechanicResponse : undefined}
          />
        )}

        {!feedback && !showFeedbackForm && (
          <div className="text-center py-8">
            {serviceRequest.status === 'completed' ? (
              viewerRole === 'customer' ? (
                <div>
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Share your experience with this service to help other customers and improve our services.
                  </p>
                  <button
                    onClick={() => setShowFeedbackForm(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Leave Your Feedback
                  </button>
                </div>
              ) : (
                <div>
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Customer hasn't provided feedback yet.</p>
                  {serviceRequest.feedbackStatus === 'pending' && (
                    <p className="text-sm text-orange-600">Feedback request will be sent automatically.</p>
                  )}
                </div>
              )
            ) : (
              <div>
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Feedback will be available after service completion.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}