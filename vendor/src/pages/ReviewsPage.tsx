import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorAnalyticsApi } from '../api/vendor-analytics.api';
import { vendorReviewsApi } from '../api/vendor-reviews.api';
import { ReviewResponse } from '../types/vendor.types';
import { 
  Star, 
  MessageSquare, 
  CornerDownRight, 
  Send, 
  Loader2, 
  AlertCircle,
  ChevronRight,
  User as UserIcon,
  Smile
} from 'lucide-react';

export const ReviewsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [replyOpen, setReplyOpen] = useState<Record<number, boolean>>({});

  // 1. Fetch Reviews
  const { data: reviewsRes, isLoading, error } = useQuery({
    queryKey: ['vendor-reviews-list'],
    queryFn: () => vendorAnalyticsApi.getReviews(0, 100),
  });

  const reviews = reviewsRes?.data?.content || [];

  // 2. Submit Reply Mutation
  const replyMutation = useMutation({
    mutationFn: ({ reviewId, text }: { reviewId: number; text: string }) =>
      vendorReviewsApi.replyToReview(reviewId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-reviews-list'] });
      setReplyText({});
      setReplyOpen({});
    },
  });

  const handleReplyChange = (reviewId: number, text: string) => {
    setReplyText((prev) => ({
      ...prev,
      [reviewId]: text,
    }));
  };

  const handleReplyToggle = (reviewId: number) => {
    setReplyOpen((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  const handleSendReply = (reviewId: number) => {
    const text = replyText[reviewId];
    if (text && text.trim()) {
      replyMutation.mutate({ reviewId, text });
    }
  };

  // Filter reviews locally
  const filteredReviews = reviews.filter((review) => {
    if (ratingFilter === 'all') return true;
    return review.rating === ratingFilter;
  });

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : '4.8';

  const renderStars = (rating: number, size = 16) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star 
            key={s} 
            size={size} 
            className={`${
              s <= rating 
                ? 'text-amber-400 fill-amber-400' 
                : 'text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Upper header */}
      <div>
        <h1 className="text-3xl font-black text-textMain tracking-tight my-0">Customer Reviews</h1>
        <p className="text-sm text-mutedColor">Read customer feedback and reply directly to reviews</p>
      </div>

      {isLoading ? (
        <div className="h-[300px] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-mutedColor">Syncing review log...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span className="font-semibold">Failed to fetch reviews. Please check backend services.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left panel: Summary statistics & Filters */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              
              {/* Avg Rating display */}
              <div className="text-center space-y-2">
                <h2 className="text-5xl font-black text-textMain">{averageRating}</h2>
                <div className="flex justify-center">{renderStars(Math.round(parseFloat(averageRating)), 20)}</div>
                <p className="text-xs text-mutedColor">Based on {reviews.length} ratings</p>
              </div>

              {/* Filters */}
              <div className="space-y-3 pt-4 border-t border-gray-50">
                <h4 className="text-xs font-bold text-textMain uppercase tracking-wider">Filter by Rating</h4>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setRatingFilter('all')}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      ratingFilter === 'all'
                        ? 'bg-primary-light text-primary border border-primary/20'
                        : 'bg-gray-50 hover:bg-gray-100 text-mutedColor'
                    }`}
                  >
                    <span>All Reviews</span>
                    <span className="bg-white px-2 py-0.5 rounded-md border text-[10px] text-textMain">{reviews.length}</span>
                  </button>

                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviews.filter((r) => r.rating === star).length;
                    return (
                      <button
                        key={star}
                        onClick={() => setRatingFilter(star)}
                        className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          ratingFilter === star
                            ? 'bg-primary-light text-primary border border-primary/20'
                            : 'bg-gray-50 hover:bg-gray-100 text-mutedColor'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          {star} Stars {renderStars(star, 12)}
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded-md border text-[10px] text-textMain">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Right panel: Reviews log */}
          <div className="lg:col-span-2 space-y-6">
            {filteredReviews.length === 0 ? (
              <div className="bg-surface p-12 rounded-3xl border border-gray-100 text-center space-y-3 shadow-sm">
                <Smile className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="text-base font-bold text-textMain">No Reviews Found</h3>
                <p className="text-xs text-mutedColor max-w-xs mx-auto">
                  No review matches the selected filter. Try choosing another rating filter.
                </p>
              </div>
            ) : (
              filteredReviews.map((review) => (
                <div 
                  key={review.id}
                  className="bg-surface p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4"
                >
                  
                  {/* Customer Info row */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {review.userAvatar ? (
                        <img 
                          src={review.userAvatar} 
                          alt={review.userName} 
                          className="w-10 h-10 rounded-full object-cover border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-mutedColor">
                          <UserIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-extrabold text-textMain leading-tight">{review.userName}</h4>
                        <p className="text-[10px] text-mutedColor">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="space-y-1 text-right">
                      {renderStars(review.rating)}
                    </div>
                  </div>

                  {/* Review Text */}
                  <p className="text-sm text-textMain leading-relaxed font-medium bg-gray-50/50 p-3 rounded-xl">
                    {review.reviewText || <span className="italic text-gray-400">No written text, only rating stars.</span>}
                  </p>

                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2.5">
                      {review.images.map((url, idx) => (
                        <img 
                          key={idx}
                          src={url} 
                          alt="Review attachment" 
                          className="w-16 h-16 rounded-lg object-cover border bg-gray-50 hover:scale-105 transition-transform cursor-zoom-in"
                        />
                      ))}
                    </div>
                  )}

                  {/* Reply Action */}
                  <div className="border-t border-gray-50 pt-4 space-y-3">
                    {review.replyText ? (
                      <div className="bg-primary-light/40 border border-primary/10 rounded-xl p-4 flex gap-3 text-sm">
                        <CornerDownRight className="w-5 h-5 shrink-0 text-primary" />
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-primary uppercase block tracking-wider">Your Response</span>
                          <p className="text-textMain font-medium leading-relaxed">{review.replyText}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {!replyOpen[review.id] ? (
                          <button
                            onClick={() => handleReplyToggle(review.id)}
                            className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                          >
                            Reply to Review <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div className="space-y-3">
                            <textarea
                              rows={2}
                              value={replyText[review.id] || ''}
                              onChange={(e) => handleReplyChange(review.id, e.target.value)}
                              placeholder="Type a polite thank you message or response to feedback..."
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleReplyToggle(review.id)}
                                className="px-3 py-1.5 border text-[10px] font-bold rounded-lg hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSendReply(review.id)}
                                disabled={!replyText[review.id]?.trim() || replyMutation.isPending}
                                className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary-hover flex items-center gap-1 shadow-sm"
                              >
                                {replyMutation.isPending && <Loader2 className="w-3 animate-spin" />}
                                <Send className="w-3 h-3" /> Send Reply
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
};
