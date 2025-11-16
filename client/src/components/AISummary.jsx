import { useState, useEffect } from 'react'
import { FiZap, FiRefreshCw, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import { generateAISummary, getAISummary } from '../services/api'

function AISummary({ listingId }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [generatedAt, setGeneratedAt] = useState(null)

  useEffect(() => {
    loadSummary()
  }, [listingId])

  const loadSummary = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAISummary(listingId)
      setSummary(data.summary)
      setGeneratedAt(data.generated_at)
    } catch (err) {
      // Summary doesn't exist yet, that's okay
      if (err.response?.status !== 404) {
        setError('Failed to load summary')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const data = await generateAISummary(listingId)
      setSummary(data.summary)
      setGeneratedAt(new Date().toISOString())
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate summary')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="card p-6 rounded-2xl border border-eggshell-400 animate-pulse">
        <div className="h-6 bg-eggshell-300 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-eggshell-300 rounded w-full mb-2"></div>
        <div className="h-4 bg-eggshell-300 rounded w-5/6"></div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="card p-6 rounded-2xl border border-eggshell-400">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-charcoal-900 flex items-center gap-2">
            <FiZap className="text-matcha-500" size={24} />
            AI-Powered Summary
          </h3>
        </div>
        <p className="text-charcoal-600 mb-4">
          No AI summary available yet. Generate one to see key insights from all reviews!
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-matcha-500 hover:bg-matcha-600 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
        >
          {generating ? (
            <>
              <FiRefreshCw className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FiZap />
              Generate AI Summary
            </>
          )}
        </button>
        {error && (
          <p className="mt-3 text-red-600 text-sm">{error}</p>
        )}
      </div>
    )
  }

  return (
    <div className="card p-6 rounded-2xl border border-eggshell-400 bg-gradient-to-br from-matcha-50 to-eggshell-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-charcoal-900 flex items-center gap-2">
          <FiZap className="text-matcha-500" size={24} />
          AI-Powered Summary
        </h3>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="text-sm bg-eggshell-200 hover:bg-eggshell-300 text-charcoal-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 border border-eggshell-400 disabled:opacity-50 flex items-center gap-2"
        >
          <FiRefreshCw className={generating ? 'animate-spin' : ''} size={14} />
          {generating ? 'Regenerating...' : 'Regenerate'}
        </button>
      </div>

      {/* Keywords */}
      {summary.keywords && summary.keywords.length > 0 && (
        <div className="mb-4 flex gap-2 flex-wrap">
          {summary.keywords.map((keyword, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-matcha-500 text-white rounded-full text-sm font-bold"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}

      {/* Summary Text */}
      {summary.summary && (
        <p className="text-charcoal-800 mb-4 leading-relaxed font-medium">
          {summary.summary}
        </p>
      )}

      {/* Pros and Cons */}
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        {/* Pros */}
        {summary.pros && summary.pros.length > 0 && (
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
              <FiCheckCircle className="text-green-600" />
              Pros
            </h4>
            <ul className="space-y-2">
              {summary.pros.map((pro, idx) => (
                <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cons */}
        {summary.cons && summary.cons.length > 0 && (
          <div className="bg-red-50 p-4 rounded-xl border border-red-200">
            <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
              <FiXCircle className="text-red-600" />
              Cons
            </h4>
            <ul className="space-y-2">
              {summary.cons.map((con, idx) => (
                <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">✗</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Generated timestamp */}
      {generatedAt && (
        <p className="text-xs text-charcoal-500 mt-4 text-center italic">
          Generated {new Date(generatedAt).toLocaleString()}
        </p>
      )}

      {error && (
        <p className="mt-3 text-red-600 text-sm text-center">{error}</p>
      )}
    </div>
  )
}

export default AISummary
