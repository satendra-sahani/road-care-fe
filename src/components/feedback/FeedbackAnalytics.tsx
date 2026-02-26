'use client';

import { useState, useEffect } from 'react';
import { Star, TrendingUp, Users, Award, Target, BarChart3, ThumbsUp } from 'lucide-react';

interface AnalyticsData {
  totalFeedbacks: number;
  averageRating: number;
  averageWorkQuality: number;
  averagePunctuality: number;
  averageCommunication: number;
  averageProfessionalism: number;
  averageValueForMoney: number;
  recommendationRate: number;
  satisfactionRate: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface PerformanceComparison {
  mechanic: {
    id: string;
    name: string;
    overallRating: number;
    workQuality: number;
    punctuality: number;
    communication: number;
    professionalism: number;
    valueForMoney: number;
    recommendationRate: number;
    completedJobs: number;
    totalFeedbacks: number;
    percentileRanking: number;
  };
  industry: {
    avgOverallRating: number;
    avgWorkQuality: number;
    avgPunctuality: number;
    avgCommunication: number;
    avgProfessionalism: number;
    avgValueForMoney: number;
    avgRecommendationRate: number;
    avgCompletedJobs: number;
    totalMechanics: number;
  };
  performance: {
    ratingDifference: number;
    jobsDifference: number;
    recommendationDifference: number;
    strengths: string[];
    improvements: string[];
  };
}

interface FeedbackAnalyticsProps {
  mechanicId?: string;
  period?: string;
  viewerRole?: 'mechanic' | 'admin';
}

export default function FeedbackAnalytics({
  mechanicId,
  period = '30d',
  viewerRole = 'admin'
}: FeedbackAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [comparisonData, setComparisonData] = useState<PerformanceComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const promises = [];
      
      // Fetch analytics data
      const analyticsUrl = mechanicId 
        ? `/api/${viewerRole}/feedback-analytics?mechanicId=${mechanicId}&period=${selectedPeriod}`
        : `/api/admin/feedback-analytics?period=${selectedPeriod}`;
      
      promises.push(
        fetch(analyticsUrl, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      );

      // Fetch comparison data if mechanic-specific
      if (mechanicId) {
        const comparisonUrl = `/api/${viewerRole}/mechanics/${mechanicId}/analytics/comparison?period=${selectedPeriod}`;
        promises.push(
          fetch(comparisonUrl, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
        );
      }

      const responses = await Promise.all(promises);
      
      // Process analytics data
      if (responses[0].ok) {
        const analyticsResult = await responses[0].json();
        setAnalyticsData(analyticsResult.data);
      }

      // Process comparison data
      if (responses[1] && responses[1].ok) {
        const comparisonResult = await responses[1].json();
        setComparisonData(comparisonResult.data);
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [mechanicId, selectedPeriod, viewerRole]);

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
      <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
    </div>
  );

  const renderMetricCard = (
    title: string,
    value: string | number,
    icon: React.ReactNode,
    change?: number,
    changeType?: 'positive' | 'negative' | 'neutral'
  ) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change !== undefined && (
            <p className={`text-sm ${
              changeType === 'positive' ? 'text-green-600' : 
              changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {change > 0 ? '+' : ''}{change}% vs industry
            </p>
          )}
        </div>
        <div className="text-blue-600">{icon}</div>
      </div>
    </div>
  );

  const renderProgressBar = (label: string, value: number, maxValue: number = 5, color: string = 'blue') => (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">{value.toFixed(1)}/{maxValue}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full bg-${color}-600`}
          style={{ width: `${(value / maxValue) * 100}%` }}
        />
      </div>
    </div>
  );

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
          onClick={fetchAnalyticsData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className="space-y-6">
      {/* Header with Period Selection */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Feedback Analytics</h2>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="365d">Last Year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderMetricCard(
          'Total Reviews',
          analyticsData.totalFeedbacks,
          <Users className="w-6 h-6" />
        )}
        {renderMetricCard(
          'Average Rating',
          analyticsData.averageRating.toFixed(1),
          <Star className="w-6 h-6" />,
          comparisonData ? ((analyticsData.averageRating - comparisonData.industry.avgOverallRating) / comparisonData.industry.avgOverallRating * 100) : undefined,
          comparisonData && analyticsData.averageRating > comparisonData.industry.avgOverallRating ? 'positive' : 'negative'
        )}
        {renderMetricCard(
          'Customer Satisfaction',
          `${analyticsData.satisfactionRate}%`,
          <ThumbsUp className="w-6 h-6" />
        )}
        {renderMetricCard(
          'Recommendation Rate',
          `${analyticsData.recommendationRate}%`,
          <Award className="w-6 h-6" />,
          comparisonData ? analyticsData.recommendationRate - comparisonData.industry.avgRecommendationRate : undefined,
          comparisonData && analyticsData.recommendationRate > comparisonData.industry.avgRecommendationRate ? 'positive' : 'negative'
        )}
      </div>

      {/* Performance Comparison */}
      {comparisonData && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance vs Industry Average</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Detailed Ratings</h4>
              {renderProgressBar('Work Quality', comparisonData.mechanic.workQuality)}
              {renderProgressBar('Punctuality', comparisonData.mechanic.punctuality)}
              {renderProgressBar('Communication', comparisonData.mechanic.communication)}
              {renderProgressBar('Professionalism', comparisonData.mechanic.professionalism)}
              {renderProgressBar('Value for Money', comparisonData.mechanic.valueForMoney)}
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Industry Ranking</h4>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {comparisonData.mechanic.percentileRanking}%
                  </div>
                  <p className="text-sm text-gray-600">
                    Better than {comparisonData.mechanic.percentileRanking}% of mechanics
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Key Insights</h4>
                <div className="space-y-2">
                  {comparisonData.performance.strengths.map((strength, index) => (
                    <div key={index} className="flex items-center text-green-700 text-sm">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      {strength}
                    </div>
                  ))}
                  {comparisonData.performance.improvements.map((improvement, index) => (
                    <div key={index} className="flex items-center text-orange-600 text-sm">
                      <Target className="w-4 h-4 mr-2" />
                      {improvement}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center space-x-3">
              <span className="text-sm w-8">{rating}</span>
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-yellow-400 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${analyticsData.totalFeedbacks > 0 
                      ? (analyticsData.ratingDistribution[rating as keyof typeof analyticsData.ratingDistribution] / analyticsData.totalFeedbacks) * 100 
                      : 0}%`
                  }}
                />
              </div>
              <span className="text-sm text-gray-600 w-12">
                {analyticsData.ratingDistribution[rating as keyof typeof analyticsData.ratingDistribution]} ({
                  analyticsData.totalFeedbacks > 0 
                    ? Math.round((analyticsData.ratingDistribution[rating as keyof typeof analyticsData.ratingDistribution] / analyticsData.totalFeedbacks) * 100)
                    : 0
                }%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Performance Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {analyticsData.averageWorkQuality.toFixed(1)}
            </div>
            {renderStars(analyticsData.averageWorkQuality)}
            <p className="text-sm text-gray-600 mt-1">Work Quality</p>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {analyticsData.averagePunctuality.toFixed(1)}
            </div>
            {renderStars(analyticsData.averagePunctuality)}
            <p className="text-sm text-gray-600 mt-1">Punctuality</p>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {analyticsData.averageCommunication.toFixed(1)}
            </div>
            {renderStars(analyticsData.averageCommunication)}
            <p className="text-sm text-gray-600 mt-1">Communication</p>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {analyticsData.averageProfessionalism.toFixed(1)}
            </div>
            {renderStars(analyticsData.averageProfessionalism)}
            <p className="text-sm text-gray-600 mt-1">Professionalism</p>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {analyticsData.averageValueForMoney.toFixed(1)}
            </div>
            {renderStars(analyticsData.averageValueForMoney)}
            <p className="text-sm text-gray-600 mt-1">Value for Money</p>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {analyticsData.recommendationRate}%
            </div>
            <p className="text-sm text-gray-600">Recommendations</p>
          </div>
        </div>
      </div>
    </div>
  );
}