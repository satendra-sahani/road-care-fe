'use client';

import { useState, useEffect } from 'react';
import { Star, Filter, Search, ChevronDown } from 'lucide-react';
import FeedbackDisplay from './FeedbackDisplay';

interface FeedbackListProps {
  mechanicId?: string;
  customerId?: string;
  viewerRole?: 'customer' | 'mechanic' | 'admin';
  viewerId?: string;
  showFilters?: boolean;
  showServiceDetails?: boolean;
  onVoteHelpful?: (feedbackId: string, voteType: 'helpful' | 'not_helpful') => Promise<void>;
  onRespondToFeedback?: (feedbackId: string, response: string) => Promise<void>;
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

interface FeedbackStats {
  totalFeedbacks: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  recommendationRate: number;
}

export default function FeedbackList({
  mechanicId,
  customerId,
  viewerRole,
  viewerId,
  showFilters = true,
  showServiceDetails = true,
  onVoteHelpful,
  onRespondToFeedback
}: FeedbackListProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    rating: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  });
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = '/api';
      const params = new URLSearchParams();

      if (mechanicId) {
        url += `/common/mechanics/${mechanicId}/feedbacks`;
      } else if (customerId) {
        url += `/user/feedbacks`;
      } else {
        url += `/admin/feedbacks`;
      }

      // Add filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value.toString());
        }
      });

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feedbacks');
      }

      const data = await response.json();
      setFeedbacks(data.data || []);
      
      // Calculate stats if not provided
      if (data.data && data.data.length > 0) {
        calculateStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      setError('Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (feedbackData: Feedback[]) => {
    const totalFeedbacks = feedbackData.length;
    const averageRating = feedbackData.reduce((sum, fb) => sum + fb.overallRating, 0) / totalFeedbacks;
    
    const ratingDistribution = feedbackData.reduce((acc, fb) => {
      acc[fb.overallRating as keyof typeof acc]++;
      return acc;
    }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

    const recommendationsCount = feedbackData.filter(fb => fb.wouldRecommend).length;
    const recommendationRate = (recommendationsCount / totalFeedbacks) * 100;

    setStats({
      totalFeedbacks,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      recommendationRate: Math.round(recommendationRate)
    });
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [mechanicId, customerId, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  const renderRatingDistribution = () => {
    if (!stats) return null;

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => (
          <div key={rating} className="flex items-center space-x-2">
            <span className="text-sm w-8">{rating}</span>
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full"
                style={{
                  width: `${stats.totalFeedbacks > 0 
                    ? (stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] / stats.totalFeedbacks) * 100 
                    : 0}%`
                }}
              />
            </div>
            <span className="text-sm text-gray-600 w-8">
              {stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]}
            </span>
          </div>
        ))}
      </div>
    );
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
          onClick={fetchFeedbacks}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {stats && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{stats.averageRating}</div>
              <div className="flex justify-center mb-1">
                {renderStars(Math.round(stats.averageRating))}
              </div>
              <div className="text-sm text-gray-600">
                Based on {stats.totalFeedbacks} reviews
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.recommendationRate}%</div>
              <div className="text-sm text-gray-600">Customer Recommendation Rate</div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Rating Distribution</h4>
              {renderRatingDistribution()}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reviews..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Rating Filter */}
            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                Sort
                <ChevronDown className="w-4 h-4 ml-2" />
              </button>
              
              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        handleFilterChange('sortBy', 'createdAt');
                        handleFilterChange('sortOrder', 'desc');
                        setShowFilterDropdown(false);
                      }}
                      className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
                    >
                      Newest First
                    </button>
                    <button
                      onClick={() => {
                        handleFilterChange('sortBy', 'createdAt');
                        handleFilterChange('sortOrder', 'asc');
                        setShowFilterDropdown(false);
                      }}
                      className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
                    >
                      Oldest First
                    </button>
                    <button
                      onClick={() => {
                        handleFilterChange('sortBy', 'overallRating');
                        handleFilterChange('sortOrder', 'desc');
                        setShowFilterDropdown(false);
                      }}
                      className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
                    >
                      Highest Rating
                    </button>
                    <button
                      onClick={() => {
                        handleFilterChange('sortBy', 'overallRating');
                        handleFilterChange('sortOrder', 'asc');
                        setShowFilterDropdown(false);
                      }}
                      className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
                    >
                      Lowest Rating
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feedback List */}
      <div className="space-y-4">
        {feedbacks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback yet</h3>
            <p className="text-gray-600">
              {mechanicId ? 'This mechanic hasn\'t received any feedback yet.' : 'No feedback found matching your filters.'}
            </p>
          </div>
        ) : (
          feedbacks.map((feedback) => (
            <FeedbackDisplay
              key={feedback._id}
              feedback={feedback}
              viewerRole={viewerRole}
              viewerId={viewerId}
              showServiceDetails={showServiceDetails}
              onVoteHelpful={onVoteHelpful}
              onRespondToFeedback={onRespondToFeedback}
            />
          ))
        )}
      </div>

      {/* Load More */}
      {feedbacks.length >= filters.limit && (
        <div className="text-center">
          <button
            onClick={() => handleFilterChange('limit', (filters.limit + 10).toString())}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Load More Reviews
          </button>
        </div>
      )}
    </div>
  );
}