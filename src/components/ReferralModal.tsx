'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trophy, Copy, Check, Users, Award, Flame, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import AdaptiveShareButton from './AdaptiveShareButton'

type ReferralStats = {
  refCode: string
  referralsCount: number
  rank: number | null
  totalUsers: number
}

type LeaderboardEntry = {
  wallet: string
  username?: string
  displayName?: string
  pfpUrl?: string
  referralsCount: number
  rank: number
}

type ReferralModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  userWallet?: string
}

export default function ReferralModal({ open, onOpenChange, userWallet }: ReferralModalProps) {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [topReferrers, setTopReferrers] = useState<LeaderboardEntry[]>([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      if (!userWallet) {
        console.log('No wallet connected, stopping loading...')
        setLoading(false)
        return
      }

      setLoading(true)
      // Add timeout fallback to prevent infinite loading
      const timeout = setTimeout(() => {
        console.log('API calls timed out, stopping loading...')
        setLoading(false)
      }, 10000) // 10 second timeout

      Promise.all([
        fetchReferralStats(),
        fetchTopReferrers()
      ]).finally(() => {
        clearTimeout(timeout)
        setLoading(false)
      })
    }
  }, [open, userWallet])

  const fetchReferralStats = async () => {
    try {
      const res = await fetch(`/api/referral/stats?wallet=${userWallet}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      } else {
        console.error('Failed to fetch referral stats:', res.status, res.statusText)
        // Set fallback stats so modal isn't empty
        setStats({
          refCode: 'loading...',
          referralsCount: 0,
          rank: null,
          totalUsers: 1
        })
      }
    } catch (error) {
      console.error('Failed to fetch referral stats:', error)
      // Set fallback stats so modal isn't empty
      setStats({
        refCode: 'error',
        referralsCount: 0,
        rank: null,
        totalUsers: 1
      })
    }
  }

  const fetchTopReferrers = async () => {
    try {
      const res = await fetch('/api/referral/leaderboard?limit=10')
      if (res.ok) {
        const data = await res.json()
        setTopReferrers(data.leaderboard || [])
      } else {
        console.error('Failed to fetch top referrers:', res.status, res.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch top referrers:', error)
    }
  }

  const copyReferralLink = async () => {
    console.log('Copy button clicked. Stats:', stats)
    console.log('RefCode:', stats?.refCode)
    
    if (!stats) {
      toast.error('Referral data not loaded yet. Please wait a moment.')
      return
    }
    
    if (!stats.refCode || stats.refCode === 'loading...' || stats.refCode === 'error') {
      toast.error(`Referral code not ready: ${stats.refCode || 'missing'}. Please try again.`)
      return
    }
    
    try {
      const link = `${window.location.origin}?ref=${stats.refCode}`
      console.log('Copying link:', link)
      
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success('Referral link copied! Share this link - every new signup counts toward your leaderboard rank!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      
      // Fallback: Show the link in a toast for manual copy
      const link = `${window.location.origin}?ref=${stats.refCode}`
      toast.error(`Copy failed. Your link: ${link}`)
    }
  }

  const getRewardTier = (rank: number | null) => {
    if (!rank) return { percent: '0.01%', color: 'text-gray-400' }
    if (rank === 1) return { percent: '20%', color: 'text-yellow-400' }
    if (rank <= 5) return { percent: '10%', color: 'text-orange-400' }
    if (rank <= 20) return { percent: '3%', color: 'text-pink-400' }
    if (rank <= 100) return { percent: '0.5%', color: 'text-purple-400' }
    if (rank <= 500) return { percent: '0.1%', color: 'text-blue-400' }
    return { percent: '0.01%', color: 'text-gray-400' }
  }

  const getProjectedReward = (rank: number | null): number => {
    if (!rank || rank > 5000) return 0
    if (rank === 1) return 10_000_000
    if (rank <= 5) return 5_000_000
    if (rank <= 20) return 1_500_000
    if (rank <= 100) return 250_000
    if (rank <= 500) return 50_000
    return 5_000
  }

  const tier = getRewardTier(stats?.rank || null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-black via-purple-950/50 to-black border-purple-500/30 text-white max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black text-center bg-gradient-to-r from-pink-400 via-purple-400 to-teal-400 text-transparent bg-clip-text">
            REFERRAL WARS — 5% POOL
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading stats...</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Your Stats */}
            <div className="bg-gradient-to-br from-purple-900/60 to-pink-900/60 rounded-3xl p-6 border-4 border-pink-500">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-5xl font-black text-white mb-2">
                    {stats?.referralsCount || 0}
                  </p>
                  <p className="text-lg text-gray-300">invites</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400 mb-1">current rank</p>
                  <p className="text-4xl font-black text-yellow-400">
                    #{stats?.rank || '—'}
                  </p>
                </div>
              </div>

              <div className="bg-black/50 rounded-2xl p-4 mb-4">
                <p className="text-xs text-gray-400 mb-2">Your referral link</p>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-sm font-mono text-pink-300 break-all flex-1">
                    {window.location.origin}?ref={stats?.refCode || '...'}
                  </p>
                  <Button
                    onClick={copyReferralLink}
                    size="sm"
                    className="bg-pink-500 hover:bg-pink-600 text-white shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                
                {/* Smart sharing based on platform */}
                <AdaptiveShareButton 
                  referralCode={stats?.refCode}
                  text="Join me in the Referral Wars and earn $ATTENTION tokens! 🔥⚔️"
                />
              </div>

              <div className="bg-black/30 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Your projected reward:</span>
                  <span className="text-2xl font-black text-cyan-400">
                    {getProjectedReward(stats?.rank || null).toLocaleString()} $ATTENTION
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-300">Your reward tier:</span>
                  <span className={`text-xl font-black ${tier.color}`}>
                    {tier.percent}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  of 50,000,000 $ATTENTION pool
                </p>
              </div>

              <p className="text-xs text-gray-400 text-center mt-4">
                Distribution at 40-day airdrop · winner takes most
              </p>
            </div>

            {/* Compact Wars Table Preview - Top 10 */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-pink-400 flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Top 10 Warlords
                </h3>
                <Link href="/referrals">
                  <Button size="sm" className="text-xs bg-purple-600 hover:bg-purple-700 text-white border-purple-500">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Full Wars Table
                  </Button>
                </Link>
              </div>
              
              {/* Compact version of ReferralWarsTable - just top 10 */}
              <div className="bg-black/40 rounded-2xl border-2 border-purple-700 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-900/60 to-pink-900/60 px-4 py-3 text-center">
                  <p className="text-lg font-bold text-pink-400">⚔️ REFERRAL WARS ⚔️</p>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {topReferrers.length > 0 ? (
                    <table className="w-full">
                      <tbody>
                        {topReferrers.slice(0, 10).map((referrer, index) => (
                          <tr
                            key={referrer.wallet}
                            className="border-b border-purple-900/40 hover:bg-purple-900/20"
                          >
                            <td className="px-4 py-3 text-center w-16">
                              {index === 0 && <span className="text-3xl animate-pulse">👑</span>}
                              {index === 1 && <span className="text-3xl">🥈</span>}
                              {index === 2 && <span className="text-3xl">🥉</span>}
                              {index > 2 && <p className="text-xl font-black">#{index + 1}</p>}
                            </td>
                            
                            <td className="px-3 py-3 text-2xl text-orange-500">
                              {'🔥'.repeat(Math.min(4, 5 - index))}
                            </td>
                            
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                                  <span className="text-lg font-black text-white">
                                    {(referrer.username || referrer.wallet.slice(2, 4)).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-lg font-black">
                                  @{referrer.username || `${referrer.wallet.slice(0, 6)}...${referrer.wallet.slice(-4)}`}
                                </p>
                              </div>
                            </td>
                            
                            <td className="px-4 py-3 text-right">
                              <p className="text-lg font-bold text-white">{referrer.referralsCount.toLocaleString()}</p>
                              <p className="text-xs opacity-70">invites</p>
                            </td>
                            
                            <td className="px-4 py-3 text-right">
                              <p className="text-lg font-black text-cyan-400">
                                {getProjectedReward(index + 1).toLocaleString()} $ATTENTION
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-6 text-center">
                      <Trophy className="h-12 w-12 text-purple-500 mx-auto mb-3" />
                      <p className="text-lg font-bold text-white mb-2">Competition Starting Soon!</p>
                      <p className="text-sm text-purple-300">Be among the first 100 to split 50M $ATTENTION</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payout Structure */}
            <div className="bg-black/30 rounded-2xl p-6 border border-purple-500/20">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-400" />
                Payout Structure
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <span className="text-sm font-semibold text-yellow-400">#1</span>
                  <span className="text-sm font-black text-yellow-400">20% (10M $ATTENTION)</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <span className="text-sm font-semibold text-orange-400">#2 - #5</span>
                  <span className="text-sm font-black text-orange-400">10% each (5M $ATTENTION)</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                  <span className="text-sm font-semibold text-pink-400">#6 - #20</span>
                  <span className="text-sm font-black text-pink-400">3% each (1.5M $ATTENTION)</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <span className="text-sm font-semibold text-purple-400">#21 - #100</span>
                  <span className="text-sm font-black text-purple-400">0.5% each (250K $ATTENTION)</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <span className="text-sm font-semibold text-blue-400">#101 - #500</span>
                  <span className="text-sm font-black text-blue-400">0.1% each (50K $ATTENTION)</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-gray-500/10 border border-gray-500/20">
                  <span className="text-sm font-semibold text-gray-400">#501+</span>
                  <span className="text-sm font-black text-gray-400">0.01% each (5K $ATTENTION)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
