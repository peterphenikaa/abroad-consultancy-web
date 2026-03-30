import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Send, Zap, Database, Terminal, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function App() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [interactions, setInteractions] = useState([])
  const [serverStatus, setServerStatus] = useState('Checking...') 
  
  const fetchStatus = async () => {
    try {
      const res = await axios.get('/api/health')
      setServerStatus(res.data.status === 'OK' ? 'Online' : 'Warning')
    } catch {
      setServerStatus('Offline')
    }
  }

  const fetchInteractions = async () => {
    try {
      const res = await axios.get('/api/ai/interactions')
      setInteractions(res.data)
    } catch (err) {
      console.error('Failed to fetch interactions', err)
    }
  }

  useEffect(() => {
    fetchStatus()
    fetchInteractions()
    const interval = setInterval(fetchInteractions, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    try {
      await axios.post('/api/ai/process', {
        userId: 'test-user-123',
        query,
      })
      setQuery('')
      // Give worker some time to process
      setTimeout(fetchInteractions, 1000)
    } catch (err) {
      alert('Failed to send task to queue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-950">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-secondary/10 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-extrabold premium-heading">NexStudy AI</h1>
          <div className="status">
            <span className={cn(
              "status-badge px-4 py-1.5 rounded-full text-sm font-medium",
              serverStatus === 'Online' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
            )}>
              {serverStatus === 'Online' ? '● System Active' : '○ System Offline'}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <section className="glass-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap size={24} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold text-white">Trí tuệ nhân tạo (AI)</h2>
            </div>
            <p className="text-slate-400 mb-8">Hệ thống xử lý bất đồng bộ kết hợp Prisma, BullMQ và Redis để đem lại trải nghiệm mượt mà nhất.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Tôi muốn du học ngành AI tại Mỹ..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={loading}
                  className="input-field"
                />
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Hỏi AI</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          <section className="glass-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-indigo-500/10">
                <Terminal size={24} className="text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Cấu trúc hệ thống</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Database, name: "Prisma ORM", color: "text-emerald-400" },
                { icon: Zap, name: "BullMQ/Redis", color: "text-orange-400" },
                { icon: RefreshCw, name: "Express API", color: "text-primary" },
                { icon: Database, name: "Tailwind UI", color: "text-indigo-400" },
              ].map((tech, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-slate-900/40 border border-slate-700/50">
                  <tech.icon size={16} className={tech.color} />
                  <span className="text-sm font-medium text-slate-300">{tech.name}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="glass-card flex flex-col h-full min-h-[550px]">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Database size={24} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold text-white">Lịch sử từ Supabase</h2>
            </div>
            <button 
              onClick={fetchInteractions} 
              className="p-2 rounded-full hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all"
              title="Làm mới"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            <AnimatePresence initial={false}>
              {interactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                  <Database size={48} className="opacity-20" />
                  <p>Chưa có dữ liệu xử lý.</p>
                </div>
              ) : (
                interactions.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 hover:border-slate-700/80 transition-all group"
                  >
                    <div className="text-sm font-bold text-slate-200 group-hover:text-primary transition-colors mb-2 line-clamp-2">
                      {item.prompt}
                    </div>
                    <div className="text-slate-400 text-sm leading-relaxed mb-3">
                      {item.response}
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  )
}

export default App
