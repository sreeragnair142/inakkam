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
    <div className="min-h-screen bg-[#FCFAF2] text-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border-none"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#D51659]/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-[#D51659]" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {page?.title || 'Legal & Policy'}
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">Inakkam Official Documentation</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/swipe')}
            className="hidden sm:inline-flex px-4 py-2 rounded-full text-xs font-bold text-[#D51659] bg-[#D51659]/10 hover:bg-[#D51659]/20 transition-colors cursor-pointer border-none"
          >
            Back to App
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28">
            <Loader2 className="w-10 h-10 text-[#D51659] animate-spin" />
            <p className="text-slate-500 font-medium text-sm mt-4">Loading document...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">{error}</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">The requested policy page is not published yet or is currently undergoing review.</p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer border-none"
            >
              Go Back
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs">
            <div className="mb-8 pb-6 border-b border-slate-100">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {page?.title}
              </h2>
              {page?.updatedAt && (
                <p className="text-xs text-slate-400 font-medium mt-1.5">
                  Last updated: {new Date(page.updatedAt).toLocaleDateString('en-IN', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </p>
              )}
            </div>

            <div
              className="policy-content text-slate-700 leading-relaxed text-sm sm:text-base space-y-4
                [&>h2]:text-lg sm:[&>h2]:text-xl [&>h2]:font-extrabold [&>h2]:text-slate-900 [&>h2]:mt-8 [&>h2]:mb-3 [&>h2]:tracking-tight
                [&>h3]:text-base sm:[&>h3]:text-lg [&>h3]:font-bold [&>h3]:text-slate-900 [&>h3]:mt-6 [&>h3]:mb-2
                [&>p]:text-slate-600 [&>p]:leading-relaxed [&>p]:mb-4
                [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 [&>ul]:mb-4 [&>ul]:text-slate-600
                [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-2 [&>ol]:mb-4 [&>ol]:text-slate-600
                [&>strong]:text-slate-900 [&>strong]:font-bold
                [&>a]:text-[#D51659] [&>a]:font-semibold [&>a]:underline hover:[&>a]:text-[#b44ddc]"
              dangerouslySetInnerHTML={{ __html: page?.content || '' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PolicyPage;
