'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Gift, Trophy, Zap, ArrowUpRight, Clock, DollarSign, Target, Users } from 'lucide-react'
import { sdk } from "@farcaster/miniapp-sdk";

import { useAuth } from "@/hooks/useAuth";
import { LiveActivityFeed } from '@/components/LiveActivityFeed';
import { UserPointsLeaderboard } from '@/components/UserPointsLeaderboard';
import FireLeaderboard from '@/components/FireLeaderboard';
import BountyCardBrowse from '@/components/BountyCardBrowse';
import { Flame } from 'lucide-react';
import { BountyProgressBar } from '@/components/BountyProgressBar';
import { useAddMiniApp } from "@/hooks/useAddMiniApp";
import { useQuickAuth } from "@/hooks/useQuickAuth";
import { useIsInFarcaster } from "@/hooks/useIsInFarcaster";
import WalletConnectButton from '@/components/WalletConnectButton';
import ReferralModal from '@/components/ReferralModal';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';

type UserType = {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
}

type AuthError = {
  message: string
  details?: string
}

type UserStats = {
  totalPoints: number
  bountiesClaimed: number
  rank: number
}

type BurnStats = {
  totalBurnedThisWeek: number
  totalCreators: number
  totalPointsCreated: number
}

type RecentBounty = {
  id: number
  creator: string
  castHash: string
  perReplyAmount: number
  claimCount: number
  maxClaims: number
  active: boolean
  pointsPool?: number
  pointsClaimed?: number
  burnAmount?: number
  expiresAt?: number
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentBounties, setRecentBounties] = useState<RecentBounty[]>([])
  const [burnStats, setBurnStats] = useState<BurnStats | null>(null)
  const [referralModalOpen, setReferralModalOpen] = useState(false)

  const { user, isLoading, error: authError, isInFarcaster } = useAuth()
  const { addMiniApp } = useAddMiniApp();
  useQuickAuth(isInFarcaster)
  const { address } = useAccount()
  const searchParams = useSearchParams()
  
  useEffect(() => {
      const tryAddMiniApp = async () => {
        try {
          await addMiniApp()
        } catch (error) {
          console.error('Failed to add mini app:', error)
        }

      }

    

      tryAddMiniApp()
    }, [addMiniApp])
  
  // Fetch user stats when user is authenticated
  useEffect(() => {
    if (user && user.fid) {
      fetchUserStats(user.fid)
    }
  }, [user])

  useEffect(() => {
    setMounted(true)
    
    // Call ready() immediately to tell Farcaster the app is loaded
    try {
      sdk.actions.ready()
    } catch (error) {
      console.log('Farcaster SDK not available:', error)
    }

    fetchActiveBounties()
    fetchBurnStats()

    // Handle referral code from URL
    const refCode = searchParams.get('ref')
    if (refCode && address) {
      registerReferral(address, refCode)
    }
  }, [searchParams, address])

  const registerReferral = async (wallet: string, refCode: string) => {
    try {
      await fetch('/api/referral/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, refCode })
      })
    } catch (error) {
      console.error('Failed to register referral:', error)
    }
  }

  const fetchUserStats = async (fid: number) => {
    try {
      const res = await fetch(`/api/user/${fid}`)
      if (res.ok) {
        const data = await res.json()
        setStats({
          totalPoints: data.totalPoints || 0,
          bountiesClaimed: data.bountiesClaimed || 0,
          rank: data.rank || 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchActiveBounties = async () => {
    try {
      const res = await fetch('/api/bounties?limit=5')
      if (res.ok) {
        const data = await res.json()
        // Filter out expired bounties
        const now = Date.now() / 1000
        const activeBounties = (data.bounties || []).filter((b: RecentBounty & { expiresAt: number }) => b.expiresAt > now)
        setRecentBounties(activeBounties)
      }
    } catch (error) {
      console.error('Failed to fetch bounties:', error)
    }
  }

  const fetchBurnStats = async () => {
    try {
      const res = await fetch('/api/leaderboard/burns?limit=100')
      if (res.ok) {
        const data = await res.json()
        setBurnStats({
          totalBurnedThisWeek: data.totalBurned || 0,
          totalCreators: data.count || 0,
          totalPointsCreated: (data.totalBurned || 0) * 300
        })
      }
    } catch (error) {
      console.error('Failed to fetch burn stats:', error)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-teal-900/20 via-black to-purple-900/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.1),transparent_50%)]"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 p-6 pt-16 max-w-6xl mx-auto">
        {!isInFarcaster && (
          <div className="flex justify-end mb-4">
            <WalletConnectButton onConnect={(address) => console.log('Connected:', address)} />
          </div>
        )}
        
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 backdrop-blur-sm mb-2">
            <Target className="h-4 w-4 text-teal-400" />
            <span className="text-sm text-teal-300">Pay for Engagement, Get Real Growth</span>
          </div>
          
          {user ? (
            <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              {user.pfpUrl && (
                <img
                  src={user.pfpUrl}
                  alt={user.displayName || 'User'}
                  className="h-14 w-14 rounded-full border-2 border-teal-400"
                />
              )}
              <div className="text-left">
                <p className="font-bold text-xl text-white">
                  {user.displayName || `User ${user.fid}`}
                </p>
                <p className="text-sm text-gray-400">
                  @{user.username || `fid:${user.fid}`}
                </p>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-purple-400 text-transparent bg-clip-text">
                  Attention
                </span>
                <br />
                <span className="text-white">Markets</span>
              </h1>
              {isLoading && isInFarcaster && (
                <p className="text-gray-400 text-sm mt-4">Authenticating with Farcaster...</p>
              )}
              {authError && isInFarcaster && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm font-semibold">Authentication Failed</p>
                  <p className="text-red-300 text-xs mt-1">{authError.message}</p>
                  {authError.details && (
                    <p className="text-gray-400 text-xs mt-1">{authError.details}</p>
                  )}
                </div>
              )}
            </>
          )}
          
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Earn $ATTENTION tokens (locked until airdrop). Engage with content, complete tasks, and climb the leaderboard.
          </p>
        </div>

        {user && stats ? (
          <>
            <Card className="mb-8 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border-teal-500/30 backdrop-blur-xl">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Target className="h-5 w-5 text-teal-400" />
                      <p className="text-sm text-gray-400 uppercase tracking-wide">$ATTENTION Earned</p>
                    </div>
                    <p className="text-6xl font-black bg-gradient-to-r from-pink-400 via-purple-400 to-teal-400 text-transparent bg-clip-text">
                      {stats.totalPoints.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">locked until airdrop</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Zap className="h-5 w-5 text-purple-400" />
                      <p className="text-sm text-gray-400 uppercase tracking-wide">Tasks Completed</p>
                    </div>
                    <p className="text-6xl font-black text-purple-400">
                      {stats.bountiesClaimed}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">engagement actions</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Trophy className="h-5 w-5 text-pink-400" />
                      <p className="text-sm text-gray-400 uppercase tracking-wide">Global Rank</p>
                    </div>
                    <p className="text-6xl font-black text-pink-400">
                      #{stats.rank}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">top earner</p>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/10">
                  <Button 
                    className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 hover:from-pink-600 hover:via-purple-600 hover:to-teal-600 text-white font-bold py-6 text-lg"
                    onClick={() => window.location.href = '/leaderboard'}
                  >
                    <Trophy className="mr-2 h-5 w-5" />
                    View Full Leaderboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center space-y-8 mb-12">
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-6 text-center">
                  <Zap className="h-12 w-12 text-teal-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2 text-white">Earn $ATTENTION</h3>
                  <p className="text-sm text-gray-400">
                    Complete engagement tasks and earn $ATTENTION tokens. Transfers locked until airdrop.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-6 text-center">
                  <Target className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2 text-white">Drive Engagement</h3>
                  <p className="text-sm text-gray-400">
                    Users reply, recast, and engage. Your content gets algorithmic boost.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-6 text-center">
                  <Trophy className="h-12 w-12 text-pink-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2 text-white">Climb Rankings</h3>
                  <p className="text-sm text-gray-400">
                    Top performers earn more $ATTENTION. Compete for airdrop allocation.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Hot Right Now - Premium/Boosted Bounties */}
        {recentBounties.length > 0 && (
          <div className="mb-12">
            <h2 className="text-4xl font-black text-center mb-6 flex items-center justify-center gap-3">
              <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                🔥 Hot Right Now
              </span>
            </h2>
            <p className="text-center text-gray-400 mb-6 text-lg">
              Premium boosted bounties · Maximum visibility · Top earning opportunities
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentBounties.slice(0, 6).map((bounty) => {
                const pointsPerAction = bounty.perReplyAmount * 10
                const totalPoints = (bounty.maxClaims) * pointsPerAction
                const claimedPoints = bounty.claimCount * pointsPerAction
                const burnUsd = bounty.perReplyAmount * bounty.maxClaims

                return (
                  <BountyCardBrowse
                    key={bounty.id}
                    bounty={{
                      id: bounty.id,
                      totalPoints: totalPoints,
                      claimedPoints: claimedPoints,
                      burnUsd: burnUsd,
                      expiresAt: bounty.expiresAt || 0,
                      creator: bounty.creator,
                      maxClaims: bounty.maxClaims,
                      claimCount: bounty.claimCount
                    }}
                  />
                )
              })}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <LiveActivityFeed />
          <UserPointsLeaderboard />
        </div>

        <div className="mb-8">
          <FireLeaderboard />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="group bg-gradient-to-br from-teal-500/10 to-cyan-600/10 border-teal-500/20 backdrop-blur-xl hover:border-teal-500/40 transition-all cursor-pointer">
            <CardContent className="p-6" onClick={() => window.location.href = '/bounty/create'}>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                  <Gift className="h-6 w-6 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Create Bounty</h3>
                  <p className="text-sm text-gray-400">Set up your campaign</p>
                </div>
              </div>
              <Button className="w-full bg-teal-500 hover:bg-teal-600 text-black font-semibold">
                Create Campaign
              </Button>
            </CardContent>
          </Card>

          <Card className="group bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-purple-500/20 backdrop-blur-xl hover:border-purple-500/40 transition-all cursor-pointer">
            <CardContent className="p-6" onClick={() => window.location.href = '/bounties'}>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Browse Bounties</h3>
                  <p className="text-sm text-gray-400">Find opportunities</p>
                </div>
              </div>
              <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold">
                Explore Bounties
              </Button>
            </CardContent>
          </Card>

          <Card className="group bg-gradient-to-br from-pink-500/10 to-purple-600/10 border-pink-500/20 backdrop-blur-xl hover:border-pink-500/40 transition-all cursor-pointer">
            <CardContent className="p-6" onClick={() => window.location.href = '/leaderboard'}>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-pink-500/20 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Leaderboard</h3>
                  <p className="text-sm text-gray-400">Top earners</p>
                </div>
              </div>
              <Button className="w-full bg-pink-500 hover:bg-pink-600 text-black font-semibold">
                View Rankings
              </Button>
            </CardContent>
          </Card>

          <Card className="group bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-purple-500/20 backdrop-blur-xl hover:border-purple-500/40 transition-all cursor-pointer">
            <CardContent className="p-6" onClick={() => setReferralModalOpen(true)}>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Referral Wars</h3>
                  <p className="text-sm text-gray-400">Earn 5% pool rewards</p>
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold">
                View Referrals
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Referral Modal */}
        <ReferralModal 
          open={referralModalOpen} 
          onOpenChange={setReferralModalOpen}
          userWallet={address}
        />
      </div>
    </div>
  )
}
