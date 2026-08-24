import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Search,
  Loader2,
  RefreshCw,
  Briefcase,
  Code2,
  Globe2,
  TrendingUp,
  Building2,
  MapPin,
  DollarSign,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Database,
  Radio
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts'

// Determine API base URL with fallback
const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, '')
  : 'http://localhost:5000'

// Color palette for skill bars and pills
const SKILL_COLORS = [
  '#38bdf8', // sky-400
  '#818cf8', // indigo-400
  '#a855f7', // purple-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#6366f1', // indigo-500
  '#3b82f6', // blue-500
  '#14b8a6', // teal-500
  '#8b5cf6', // violet-500
  '#f43f5e'  // rose-500
]

export default function App() {
  // Scraper execution states
  const [isScraping, setIsScraping] = useState(false)
  const [scrapeNotification, setScrapeNotification] = useState(null)

  // Analytics data state
  const [analytics, setAnalytics] = useState({
    totalJobs: 0,
    remoteCount: 0,
    nonRemoteCount: 0,
    skills: []
  })
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  // Jobs feed state
  const [jobs, setJobs] = useState([])
  const [totalJobsCount, setTotalJobsCount] = useState(0)
  const [jobsLoading, setJobsLoading] = useState(true)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [selectedTech, setSelectedTech] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  // Fetch Analytics from backend
  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true)
      const res = await fetch(`${API_BASE}/api/jobs/analytics`)
      if (!res.ok) throw new Error(`Status ${res.status}`)
      const json = await res.json()
      if (json.success && json.data) {
        setAnalytics(json.data)
      }
    } catch (err) {
      console.warn('Analytics fetch error:', err.message)
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  // Fetch Jobs from backend with query parameters
  const fetchJobs = useCallback(async () => {
    try {
      setJobsLoading(true)
      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('limit', pageSize.toString())

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim())
      }
      if (remoteOnly) {
        params.append('is_remote', 'true')
      }
      if (selectedTech) {
        params.append('tech_stack', selectedTech)
      }

      const res = await fetch(`${API_BASE}/api/jobs?${params.toString()}`)
      if (!res.ok) throw new Error(`Status ${res.status}`)
      const json = await res.json()

      if (json.success && Array.isArray(json.data)) {
        setJobs(json.data)
        setTotalJobsCount(json.total || json.data.length)
      }
    } catch (err) {
      console.warn('Jobs fetch error:', err.message)
    } finally {
      setJobsLoading(false)
    }
  }, [currentPage, pageSize, searchTerm, remoteOnly, selectedTech])

  // Initial load
  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // Handle Scraper Trigger
  const handleTriggerScrape = async () => {
    try {
      setIsScraping(true)
      setScrapeNotification({
        type: 'info',
        message: 'Triggering Bright Data collector and polling snapshot data... This may take a moment.'
      })

      const res = await fetch(`${API_BASE}/api/jobs/trigger-scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Scraping task failed.')
      }

      const stats = json.data
      setScrapeNotification({
        type: 'success',
        message: `Scrape completed! ${stats?.insertedCount ?? 0} jobs added, ${stats?.updatedCount ?? 0} updated.`
      })

      // Refresh data
      setCurrentPage(1)
      await Promise.all([fetchAnalytics(), fetchJobs()])
    } catch (err) {
      setScrapeNotification({
        type: 'error',
        message: `Scrape error: ${err.message}`
      })
    } finally {
      setIsScraping(false)
    }
  }

  // Calculate Computed Metrics
  const metrics = useMemo(() => {
    const total = analytics.totalJobs || 0
    const remote = analytics.remoteCount || 0
    const uniqueSkills = analytics.skills ? analytics.skills.length : 0
    const remoteRatio = total > 0 ? Math.round((remote / total) * 100) : 0
    const topSkill = analytics.skills && analytics.skills[0] ? analytics.skills[0] : null

    return { total, remote, uniqueSkills, remoteRatio, topSkill }
  }, [analytics])

  // Top 10 skills for chart visualization
  const chartData = useMemo(() => {
    if (!analytics.skills || analytics.skills.length === 0) return []
    return analytics.skills.slice(0, 10).map((item) => ({
      name: item.skill,
      count: item.count
    }))
  }, [analytics.skills])

  // Total pages
  const totalPages = Math.ceil(totalJobsCount / pageSize) || 1

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-[#0d1322]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-0 min-h-16 sm:h-20 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 p-[1px] flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <div className="h-full w-full bg-[#0d1322] rounded-[11px] flex items-center justify-center">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white truncate">DevPulse</h1>
                <span className="px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 whitespace-nowrap">
                  Intelligence Engine
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-[200px] sm:max-w-sm md:max-w-none">
                Real-Time Developer Skill Demand & Live Remote Hiring Insights
              </p>
            </div>
          </div>

          {/* Trigger & Refresh Controls */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                fetchAnalytics()
                fetchJobs()
              }}
              title="Refresh Data"
              className="p-2 sm:p-2.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${jobsLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleTriggerScrape}
              disabled={isScraping}
              className={`relative flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 shadow-md whitespace-nowrap ${
                isScraping
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/25 hover:shadow-lg hover:shadow-cyan-500/30 active:scale-[0.98]'
              }`}
            >
              {isScraping ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400 shrink-0" />
                  <span className="truncate">Scraping RemoteOK...</span>
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 text-cyan-200 shrink-0" />
                  <span className="truncate">Trigger Bright Data Scrape</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Notification Toast/Banner */}
      {scrapeNotification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
          <div
            className={`p-3.5 sm:p-4 rounded-xl border flex items-start sm:items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in slide-in-from-top-2 ${
              scrapeNotification.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : scrapeNotification.type === 'error'
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300'
            }`}
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              {scrapeNotification.type === 'success' && <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 shrink-0" />}
              {scrapeNotification.type === 'error' && <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-rose-400 shrink-0" />}
              {scrapeNotification.type === 'info' && <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 animate-spin shrink-0" />}
              <span className="break-words">{scrapeNotification.message}</span>
            </div>
            <button
              onClick={() => setScrapeNotification(null)}
              className="text-xs opacity-70 hover:opacity-100 uppercase tracking-wider font-semibold ml-2 shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 flex-1 w-full">
        {/* Summary Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Total Jobs */}
          <div className="bg-[#111827]/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Jobs Scraped</span>
              <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Briefcase className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {analyticsLoading ? '...' : metrics.total.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-slate-500" />
              <span>Upserted in MongoDB</span>
            </p>
          </div>

          {/* Unique Skills */}
          <div className="bg-[#111827]/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unique Tech Skills</span>
              <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Code2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {analyticsLoading ? '...' : metrics.uniqueSkills.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-slate-500" />
              <span>Normalized Tech Stacks</span>
            </p>
          </div>

          {/* Remote Ratio */}
          <div className="bg-[#111827]/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Remote Job Ratio</span>
              <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Globe2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {analyticsLoading ? '...' : `${metrics.remoteRatio}%`}
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-emerald-400" />
              <span>{analytics.remoteCount} Remote Listings</span>
            </p>
          </div>

          {/* Top In-Demand Skill */}
          <div className="bg-[#111827]/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden group hover:border-purple-500/30 transition-colors">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">#1 Demand Skill</span>
              <div className="p-2 sm:p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate">
              {analyticsLoading ? '...' : metrics.topSkill ? metrics.topSkill.skill : 'N/A'}
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <span className="text-purple-400 font-semibold">{metrics.topSkill?.count || 0}</span>
              <span>mentions in listings</span>
            </p>
          </div>
        </section>

        {/* Analytics Chart Section */}
        <section className="bg-[#111827]/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Top Skill Demand Breakdown</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Frequency analysis of requested technologies across indexed jobs
              </p>
            </div>
            {selectedTech && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Filtered by:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {selectedTech}
                  <button
                    onClick={() => setSelectedTech('')}
                    className="hover:text-white font-bold ml-1 text-slate-400"
                  >
                    &times;
                  </button>
                </span>
              </div>
            )}
          </div>

          <div className="w-full overflow-x-auto pb-2">
            <div className="h-64 sm:h-80 min-w-[300px] sm:min-w-[480px] md:min-w-full">
              {analyticsLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-500 text-sm">
                  <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
                  <span>Loading skill analytics...</span>
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
                  <Layers className="h-8 w-8 text-slate-600" />
                  <span>No skill analytics available yet. Trigger a scrape to populate data.</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
                    onClick={(state) => {
                      if (state && state.activePayload && state.activePayload[0]) {
                        const clickedSkill = state.activePayload[0].payload.name
                        setSelectedTech(clickedSkill === selectedTech ? '' : clickedSkill)
                        setCurrentPage(1)
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(56, 189, 248, 0.06)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          const pct = metrics.total > 0 ? Math.round((data.count / metrics.total) * 100) : 0
                          return (
                            <div className="bg-[#0f172a] border border-slate-700 p-3 rounded-xl shadow-xl text-xs sm:text-sm">
                              <div className="font-semibold text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                                {data.name}
                              </div>
                              <div className="text-slate-300 mt-1">
                                Demand: <span className="font-bold text-cyan-300">{data.count}</span> jobs ({pct}% of total)
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1">Click bar to filter job list</div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="count" radius={[5, 5, 0, 0]} className="cursor-pointer">
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.name === selectedTech ? '#38bdf8' : SKILL_COLORS[index % SKILL_COLORS.length]}
                          opacity={selectedTech && entry.name !== selectedTech ? 0.45 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        {/* Searchable Job Feed Section */}
        <section className="bg-[#111827]/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400 shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Live Job Opportunities</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Showing {jobs.length} of {totalJobsCount} matching developer listings
              </p>
            </div>

            {/* Responsive Filters bar: Stack vertically on mobile, horizontal on sm+ */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
              {/* Search input */}
              <div className="relative w-full sm:w-64 md:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search title, company, or tech..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-9.5 pr-8 py-2 bg-[#090d16] border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
                  >
                    &times;
                  </button>
                )}
              </div>

              {/* Remote Only Toggle & Reset */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setRemoteOnly(!remoteOnly)
                    setCurrentPage(1)
                  }}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    remoteOnly
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-[#090d16] text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <Globe2 className="h-3.5 w-3.5" />
                  <span>Remote Only</span>
                </button>

                {(searchTerm || remoteOnly || selectedTech) && (
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setRemoteOnly(false)
                      setSelectedTech('')
                      setCurrentPage(1)
                    }}
                    className="text-xs text-slate-400 hover:text-rose-400 transition-colors px-2 py-2 whitespace-nowrap"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Job Feed Table with smooth horizontal scroll on phones */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 w-full">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800 bg-[#0d1322]/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 min-w-[220px]">Job Title & Role</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Company</th>
                  <th className="py-3.5 px-4 min-w-[120px]">Location</th>
                  <th className="py-3.5 px-4 min-w-[110px]">Salary</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Tech Stack</th>
                  <th className="py-3.5 px-4 text-right min-w-[90px]">Scraped</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
                {jobsLoading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
                        <span>Loading job opportunities...</span>
                      </div>
                    </td>
                  </tr>
                ) : jobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Briefcase className="h-8 w-8 text-slate-600" />
                        <p className="text-slate-400 font-medium">No matching jobs found</p>
                        <p className="text-xs text-slate-500 max-w-sm">
                          Try adjusting your search criteria or click 'Trigger Bright Data Scrape' to fetch fresh listings.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr
                      key={job._id || `${job.job_title}-${job.company_name}`}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Job Title & Remote status */}
                      <td className="py-3.5 sm:py-4 px-4 align-top">
                        <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors break-words">
                          {job.job_title}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          {job.is_remote ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Remote
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-400">
                              On-site
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Company Name */}
                      <td className="py-3.5 sm:py-4 px-4 align-top text-slate-300 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span className="break-words">{job.company_name}</span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 sm:py-4 px-4 align-top text-slate-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{job.location || 'Remote'}</span>
                        </div>
                      </td>

                      {/* Salary */}
                      <td className="py-3.5 sm:py-4 px-4 align-top text-xs whitespace-nowrap">
                        {job.salary && job.salary !== 'Not specified' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 font-medium border border-emerald-500/20">
                            <DollarSign className="h-3 w-3 text-emerald-400" />
                            {job.salary}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Competitive</span>
                        )}
                      </td>

                      {/* Tech Stack Pills */}
                      <td className="py-3.5 sm:py-4 px-4 align-top">
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {job.tech_stack && job.tech_stack.length > 0 ? (
                            job.tech_stack.map((tech, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  setSelectedTech(tech === selectedTech ? '' : tech)
                                  setCurrentPage(1)
                                }}
                                className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium transition-all ${
                                  tech === selectedTech
                                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                                    : 'bg-[#1e293b] text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                                }`}
                              >
                                {tech}
                              </button>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500 italic">General Dev</span>
                          )}
                        </div>
                      </td>

                      {/* Scraped Date */}
                      <td className="py-3.5 sm:py-4 px-4 align-top text-right text-xs text-slate-500 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Calendar className="h-3 w-3 text-slate-600" />
                          <span>
                            {job.scrapedAt
                              ? new Date(job.scrapedAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric'
                                })
                              : 'Recent'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Responsive Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-400">
                Page <span className="font-semibold text-white">{currentPage}</span> of{' '}
                <span className="font-semibold text-white">{totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || jobsLoading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#0d1322] hover:bg-slate-800 text-xs font-medium text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || jobsLoading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#0d1322] hover:bg-slate-800 text-xs font-medium text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Modern Responsive Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0d1322]/80 py-6 text-center text-xs text-slate-500 px-4">
        <p>DevPulse &bull; Intelligent Job Market Analytics Engine &bull; Powered by Bright Data DCA & MongoDB</p>
      </footer>
    </div>
  )
}
