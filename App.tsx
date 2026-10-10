import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import { Play, Pause, SkipNext, SkipPrevious, Volume2, VolumeX, Search, Heart, ListMusic, Shuffle, Repeat, Settings, Plus, ChevronLeft } from 'lucide-react'
import './App.css'

// Types
interface Track {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  durationSeconds: number
  videoId: string
}

interface PlayerState {
  currentTime: number
  duration: number
  isPlaying: boolean
  volume: number
}

// 3D Background Component
const Background3D = () => {
  const groupRef = useRef<THREE.Group>(null)
  const timeRef = useRef(0)
  const particlesRef = useRef<THREE.Points | null>(null)
  const waveRef = useRef<THREE.Mesh | null>(null)

  useEffect(() => {
    if (!groupRef.current) return

    // Create particle system
    const particleCount = 2000
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const colors = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      const radius = 5 + Math.random() * 15
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      sizes[i] = Math.random() * 2 + 0.5

      const hue = 0.6 + Math.random() * 0.2 // Purple to pink range
      const color = new THREE.Color().setHSL(hue, 0.8, 0.6)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      velocities[i * 3] = (Math.random() - 0.5) * 0.002
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.002
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))

    const material = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    particlesRef.current = new THREE.Points(geometry, material)
    groupRef.current.add(particlesRef.current)

    // Create wave ring
    const waveGeometry = new THREE.RingGeometry(8, 8.5, 64)
    const waveMaterial = new THREE.MeshBasicMaterial({
      color: 0xaa3bff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    })
    waveRef.current = new THREE.Mesh(waveGeometry, waveMaterial)
    waveRef.current.rotation.x = -Math.PI / 2
    groupRef.current.add(waveRef.current)

    // Animation loop
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      timeRef.current += 0.01

      if (particlesRef.current) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
        const velocities = particlesRef.current.geometry.attributes.velocity.array as Float32Array

        for (let i = 0; i < particleCount; i++) {
          positions[i * 3] += velocities[i * 3]
          positions[i * 3 + 1] += velocities[i * 3 + 1]
          positions[i * 3 + 2] += velocities[i * 3 + 2]

          // Add subtle wave motion
          positions[i * 3 + 1] += Math.sin(timeRef.current + i * 0.1) * 0.005

          // Reset particles that go too far
          const dist = Math.sqrt(
            positions[i * 3] ** 2 +
            positions[i * 3 + 1] ** 2 +
            positions[i * 3 + 2] ** 2
          )
          if (dist > 25) {
            const radius = 5 + Math.random() * 10
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
            positions[i * 3 + 2] = radius * Math.cos(phi)
          }
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true
        particlesRef.current.rotation.y += 0.0002
      }

      if (waveRef.current) {
        waveRef.current.scale.setScalar(1 + Math.sin(timeRef.current * 2) * 0.1)
        ;(waveRef.current.material as THREE.MeshBasicMaterial).opacity = 0.2 + Math.sin(timeRef.current * 3) * 0.1
        waveRef.current.rotation.z += 0.001
      }
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      if (particlesRef.current) {
        groupRef.current?.remove(particlesRef.current)
        particlesRef.current.geometry.dispose()
        ;(particlesRef.current.material as THREE.Material).dispose()
      }
      if (waveRef.current) {
        groupRef.current?.remove(waveRef.current)
        waveRef.current.geometry.dispose()
        ;(waveRef.current.material as THREE.Material).dispose()
      }
    }
  }, [])

  return (
    <group ref={groupRef}>
      <Stars radius={50} depth={100} count={3000} factor={4} saturation={0} />
    </group>
  )
}

