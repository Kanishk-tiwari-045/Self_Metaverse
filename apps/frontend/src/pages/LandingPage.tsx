import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Sparkles, Users, Globe, Zap } from 'lucide-react'

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <Sparkles className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">2D Metaverse</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex space-x-4"
          >
            <Link to="/signin" className="bg-slate-700/50 backdrop-blur-sm text-white px-6 py-2 rounded-lg hover:bg-slate-600/50 transition-all border border-slate-600">
              Sign In
            </Link>
            <Link to="/signup" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all shadow-lg">
              Get Started
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight"
          >
            Enter the
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"> Future </span>
            of Social Interaction
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Connect, collaborate, and create in immersive 2D virtual spaces. 
            Build your digital presence and explore infinite possibilities with friends and colleagues.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to="/signup" className="bg-blue-600 text-white text-lg px-8 py-4 rounded-lg hover:bg-blue-700 transition-all shadow-lg">
              Start Your Journey
            </Link>
            <button className="bg-slate-700/50 backdrop-blur-sm text-white text-lg px-8 py-4 rounded-lg hover:bg-slate-600/50 transition-all border border-slate-600">
              Watch Demo
            </button>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid md:grid-cols-3 gap-8 mt-32"
        >
          <div className="glass-effect p-8 text-center">
            <Users className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">Real-time Collaboration</h3>
            <p className="text-white/70">
              Work together with teammates in shared virtual spaces with instant communication and seamless interaction.
            </p>
          </div>

          <div className="glass-effect p-8 text-center">
            <Globe className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">Infinite Worlds</h3>
            <p className="text-white/70">
              Create and explore unlimited virtual environments tailored to your needs and imagination.
            </p>
          </div>

          <div className="glass-effect p-8 text-center">
            <Zap className="w-12 h-12 text-pink-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">Lightning Fast</h3>
            <p className="text-white/70">
              Experience smooth, lag-free interactions with our optimized real-time communication system.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-white/60">
            <p>&copy; 2025 MetaVerse. Built for the future of digital collaboration.</p>
          </div>
        </div>
      </div>
    </div>
  )
}