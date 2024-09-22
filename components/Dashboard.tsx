"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { Instagram, Plus, Home, LogOut, Loader2, Video, Link as LinkIcon, Menu } from 'lucide-react'
import { supabase } from "@/lib/supabaseClient"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Video {
  id: number
  title: string
  status: 'Completed' | 'Processing' | 'Inspiration Needed'
  color: string
}

interface InspoLink {
  id: string
  reel_url: string
}

const mockUserVideos = [
  { id: 1, title: 'Summer Vibes', status: 'Completed', color: 'bg-blue-200' },
  { id: 2, title: 'Urban Explorer', status: 'Processing', color: 'bg-green-200' },
  { id: 3, title: 'Neon Nights', status: 'Inspiration Needed', color: 'bg-purple-200' },
]

const VideoCard = ({ title, status, color }: { title: string; status: string; color: string }) => (
  <Card className="overflow-hidden">
    <div className={`w-full h-32 ${color}`} />
    <CardContent className="p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="flex justify-between items-center">
        <span className={`text-sm ${
          status === 'Completed' ? 'text-green-500' : 
          status === 'Processing' ? 'text-yellow-500' : 'text-red-500'
        }`}>
          {status}
        </span>
        <Button variant="outline" size="sm">View</Button>
      </div>
    </CardContent>
  </Card>
)

const InspoLinkCard = ({ url }: { url: string }) => {
  const formattedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`

  return (
    <Card className="flex items-center justify-between p-4">
      <div className="flex items-center">
        <Instagram className="mr-2 text-pink-500" size={20} />
        <a
          href={formattedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm truncate max-w-[200px] text-blue-600 hover:underline"
        >
          {url}
        </a>
      </div>
    </Card>
  )
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [newInspoLink, setNewInspoLink] = useState('')
  const [inspoLinks, setInspoLinks] = useState<InspoLink[]>([])
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const fetchInspoLinks = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('reels')
          .select('id, reel_url')
          .eq('user_id', user.uid)
          .order('id', { ascending: false })

        if (error) {
          throw error
        }

        if (isMounted) {
          setInspoLinks(data || [])
        }
      } catch (error) {
        console.error('Error fetching inspiration links:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchInspoLinks()
    }

    return () => {
      isMounted = false
    }
  }, [user])

  useEffect(() => {
    let isMounted = true
    if (user !== undefined && isMounted) {
      setIsLoading(false)
    }
    return () => {
      isMounted = false
    }
  }, [user])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Failed to sign out', error)
    }
  }

  const handleAddInspoLink = () => {
    console.log('Adding new inspiration link:', newInspoLink)
    setNewInspoLink('')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-black text-black dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold">AI Video Dashboard</h1>
          <div className="flex items-center space-x-2">
            <div className="hidden sm:block space-x-2">
              <Button variant="outline" onClick={() => router.push('/')}>
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push('/')}>
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Video className="w-6 h-6 mr-2" />
                Your Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mockUserVideos.map(video => (
                  <VideoCard key={video.id} title={video.title} status={video.status} color={video.color} />
                ))}
              </div>
              <div className="mt-6">
                <Button onClick={() => router.push('/generate')} className="w-full">
                  Generate New Video
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LinkIcon className="w-6 h-6 mr-2" />
                Inspiration Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-4">
                <Input
                  placeholder="Paste Instagram link"
                  value={newInspoLink}
                  onChange={(e) => setNewInspoLink(e.target.value)}
                />
                <Button onClick={handleAddInspoLink}>
                  <Plus size={20} />
                </Button>
              </div>
              <div className="space-y-4">
                {inspoLinks.map(link => (
                  <InspoLinkCard key={link.id} url={link.reel_url} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}