// Audio Visualizer Component - Simulated for YouTube
const AudioVisualizer = ({ isPlaying, progress }: { isPlaying: boolean; progress: number }) => {
  const barsRef = useRef<THREE.Mesh[]>([])
  const groupRef = useRef<THREE.Group>(null)
  const timeRef = useRef(0)
  const seedRef = useRef(Math.random() * 1000)

  useEffect(() => {
    if (!groupRef.current) return

    const barCount = 64
    const barGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.15)

    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2
      const radius = 3
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius

      const hue = 0.7 + (i / barCount) * 0.2
      const color = new THREE.Color().setHSL(hue, 0.9, 0.6)
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      })

      const mesh = new THREE.Mesh(barGeometry, material)
      mesh.position.set(x, 0, z)
      mesh.lookAt(0, 0, 0)
      mesh.rotateY(Math.PI)
      groupRef.current.add(mesh)
      barsRef.current.push(mesh)
    }

    return () => {
      barsRef.current.forEach(bar => {
        groupRef.current?.remove(bar)
        bar.geometry.dispose()
        ;(bar.material as THREE.Material).dispose()
      })
      barsRef.current = []
    }
  }, [])

  // Simulated audio visualization based on progress and playing state
  useEffect(() => {
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      timeRef.current += 0.05

      barsRef.current.forEach((bar, i) => {
        if (!isPlaying) {
          bar.scale.y = THREE.MathUtils.lerp(bar.scale.y, 0.1, 0.1)
          bar.position.y = bar.scale.y / 2
          const hue = 0.7 + (i / barsRef.current.length) * 0.2
          ;(bar.material as THREE.MeshBasicMaterial).color.setHSL(hue, 0.9, 0.6)
          ;(bar.material as THREE.MeshBasicMaterial).opacity = 0.5
          return
        }

        // Generate pseudo-random but consistent values based on time and position
        const freq = 0.5 + (i / barsRef.current.length) * 2
        const phase = timeRef.current * freq + seedRef.current + i * 0.5
        const baseValue = Math.sin(phase) * 0.5 + 0.5
        
        // Add some variation based on progress through the track
        const progressInfluence = Math.sin(progress * Math.PI * 4 + i * 0.3) * 0.3 + 0.7
        const value = baseValue * progressInfluence * (0.5 + Math.random() * 0.5)
        
        const targetHeight = 0.1 + value * 3
        bar.scale.y = THREE.MathUtils.lerp(bar.scale.y, targetHeight, 0.3)
        bar.position.y = bar.scale.y / 2

        const intensity = value
        const hue = 0.7 + intensity * 0.2
        ;(bar.material as THREE.MeshBasicMaterial).color.setHSL(hue, 0.9, 0.5 + intensity * 0.5)
        ;(bar.material as THREE.MeshBasicMaterial).opacity = 0.5 + intensity * 0.5
      })
    }
    animate()
    return () => cancelAnimationFrame(animationId)
  }, [isPlaying, progress])

  return <group ref={groupRef} rotation={[-0.3, 0, 0]} />
}

// Floating Orb Component
const FloatingOrb = ({ position, color, size = 1, speed = 1 }: { position: [number, number, number]; color: string; size?: number; speed?: number }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const timeRef = useRef(0)

  useEffect(() => {
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      timeRef.current += 0.005 * speed
      if (meshRef.current) {
        meshRef.current.position.y = position[1] + Math.sin(timeRef.current) * 0.3
        meshRef.current.position.x = position[0] + Math.cos(timeRef.current * 0.7) * 0.2
        meshRef.current.rotation.y += 0.002 * speed
        meshRef.current.scale.setScalar(size * (1 + Math.sin(timeRef.current * 2) * 0.05))
      }
    }
    animate()
    return () => cancelAnimationFrame(animationId)
  }, [position, speed, size])

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      receiveShadow
    >
      <sphereGeometry args={[0.8 * size, 32, 32]} />
      <meshPhysicalMaterial
        color={color}
        metalness={0}
        roughness={0.1}
        transmission={0.9}
        thickness={0.5}
        clearcoat={1}
        clearcoatRoughness={0.1}
        ior={1.5}
      />
    </mesh>
  )
}

