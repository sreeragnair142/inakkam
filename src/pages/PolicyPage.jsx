import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import api from '../utils/api';

const PolicyPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/pages/${slug}`);
        setPage(res.data.page);
      } catch (err) {
        setError('Page not found or unavailable.');
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchPage();
  }, [slug]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] to-[#1a0a15]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#D51659]" />
            <h1 className="text-sm font-bold text-white uppercase tracking-wider">
              {page?.title || 'Policy'}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#D51659] animate-spin" />
            <p className="text-white/50 text-sm mt-4">Loading...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 text-sm">{error}</p>
          </div>
        ) : (
          <div
            className="prose prose-invert prose-sm max-w-none
              prose-headings:text-white prose-headings:font-bold
              prose-p:text-white/70 prose-p:leading-relaxed
              prose-li:text-white/70
              prose-a:text-[#D51659] prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white
              prose-hr:border-white/10"
            dangerouslySetInnerHTML={{ __html: page?.content || '' }}
          />
        )}

        {page && (
          <div className="mt-12 pt-6 border-t border-white/10">
            <p className="text-white/30 text-xs text-center">
              Last updated: {new Date(page.updatedAt).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PolicyPage;
