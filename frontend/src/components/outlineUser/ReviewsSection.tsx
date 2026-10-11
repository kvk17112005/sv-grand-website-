import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { Review } from '../../types/hotel';
import {
  Star,
  ThumbsUp,
  ShieldCheck,
  MessageSquare,
  Plus,
  X,
  CheckCircle,
  Filter
} from 'lucide-react';

export const ReviewsSection: React.FC = () => {
  const { hotel, reviews, addReview, voteHelpfulReview, showToast, currentUser } = useHotel();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'Couples' | 'Business' | 'Solo' | 'Family'>('all');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // Form state
  const [rating, setRating] = useState(5);
  const [stayType, setStayType] = useState<'Business' | 'Couples' | 'Family' | 'Solo'>('Business');
  const [roomCategory, setRoomCategory] = useState('Townhouse Deluxe King');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const approvedReviews = reviews.filter((r) => r.approved);
  const filteredReviews =
    selectedFilter === 'all'
      ? approvedReviews
      : approvedReviews.filter((r) => r.stayType === selectedFilter);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !comment.trim()) return;

    addReview({
      guestName: currentUser?.name || 'Verified Guest',
      rating,
      roomType: roomCategory,
      title,
      comment,
      stayType,
      verified: true,
      ratingsBreakdown: {
        cleanliness: rating,
        staff: rating,
        location: 5,
        amenities: rating >= 4 ? 4.5 : 3.5,
        value: rating
      }
    });

    setIsWriteModalOpen(false);
    setTitle('');
    setComment('');
    setRating(5);
  };

  return (
    <section className="my-10 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs" id="reviews">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <span className="text-xs font-bold text-[#a67c32] uppercase tracking-wider">
            Verified Guest Feedback
          </span>
          <h3 className="text-xl font-extrabold text-gray-900 tracking-tight mt-0.5">
            Guest Ratings & Experiences
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Based on {hotel.totalReviewsCount.toLocaleString()} verified customer stays at SV Grand Luxury Rooms.
          </p>
        </div>

        <button
          onClick={() => setIsWriteModalOpen(true)}
          className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#a67c32]" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Ratings Metrics Breakdown Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-6 border-b border-gray-100">
        {/* Left score block */}
        <div className="md:col-span-4 flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <div className="p-3 bg-emerald-600 text-white rounded-2xl flex flex-col items-center justify-center shrink-0 w-20 h-20 shadow-xs">
            <div className="text-2xl font-black">{hotel.rating}</div>
            <div className="flex text-amber-300">
              <Star className="w-3.5 h-3.5 fill-amber-300" />
            </div>
          </div>
          <div>
            <div className="text-base font-bold text-gray-900">Very Good</div>
            <p className="text-xs text-gray-500 mt-0.5">
              96% of guests recommend staying at this Townhouse.
            </p>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Genuine Reviews</span>
            </div>
          </div>
        </div>

        {/* Right breakdown sliders */}
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
          {[
            { label: 'Cleanliness & Hygiene', score: 4.8 },
            { label: 'Staff & Reception Service', score: 4.9 },
            { label: 'Prime Location & Connectivity', score: 4.7 },
            { label: 'Amenities & Wi-Fi Speed', score: 4.6 },
            { label: 'Value for Money', score: 4.7 }
          ].map((stat, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <span className="text-gray-600 font-medium truncate">{stat.label}</span>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: `${(stat.score / 5) * 100}%` }}
                  />
                </div>
                <span className="font-bold text-gray-900 w-6 text-right">{stat.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 no-scrollbar">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">
          Stay Type:
        </span>
        {[
          { id: 'all', label: 'All Reviews' },
          { id: 'Couples', label: 'Couples (Local IDs)' },
          { id: 'Business', label: 'Business Stays' },
          { id: 'Solo', label: 'Solo Explorers' },
          { id: 'Family', label: 'Family Stays' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id as any)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === tab.id
                ? 'bg-[#1c1c1c] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-4 pt-2">
        {filteredReviews.map((rev) => (
          <div
            key={rev.id}
            className="p-5 rounded-2xl bg-gray-50/60 border border-gray-200/80 space-y-3"
          >
            {/* Reviewer line */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900">{rev.guestName}</span>
                  {rev.verified && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified Stay</span>
                    </span>
                  )}
                  <span className="text-[11px] font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded-md">
                    {rev.stayType}
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Stayed in <span className="font-semibold text-gray-700">{rev.roomType}</span> &bull;{' '}
                  {rev.date}
                </div>
              </div>

              {/* Star badge */}
              <div className="flex items-center gap-1 bg-emerald-600 text-white font-bold text-xs px-2 py-1 rounded-lg shrink-0">
                <span>{rev.rating}.0</span>
                <Star className="w-3.5 h-3.5 fill-white" />
              </div>
            </div>

            {/* Review Title & Body */}
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-gray-900">{rev.title}</h4>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">{rev.comment}</p>
            </div>

            {/* Hotel Manager Response if exists */}
            {rev.managerResponse && (
              <div className="mt-3 p-3.5 rounded-xl bg-white border border-gray-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#a67c32]">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Response from Hotel Management</span>
                </div>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  &ldquo;{rev.managerResponse.text}&rdquo;
                </p>
                <div className="text-[10px] text-gray-400">
                  {rev.managerResponse.responderName} &bull; {rev.managerResponse.date}
                </div>
              </div>
            )}

            {/* Helpful vote */}
            <div className="flex items-center gap-3 pt-1 text-xs text-gray-500">
              <button
                onClick={() => voteHelpfulReview(rev.id)}
                className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Helpful ({rev.helpfulVotes})</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Write a Review Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-4 sm:px-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-base text-gray-900">Share Your Stay Experience</h3>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Overall Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-gray-700 ml-2">{rating}.0 / 5.0</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Stay Type
                  </label>
                  <select
                    value={stayType}
                    onChange={(e) => setStayType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#a67c32]"
                  >
                    <option value="Business">Business</option>
                    <option value="Couples">Couples</option>
                    <option value="Solo">Solo</option>
                    <option value="Family">Family</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Room Category
                  </label>
                  <select
                    value={roomCategory}
                    onChange={(e) => setRoomCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#a67c32]"
                  >
                    <option value="Townhouse Classic Room">Townhouse Classic Room</option>
                    <option value="Townhouse Deluxe King">Townhouse Deluxe King</option>
                    <option value="Regal Townhouse Suite">Regal Townhouse Suite</option>
                    <option value="Executive Studio with Balcony">Executive Studio with Balcony</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Review Headline
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Peaceful stay, friendly staff and delicious food"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#a67c32]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Detailed Experience
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell other travelers about the room cleanliness, Wi-Fi, food and front desk assistance..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#a67c32]"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#a67c32] hover:bg-[#8e6826] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Publish Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