// Toast Notification Component
const Toast = ({ message, type = 'info', onClose }: { message: string; type?: 'info' | 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = type === 'success' ? 'rgba(0, 200, 100, 0.9)' : 
                  type === 'error' ? 'rgba(255, 60, 60, 0.9)' : 
                  'rgba(170, 59, 255, 0.9)'
  
  return (
    <div 
      className="toast"
      style={{ background: bgColor }}
      onClick={onClose}
      role="alert"
    >
      {message}
    </div>
  )
}

// Main Player Component
const MusicPlayer = () => {
  const [tracks, setTracks] = useState<Track[]>([])
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [showPlaylist, setShowPlaylist] = useState(true)
  const [isShuffled, setIsShuffled] = useState(false)
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off')
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set())
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    volume: 0.7
  })
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'info' | 'success' | 'error' }>>([])
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const playerRef = useRef<HTMLIFrameElement>(null)
  const ytPlayerRef = useRef<any>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Format time
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Show toast notification
  const showToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  // Play track
  const playTrack = useCallback((track: Track) => {
    setCurrentTrack(track)
    setIsPlaying(true)
    setPlayerState(prev => ({ ...prev, currentTime: 0, isPlaying: true }))
    
    if (ytPlayerRef.current) {
      ytPlayerRef.current.loadVideoById(track.videoId)
      ytPlayerRef.current.setVolume(volume * 100)
    } else if (playerRef.current) {
      playerRef.current.src = `https://www.youtube.com/embed/${track.videoId}?autoplay=1&enablejsapi=1&origin=${window.location.origin}`
    }
    showToast(`Now playing: ${track.title}`, 'success')
  }, [volume, showToast])

  const nextTrack = useCallback(() => {
    const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id)
    let nextIndex = currentIndex + 1
    if (nextIndex >= tracks.length) nextIndex = 0
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * tracks.length)
    }
    playTrack(tracks[nextIndex])
  }, [tracks, currentTrack, isShuffled, playTrack])

  const prevTrack = useCallback(() => {
    const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id)
    let prevIndex = currentIndex - 1
    if (prevIndex < 0) prevIndex = tracks.length - 1
    playTrack(tracks[prevIndex])
  }, [tracks, currentTrack, playTrack])

  // Handle track ended
  const handleTrackEnded = useCallback(() => {
    if (repeatMode === 'one') {
      ytPlayerRef.current?.seekTo(0)
      ytPlayerRef.current?.playVideo()
    } else {
      nextTrack()
    }
  }, [repeatMode, nextTrack])

  const togglePlay = useCallback(() => {
    if (ytPlayerRef.current) {
      if (isPlaying) {
        ytPlayerRef.current.pauseVideo()
      } else {
        ytPlayerRef.current.playVideo()
      }
    } else if (playerRef.current && currentTrack) {
      playerRef.current.contentWindow?.postMessage(
        isPlaying ? '{"event":"command","func":"pauseVideo","args":""}' : '{"event":"command","func":"playVideo","args":""}', 
        '*'
      )
      setIsPlaying(!isPlaying)
    }
  }, [isPlaying, currentTrack])

  const toggleLike = useCallback((trackId: string) => {
    setLikedTracks(prev => {
      const next = new Set(prev)
      if (next.has(trackId)) {
        next.delete(trackId)
        showToast('Removed from favorites', 'info')
      } else {
        next.add(trackId)
        showToast('Added to favorites', 'success')
      }
      return next
    })
  }, [showToast])

  // Initialize YouTube API
  useEffect(() => {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    ;(window as any).onYouTubeIframeAPIReady = () => {
      console.log('YouTube API ready')
      initializePlayer()
    }

    return () => {
      const script = document.querySelector('script[src*="youtube.com/iframe_api"]')
      script?.remove()
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [])

  // Initialize YouTube Player
  const initializePlayer = useCallback(() => {
    if (!playerRef.current || !(window as any).YT) return

    if (ytPlayerRef.current) {
      ytPlayerRef.current.destroy()
    }

    const videoId = currentTrack?.videoId || 'fHI8X4OXluQ'
    
    ytPlayerRef.current = new (window as any).YT.Player('youtube-player', {
      videoId,
      playerVars: {
        autoplay: isPlaying ? 1 : 0,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        origin: window.location.origin
      },
      events: {
        onReady: (event: any) => {
          console.log('Player ready')
          setIsPlayerReady(true)
          event.target.setVolume(volume * 100)
          if (isPlaying) {
            event.target.playVideo()
          }
          // Start progress tracking
          startProgressTracking()
        },
        onStateChange: (event: any) => {
          const state = event.data
          const YT = (window as any).YT
          if (state === YT.PlayerState.PLAYING) {
            setIsPlaying(true)
            setPlayerState(prev => ({ ...prev, isPlaying: true }))
            startProgressTracking()
          } else if (state === YT.PlayerState.PAUSED) {
            setIsPlaying(false)
            setPlayerState(prev => ({ ...prev, isPlaying: false }))
            stopProgressTracking()
          } else if (state === YT.PlayerState.ENDED) {
            handleTrackEnded()
          } else if (state === YT.PlayerState.BUFFERING) {
            showToast('Buffering...', 'info')
          }
        },
        onError: (event: any) => {
          console.error('YouTube player error:', event.data)
          showToast('Playback error. Trying next track...', 'error')
          nextTrack()
        }
      }
    })
  }, [currentTrack, isPlaying, volume, showToast])

  // Re-initialize player when track changes
  useEffect(() => {
    if ((window as any).YT && isPlayerReady) {
      initializePlayer()
    }
  }, [currentTrack, isPlayerReady, initializePlayer])

  // Progress tracking
  const startProgressTracking = useCallback(() => {
    stopProgressTracking()
    progressIntervalRef.current = setInterval(() => {
      if (ytPlayerRef.current && isPlaying) {
        const currentTime = ytPlayerRef.current.getCurrentTime()
        const duration = ytPlayerRef.current.getDuration()
        setPlayerState(prev => ({ ...prev, currentTime, duration }))
      }
    }, 500)
  }, [isPlaying])

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }, [])

  // Load default tracks
  useEffect(() => {
    const defaultTracks: Track[] = [
      { id: '1', title: 'Blinding Lights', artist: 'The Weeknd', thumbnail: 'https://i.ytimg.com/vi/fHI8X4OXluQ/maxresdefault.jpg', duration: '3:20', durationSeconds: 200, videoId: 'fHI8X4OXluQ' },
      { id: '2', title: 'Shape of You', artist: 'Ed Sheeran', thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/maxresdefault.jpg', duration: '3:53', durationSeconds: 233, videoId: 'JGwWNGJdvx8' },
      { id: '3', title: 'Levitating', artist: 'Dua Lipa', thumbnail: 'https://i.ytimg.com/vi/TUVcZfQe-Kw/maxresdefault.jpg', duration: '3:23', durationSeconds: 203, videoId: 'TUVcZfQe-Kw' },
      { id: '4', title: 'Bad Guy', artist: 'Billie Eilish', thumbnail: 'https://i.ytimg.com/vi/DyDfgMOUjCI/maxresdefault.jpg', duration: '3:14', durationSeconds: 194, videoId: 'DyDfgMOUjCI' },
      { id: '5', title: 'Watermelon Sugar', artist: 'Harry Styles', thumbnail: 'https://i.ytimg.com/vi/E07s5ZYygMg/maxresdefault.jpg', duration: '2:54', durationSeconds: 174, videoId: 'E07s5ZYygMg' },
      { id: '6', title: 'Good 4 U', artist: 'Olivia Rodrigo', thumbnail: 'https://i.ytimg.com/vi/gJLIiF15wjQ/maxresdefault.jpg', duration: '2:58', durationSeconds: 178, videoId: 'gJLIiF15wjQ' },
      { id: '7', title: 'Stay', artist: 'The Kid LAROI, Justin Bieber', thumbnail: 'https://i.ytimg.com/vi/kTJczUoc26U/maxresdefault.jpg', duration: '2:21', durationSeconds: 141, videoId: 'kTJczUoc26U' },
      { id: '8', title: 'As It Was', artist: 'Harry Styles', thumbnail: 'https://i.ytimg.com/vi/H5v3kku4y6Q/maxresdefault.jpg', duration: '2:47', durationSeconds: 167, videoId: 'H5v3kku4y6Q' },
    ]
    setTracks(defaultTracks)
    setCurrentTrack(defaultTracks[0])
  }, [])

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    // Mock search results - in production, use YouTube Data API
    const mockResults: Track[] = [
      { id: 's1', title: `${query} - Official Video`, artist: 'Various Artists', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', duration: '3:30', durationSeconds: 210, videoId: 'dQw4w9WgXcQ' },
      { id: 's2', title: `${query} (Lyrics)`, artist: 'Various Artists', thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/maxresdefault.jpg', duration: '4:15', durationSeconds: 255, videoId: '9bZkp7q19f0' },
      { id: 's3', title: `${query} - Live Performance`, artist: 'Various Artists', thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/maxresdefault.jpg', duration: '3:45', durationSeconds: 225, videoId: 'kJQP7kiw5Fk' },
    ]
    setSearchResults(mockResults)
  }, [])

  useEffect(() => {
    const debounce = setTimeout(() => handleSearch(searchQuery), 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, handleSearch])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in search
      if (e.target instanceof HTMLInputElement) return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowRight':
          e.preventDefault()
          if (e.shiftKey) nextTrack()
          else seekRelative(10)
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (e.shiftKey) prevTrack()
          else seekRelative(-10)
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolume(Math.min(1, volume + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume(Math.max(0, volume - 0.1))
          break
        case 'KeyM':
          setVolume(volume > 0 ? 0 : 0.7)
          break
        case 'KeyL':
          if (currentTrack) toggleLike(currentTrack.id)
          break
        case 'KeyS':
          setIsShuffled(!isShuffled)
          showToast(`Shuffle ${isShuffled ? 'off' : 'on'}`, 'info')
          break
        case 'KeyR':
          const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one']
          const nextMode = modes[(modes.indexOf(repeatMode) + 1) % 3]
          setRepeatMode(nextMode)
          showToast(`Repeat: ${nextMode}`, 'info')
          break
        case 'KeyF':
          toggleFullscreen()
          break
        case 'Escape':
          if (showSearch) setShowSearch(false)
          if (showPlaylist) setShowPlaylist(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, volume, currentTrack, isShuffled, repeatMode, nextTrack, prevTrack, togglePlay, toggleLike, showToast, showSearch, showPlaylist])

  const seekRelative = useCallback((seconds: number) => {
    if (ytPlayerRef.current) {
      const newTime = Math.max(0, Math.min(playerState.duration, playerState.currentTime + seconds))
      ytPlayerRef.current.seekTo(newTime, true)
    }
  }, [playerState])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ytPlayerRef.current || !currentTrack) return
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const seekTime = percent * (playerState.duration || currentTrack.durationSeconds)
    ytPlayerRef.current.seekTo(seekTime, true)
    setPlayerState(prev => ({ ...prev, currentTime: seekTime }))
  }, [currentTrack, playerState.duration])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    setPlayerState(prev => ({ ...prev, volume: vol }))
    ytPlayerRef.current?.setVolume(vol * 100)
  }, [])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }, [isFullscreen])

  const progress = useMemo(() => {
    if (!playerState.duration) return 0
    return playerState.currentTime / playerState.duration
  }, [playerState.currentTime, playerState.duration])

  const progressPercent = `${progress * 100}%`

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgressTracking()
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy()
      }
    }
  }, [stopProgressTracking])

  return (
    <div className="music-player">
      {/* 3D Background */}
      <div className="bg-3d">
        <Canvas
          camera={{ position: [0, 0, 25], fov: 50 }}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        >
          <color attach="background" args={['#0a0a0f']} />
          <fog attach="fog" args={['#0a0a0f', 10, 50]} />
          <ambientLight intensity={0.5} color="#ffffff" />
          <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
          <pointLight position={[-5, 5, -5]} intensity={0.5} color="#aa3bff" />
          <pointLight position={[5, -5, 5]} intensity={0.5} color="#00d4ff" />
          <Background3D />
          <FloatingOrb position={[-8, 2, -5]} color="#aa3bff" size={1.5} speed={1} />
          <FloatingOrb position={[8, -2, -8]} color="#00d4ff" size={1.2} speed={1.3} />
          <FloatingOrb position={[0, 5, -10]} color="#ff2d75" size={1} speed={0.8} />
          <AudioVisualizer isPlaying={isPlaying} progress={progress} />
        </Canvas>
      </div>

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          />
        ))}
      </div>

      {/* Main UI */}
      <div className="player-ui">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="logo">
            <svg viewBox="0 0 32 32" width="32" height="32" fill="none">
              <circle cx="16" cy="16" r="16" fill="url(#grad)" />
              <path d="M16 8c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8z" stroke="white" strokeWidth="2" fill="none" />
              <path d="M16 12v8M12 16h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="#aa3bff" />
                  <stop offset="100%" stopColor="#00d4ff" />
                </linearGradient>
              </defs>
            </svg>
            <span>Nuosic</span>
          </div>
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search music... (Press / to focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setShowSearch(false)
              }}
              className="search-input"
            />
            {showSearch && searchQuery && (
              <div className="search-results">
                {searchResults.map(track => (
                  <div key={track.id} className="search-result-item" onClick={() => { playTrack(track); setShowSearch(false); setSearchQuery(''); }}>
                    <img src={track.thumbnail} alt={track.title} />
                    <div>
                      <span>{track.title}</span>
                      <small>{track.artist}</small>
                    </div>
                  </div>
                ))}
                {searchResults.length === 0 && (
                  <div className="search-result-item" style={{ justifyContent: 'center', color: 'var(--text-muted)' }}>
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="top-actions">
            <button className="icon-btn" title="Settings (⌘+,)"><Settings size={20} /></button>
            <button className="icon-btn" title="Toggle Playlist (P)"><ListMusic size={20} /></button>
            <button className="icon-btn" title="Fullscreen (F)" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content">
          {/* Sidebar / Playlist */}
          <aside className={`sidebar ${showPlaylist ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
              <h2>Now Playing</h2>
              <button className="icon-btn" onClick={() => setShowPlaylist(!showPlaylist)} aria-label={showPlaylist ? 'Hide playlist' : 'Show playlist'}>
                {showPlaylist ? <ChevronLeft size={20} /> : <ListMusic size={20} />}
              </button>
            </div>
            <div className="playlist">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className={`track-item ${currentTrack?.id === track.id ? 'playing' : ''} ${likedTracks.has(track.id) ? 'liked' : ''}`}
                  onClick={() => playTrack(track)}
                  title={`${track.title} by ${track.artist}`}
                >
                  <div className="track-index">
                    {currentTrack?.id === track.id && isPlaying ? (
                      <div className="equalizer">
                        <span></span><span></span><span></span>
                      </div>
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <img src={track.thumbnail} alt={track.title} className="track-thumb" loading="lazy" />
                  <div className="track-info">
                    <span className="track-title">{track.title}</span>
                    <span className="track-artist">{track.artist}</span>
                  </div>
                  <div className="track-actions">
                    <button className="icon-btn small" onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }} aria-label={likedTracks.has(track.id) ? 'Remove from favorites' : 'Add to favorites'}>
                      <Heart className={likedTracks.has(track.id) ? 'filled' : ''} size={16} fill={likedTracks.has(track.id) ? '#ff2d75' : 'none'} stroke={likedTracks.has(track.id) ? '#ff2d75' : 'currentColor'} />
                    </button>
                    <span className="track-duration">{track.duration}</span>
                  </div>
                </div>
              ))}
              {tracks.length === 0 && (
                <div className="empty-playlist">
                  <ListMusic size={48} style={{ opacity: 0.3 }} />
                  <p>No tracks in playlist</p>
                  <small>Search for music to add tracks</small>
                </div>
              )}
            </div>
          </aside>

          {/* Now Playing Area */}
          <section className="now-playing">
            {currentTrack && (
              <div className="track-display">
                <div className="album-art-container">
                  <img
                    src={currentTrack.thumbnail}
                    alt={currentTrack.title}
                    className="album-art"
                    loading="eager"
                  />
                  <div className="album-glow" />
                </div>
                <div className="track-meta">
                  <h1 className="track-title-large">{currentTrack.title}</h1>
                  <p className="track-artist-large">{currentTrack.artist}</p>
                  <div className="track-badges">
                    <span className="badge premium">PREMIUM</span>
                    <span className="badge hq">HIGH QUALITY</span>
                  </div>
                </div>
                <div className="track-actions-large">
                  <button className="icon-btn large" title="Add to playlist"><Plus size={20} /></button>
                  <button className="icon-btn large liked" title="Like (L)" onClick={() => toggleLike(currentTrack.id)}>
                    <Heart className={likedTracks.has(currentTrack.id) ? 'filled' : ''} size={22} fill={likedTracks.has(currentTrack.id) ? '#ff2d75' : 'none'} stroke={likedTracks.has(currentTrack.id) ? '#ff2d75' : 'currentColor'} />
                  </button>
                  <button className="icon-btn large" title="Share"><Share size={20} /></button>
                  <button className="icon-btn large" title="More"><MoreHorizontal size={20} /></button>
                </div>
              </div>
            )}

            {/* 3D Visualizer Canvas */}
            <div className="visualizer-3d">
              <Canvas
                camera={{ position: [0, 2, 8], fov: 45 }}
                style={{ width: '100%', height: '100%' }}
              >
                <color attach="background" args={['transparent']} />
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 10, 5]} intensity={1} />
                <AudioVisualizer isPlaying={isPlaying} progress={progress} />
              </Canvas>
            </div>

            {/* Progress Bar */}
            <div className="progress-container">
              <span className="time-current">{formatTime(playerState.currentTime)}</span>
              <div 
                className="progress-bar" 
                onClick={handleProgressClick}
                role="slider"
                aria-label="Playback progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') seekRelative(5)
                  else if (e.key === 'ArrowLeft') seekRelative(-5)
                }}
              >
                <div className="progress-fill" style={{ width: progressPercent }} />
                <div className="progress-handle" style={{ transform: `translate(-50%, -50%) ${progress > 0 ? 'scale(1)' : 'scale(0)'}` }} />
              </div>
              <span className="time-total">{formatTime(playerState.duration || (currentTrack?.durationSeconds || 0))}</span>
            </div>

            {/* Controls */}
            <div className="controls">
              <div className="control-group left">
                <button className="icon-btn" title="Shuffle (S)" onClick={() => { setIsShuffled(!isShuffled); showToast(`Shuffle ${!isShuffled ? 'on' : 'off'}`, 'info'); }}>
                  <Shuffle size={20} className={isShuffled ? 'active' : ''} />
                </button>
                <button className="icon-btn" title="Previous (Shift+←)" onClick={prevTrack}><SkipPrevious size={24} /></button>
              </div>
              <div className="control-group center">
                <button className="play-btn" onClick={togglePlay} aria-label={isPlaying ? 'Pause (Space)' : 'Play (Space)'}>
                  {isPlaying ? <Pause size={32} /> : <Play size={32} />}
                </button>
              </div>
              <div className="control-group right">
                <button className="icon-btn" title="Next (Shift+→)" onClick={nextTrack}><SkipNext size={24} /></button>
                <button className="icon-btn" title={`Repeat: ${repeatMode} (R)`} onClick={() => { const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one']; setRepeatMode(modes[(modes.indexOf(repeatMode) + 1) % 3]); showToast(`Repeat: ${modes[(modes.indexOf(repeatMode) + 1) % 3]}`, 'info'); }}>
                  <Repeat size={20} className={repeatMode !== 'off' ? 'active' : ''} />
                </button>
              </div>
            </div>

            {/* Volume */}
            <div className="volume-control">
              <button 
                className="icon-btn"
                onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
                aria-label={`Volume: ${Math.round(volume * 100)}% (M to mute)`}
              >
                {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
                aria-label="Volume"
              />
            </div>
          </section>
        </main>

        {/* YouTube Player (Hidden) */}
        <iframe
          ref={playerRef}
          id="youtube-player"
          src={`https://www.youtube.com/embed/${currentTrack?.videoId || 'fHI8X4OXluQ'}?enablejsapi=1&origin=${window.location.origin}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title="YouTube Player"
          style={{ display: 'none' }}
        />
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="shortcuts-hint" aria-hidden="true">
        <kbd>Space</kbd> Play/Pause
        <kbd>←/→</kbd> Seek
        <kbd>Shift+←/→</kbd> Prev/Next
        <kbd>↑/↓</kbd> Volume
        <kbd>M</kbd> Mute
        <kbd>L</kbd> Like
        <kbd>S</kbd> Shuffle
        <kbd>R</kbd> Repeat
        <kbd>F</kbd> Fullscreen
        <kbd>/</kbd> Search
      </div>
    </div>
  )
}

// Missing icons
const Share = ({ size = 20, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)

const MoreHorizontal = ({ size = 20, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
)

const Maximize2 = ({ size = 20, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 3h6v6" />
    <path d="M9 21H3v-6" />
    <path d="M21 3H9" />
    <path d="M3 21V9" />
  </svg>
)

const Minimize2 = ({ size = 20, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 3h6v6" />
    <path d="M21 21H15v-6" />
    <path d="M3 21V15" />
    <path d="M21 3H15" />
  </svg>
)

export default MusicPlayer