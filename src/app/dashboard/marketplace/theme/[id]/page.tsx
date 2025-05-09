'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ThemeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [theme, setTheme] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userReview, setUserReview] = useState({
    rating: 5,
    comment: '',
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchTheme();
      fetchReviews();
    }
  }, [params.id]);

  const fetchTheme = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/generate-theme?action=getThemeById&id=${params.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch theme');
      }
      
      const data = await response.json();
      setTheme(data.theme);
    } catch (error) {
      console.error('Error fetching theme:', error);
      setError('Failed to load theme. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?themeId=${params.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    
    if (!userReview.comment.trim()) {
      setReviewError('Please enter a comment');
      return;
    }
    
    try {
      setSubmittingReview(true);
      
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          themeId: params.id,
          rating: userReview.rating,
          comment: userReview.comment,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }
      
      // Reset form and refresh reviews
      setUserReview({
        rating: 5,
        comment: '',
      });
      
      fetchReviews();
      fetchTheme(); // Refresh theme to get updated rating
    } catch (error: any) {
      console.error('Error submitting review:', error);
      setReviewError(error.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloadLoading(true);
      
      // Log the download
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'download',
          resourceType: 'theme',
          resourceId: params.id,
        }),
      });
      
      // In a real app, we would generate and download the theme files
      // For now, we'll just simulate a download
      setTimeout(() => {
        setDownloadLoading(false);
        alert('Theme downloaded successfully!');
      }, 1000);
    } catch (error) {
      console.error('Error downloading theme:', error);
      setDownloadLoading(false);
      alert('Failed to download theme. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !theme) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error || 'Theme not found'}</span>
        <div className="mt-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{theme.name}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {theme.type} • Created by {theme.creator.name}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button
              onClick={handleDownload}
              disabled={downloadLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {downloadLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="md:col-span-2 p-4 sm:p-6">
              <div className="prose dark:prose-invert max-w-none">
                <h3>Description</h3>
                <p>{theme.description}</p>
                
                <h3 className="mt-6">Preview</h3>
                {theme.previewImage ? (
                  <img
                    src={theme.previewImage}
                    alt={theme.name}
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-lg flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-4 p-6 w-full h-full">
                      <div className="rounded-lg" style={{ backgroundColor: theme.colorPalette.primary }}></div>
                      <div className="rounded-lg" style={{ backgroundColor: theme.colorPalette.secondary }}></div>
                      <div className="rounded-lg" style={{ backgroundColor: theme.colorPalette.background }}></div>
                      <div className="rounded-lg" style={{ backgroundColor: theme.colorPalette.accent || theme.colorPalette.text }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Theme Details</h3>
                  <dl className="mt-2 divide-y divide-gray-200 dark:divide-gray-700">
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Downloads</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{theme.downloads}</dd>
                    </div>
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Rating</dt>
                      <dd className="text-sm text-gray-900 dark:text-white flex items-center">
                        <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="ml-1">{theme.rating.toFixed(1)}</span>
                        <span className="ml-1">({theme.ratingCount})</span>
                      </dd>
                    </div>
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{new Date(theme.createdAt).toLocaleDateString()}</dd>
                    </div>
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Updated</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{new Date(theme.updatedAt).toLocaleDateString()}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Color Palette</h3>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="flex flex-col items-center">
                      <div className="w-full h-12 rounded-md" style={{ backgroundColor: theme.colorPalette.primary }}></div>
                      <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">Primary</span>
                      <span className="text-xs font-mono">{theme.colorPalette.primary}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-full h-12 rounded-md" style={{ backgroundColor: theme.colorPalette.secondary }}></div>
                      <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">Secondary</span>
                      <span className="text-xs font-mono">{theme.colorPalette.secondary}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-full h-12 rounded-md" style={{ backgroundColor: theme.colorPalette.background }}></div>
                      <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">Background</span>
                      <span className="text-xs font-mono">{theme.colorPalette.background}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-full h-12 rounded-md" style={{ backgroundColor: theme.colorPalette.text }}></div>
                      <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">Text</span>
                      <span className="text-xs font-mono">{theme.colorPalette.text}</span>
                    </div>
                    {theme.colorPalette.accent && (
                      <div className="flex flex-col items-center col-span-2">
                        <div className="w-full h-12 rounded-md" style={{ backgroundColor: theme.colorPalette.accent }}></div>
                        <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">Accent</span>
                        <span className="text-xs font-mono">{theme.colorPalette.accent}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Typography</h3>
                  <dl className="mt-2 divide-y divide-gray-200 dark:divide-gray-700">
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Heading Font</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{theme.typography.headingFont}</dd>
                    </div>
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Body Font</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{theme.typography.bodyFont}</dd>
                    </div>
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Code Font</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{theme.typography.codeFont}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reviews Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Reviews</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'} for this theme
          </p>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          {/* Review Form */}
          <form onSubmit={handleReviewSubmit} className="mb-8">
            <div className="space-y-4">
              <div>
                <label htmlFor="rating" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rating
                </label>
                <div className="mt-1 flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserReview({ ...userReview, rating: star })}
                      className="focus:outline-none"
                    >
                      <svg
                        className={`h-6 w-6 ${
                          star <= userReview.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Comment
                </label>
                <div className="mt-1">
                  <textarea
                    id="comment"
                    name="comment"
                    rows={3}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    placeholder="Share your thoughts about this theme..."
                    value={userReview.comment}
                    onChange={(e) => setUserReview({ ...userReview, comment: e.target.value })}
                  ></textarea>
                </div>
              </div>
              
              {reviewError && (
                <div className="text-sm text-red-600 dark:text-red-400">{reviewError}</div>
              )}
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </form>
          
          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400">No reviews yet. Be the first to review this theme!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review._id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-center">
                    <img
                      className="h-10 w-10 rounded-full"
                      src={review.user.image || `https://ui-avatars.com/api/?name=${review.user.name}&background=random`}
                      alt={review.user.name}
                    />
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">{review.user.name}</h4>
                      <div className="mt-1 flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-700 dark:text-gray-300">{review.comment}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
