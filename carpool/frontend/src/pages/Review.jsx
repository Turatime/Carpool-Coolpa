import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import StarRating from '../components/StarRating';

export default function Review() {
  const { tripId } = useParams();
  const [reviews, setReviews]   = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [total, setTotal]       = useState(0);
  const [form, setForm]         = useState({ rating: 5, comment: '' });
  const [error,   setError]     = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/trips/${tripId}/reviews`);
      setReviews(res.data.reviews);
      setAvgRating(res.data.average_rating);
      setTotal(res.data.total_reviews);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchReviews(); }, [tripId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      await api.post('/reviews', { trip_id: Number(tripId), ...form });
      setSuccess('Review submitted! Thank you.');
      setForm({ rating: 5, comment: '' });
      fetchReviews();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-slate-800 mb-2">Trip Reviews</h1>
      <p className="text-slate-500 mb-8">Trip #{tripId}</p>

      {/* Average rating summary */}
      <div className="card mb-8 flex items-center gap-6">
        <div className="text-center">
          <p className="font-display text-5xl font-bold text-slate-800">{avgRating || '—'}</p>
          <StarRating rating={avgRating} size="md" />
          <p className="text-sm text-slate-500 mt-1">{total} review{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex-1 h-px bg-slate-100" />
        <div className="text-slate-400 text-sm text-right">
          {total === 0 ? 'Be the first to review!' : 'Average passenger rating'}
        </div>
      </div>

      {/* Submit review form */}
      <div className="card mb-8">
        <h2 className="font-display font-bold text-lg text-slate-800 mb-4">Leave a Review</h2>
        <p className="text-sm text-slate-500 mb-4">
          You can only review a trip after your payment is completed.
        </p>

        {error   && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
        {success && <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Your Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button" key={star}
                  onClick={() => setForm({ ...form, rating: star })}
                  className={`text-3xl transition-transform hover:scale-110 ${
                    star <= form.rating ? 'text-amber-400' : 'text-slate-200'
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="ml-2 text-sm text-slate-500 self-center">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][form.rating]}
              </span>
            </div>
          </div>
          <div>
            <label className="label">Comment (optional)</label>
            <textarea
              className="input resize-none h-28"
              placeholder="Share your experience…"
              value={form.comment}
              onChange={e => setForm({ ...form, comment: e.target.value })}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Submitting…' : '⭐ Submit Review'}
          </button>
        </form>
      </div>

      {/* Reviews list */}
      <div>
        <h2 className="font-display font-bold text-lg text-slate-800 mb-4">All Reviews</h2>
        {reviews.length === 0 ? (
          <div className="card text-center py-12 text-slate-400">
            <p className="text-4xl mb-3">💬</p>
            <p>No reviews yet for this trip.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r.review_id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center font-bold text-brand-700 text-sm">
                      {r.reviewer_name?.[0]?.toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-800">{r.reviewer_name}</span>
                  </div>
                  <StarRating rating={r.rating} />
                </div>
                {r.comment && <p className="text-sm text-slate-600 mt-2">{r.comment}</p>}
                <p className="text-xs text-slate-400 mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
