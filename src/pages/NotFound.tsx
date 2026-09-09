import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPinOff, ArrowLeft, Home, Search } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useTheme } from '../contexts/ThemeContext';

export default function NotFound() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-300 ${isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-slate-50 text-slate-900'} bg-[radial-gradient(circle_at_top_right,rgba(11,130,255,0.05),transparent_50%)]`}>
      <div className="flex flex-col items-center mb-12">
        <Link to="/" className="flex flex-col group">
          <Logo size="h-9" showTagline showRegistered />
        </Link>
      </div>

      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative inline-block mb-8"
        >
          <div className="absolute inset-0 bg-[#0b82ff] blur-3xl opacity-10 rounded-full animate-pulse" />
          <div className={`relative w-32 h-32 rounded-3xl shadow-xl flex items-center justify-center text-[#0b82ff] mx-auto border transition-colors ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-slate-100'}`}>
            <Search size={48} strokeWidth={1.5} className="animate-bounce" />
            <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${isDarkMode ? 'bg-zinc-800' : 'bg-black'}`}>
              <MapPinOff size={20} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className={`text-7xl font-black tracking-tighter mb-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>404</h1>
          <h2 className={`text-xl font-black uppercase tracking-tight mb-4 ${isDarkMode ? 'text-zinc-200' : 'text-slate-900'}`}>Página não encontrada</h2>
          <p className={`text-sm font-medium leading-relaxed mb-10 max-w-[280px] mx-auto uppercase tracking-tighter ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
            O conteúdo que você está procurando não existe ou foi removido do servidor da beend.tech.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(-1)}
            className={`flex items-center justify-center gap-2 px-8 py-4 border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm ${isDarkMode ? 'bg-zinc-900 border-white/5 text-zinc-400 hover:bg-zinc-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <ArrowLeft size={16} />
            Voltar
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl ${isDarkMode ? 'bg-blue-600 shadow-blue-500/20' : 'bg-black shadow-black/20'}`}
          >
            <Home size={16} />
            Ir para Início
          </motion.button>
        </div>

        <div className={`mt-16 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-700' : 'text-slate-300'}`}>
          beend.tech v2.0 - smart solution
        </div>
      </div>
    </div>
  );
}
