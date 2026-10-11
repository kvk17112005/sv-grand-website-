import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { Review } from '../../types/hotel';
import {
  Star,
  ShieldCheck,
  CheckCircle,
  XCircle,
  MessageSquare,
  Send,
  Trash2
} from 'lucide-react';

export const ReviewsModeration: React.FC = () => {
  const { reviews, approveReview, replyToReview } = useHotel();
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleSendReply = (reviewId: string) => {
    if (!replyText.trim()) return;
    replyToReview(reviewId, replyText, 'General Manager & Guest Relations');
    setReplyingId(null);
    setReplyText('');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-gray-900">Guest Review Moderation & Responses</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Audit public reviews, approve submissions, and post official management replies.
          </p>
        </div>
        <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-xl">
          {reviews.length} Total Reviews
        </span>
      </div>

      <div className="space-y-3">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className={`bg-white rounded-2xl border p-5 shadow-xs space-y-3 ${
              rev.approved ? 'border-gray-200' : 'border-amber-200 bg-amber-50/20'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-gray-900">{rev.guestName}</span>
                  <span className="text-[11px] font-medium text-gray-500">
                    &bull; {rev.roomType} &bull; {rev.date}
                  </span>
                  <span className="text-[10px] bg-gray-100 font-bold px-2 py-0.5 rounded text-gray-600">
                    {rev.stayType}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-amber-500 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                      }`}
                    />
                  ))}
                  <span className="text-xs font-black text-gray-900 ml-1">{rev.rating}.0</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => approveReview(rev.id, !rev.approved)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                    rev.approved
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {rev.approved ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Published Live</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve Live</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-xs sm:text-sm text-gray-900">{rev.title}</h4>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">{rev.comment}</p>
            </div>

            {/* Existing manager response */}
            {rev.managerResponse ? (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
                <div className="font-bold text-[#a67c32] flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Official Management Response:</span>
                </div>
                <p className="text-gray-700 text-[11px]">&ldquo;{rev.managerResponse.text}&rdquo;</p>
                <div className="text-[10px] text-gray-400">
                  {rev.managerResponse.responderName} &bull; {rev.managerResponse.date}
                </div>
              </div>
            ) : replyingId === rev.id ? (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a courteous reply on behalf of SV Grand Luxury Rooms management..."
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setReplyingId(null)}
                    className="px-3 py-1 border border-gray-300 text-xs font-bold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSendReply(rev.id)}
                    className="px-3 py-1 bg-[#a67c32] text-white text-xs font-bold rounded-lg flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Post Response</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setReplyingId(rev.id)}
                className="text-xs font-bold text-[#a67c32] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Reply as Hotel Manager</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
