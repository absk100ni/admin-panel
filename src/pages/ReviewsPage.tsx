import { useEffect, useState } from 'react';
import { Check, RefreshCw, Star, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getReviews, setReviewApproval } from '../services/api';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved'>('pending');
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState('');

  const load = () => {
    setLoading(true);
    getReviews(filter === 'approved')
      .then((response) => setReviews(response.data.reviews || []))
      .catch(() => toast.error('Failed to load reviews'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  const update = async (id: string, approved: boolean) => {
    setWorkingId(id);
    try {
      await setReviewApproval(id, approved);
      toast.success(approved ? 'Review published' : 'Review hidden');
      setReviews((current) => current.filter((review) => review.id !== id));
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Review update failed');
    } finally {
      setWorkingId('');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Product Reviews</h1><p className="text-sm text-gray-500 mt-1">Only approved reviews appear on the storefront.</p></div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>
      <div className="flex gap-2 mb-5">
        <button onClick={() => setFilter('pending')} className={`px-3 py-2 rounded-lg text-sm font-medium ${filter === 'pending' ? 'bg-primary-600 text-white' : 'bg-white border'}`}>Pending</button>
        <button onClick={() => setFilter('approved')} className={`px-3 py-2 rounded-lg text-sm font-medium ${filter === 'approved' ? 'bg-primary-600 text-white' : 'bg-white border'}`}>Published</button>
      </div>
      <div className="space-y-3">
        {loading && <div className="bg-white border rounded-xl p-8 text-center text-sm text-gray-500">Loading reviews...</div>}
        {!loading && reviews.length === 0 && <div className="bg-white border rounded-xl p-8 text-center text-sm text-gray-500">No {filter} reviews.</div>}
        {reviews.map((review) => (
          <article key={review.id} className="bg-white border rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-amber-500" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`w-4 h-4 ${index < review.rating ? 'fill-current' : 'text-gray-200'}`} />)}
                </div>
                <p className="font-semibold text-gray-900 mt-2">{review.title || 'Customer review'}</p>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{review.comment || 'No written comment.'}</p>
                <p className="text-xs text-gray-500 mt-3">{review.user_name || 'Customer'} · Product {review.product_id}{review.is_verified ? ' · Verified purchase' : ''}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {filter === 'pending' && <button onClick={() => update(review.id, true)} disabled={workingId === review.id} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm inline-flex items-center gap-1"><Check className="w-4 h-4" /> Publish</button>}
                {filter === 'approved' && <button onClick={() => update(review.id, false)} disabled={workingId === review.id} className="px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm inline-flex items-center gap-1"><X className="w-4 h-4" /> Hide</button>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
