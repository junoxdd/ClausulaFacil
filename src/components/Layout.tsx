import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, X, LogOut, User, Settings as SettingsIcon, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { useAuth } from "./AuthProvider";
import { motion, AnimatePresence } from "motion/react";
import { Logo } from "./Logo";
import { useTheme } from "./ThemeProvider";

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const { user, signInWithGoogle, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-50 font-sans text-surface-900 selection:bg-brand-500 selection:text-white">
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-surface-200 print:hidden transition-all duration-300">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <Logo iconClassName="w-10 h-10" textClassName="text-2xl" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/dashboard" className="text-sm font-medium text-surface-600 hover:text-brand-600 transition-colors">
              Nova Análise
            </Link>
            <Link to="/compare" className="text-sm font-medium text-surface-600 hover:text-brand-600 transition-colors">
              Comparar
            </Link>
            <Link to="/history" className="text-sm font-medium text-surface-600 hover:text-brand-600 transition-colors">
              Histórico
            </Link>
            <Link to="/pricing" className="text-sm font-medium text-surface-600 hover:text-brand-600 transition-colors">
              Planos
            </Link>
            
            <button
              onClick={toggleTheme}
              className="p-2 text-surface-400 hover:text-brand-500 transition-colors rounded-full hover:bg-surface-100"
              title="Alternar Tema"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="flex items-center gap-5 pl-4 border-l border-surface-200">
                <Link to="/settings" className="text-surface-400 hover:text-brand-500 transition-colors" title="Configurações">
                  <SettingsIcon className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3 text-sm font-medium text-surface-700">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-9 h-9 rounded-full ring-2 ring-white shadow-sm" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-9 h-9 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  <span className="hidden lg:inline">{user.displayName}</span>
                </div>
                <button onClick={logout} className="text-surface-400 hover:text-red-500 transition-colors" title="Sair">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button onClick={signInWithGoogle} className="text-sm font-semibold bg-brand-600 text-white px-6 py-2.5 rounded-full hover:bg-brand-700 transition-all premium-shadow hover:premium-shadow-hover hover:-translate-y-0.5">
                Entrar
              </button>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-surface-400 hover:text-brand-500 transition-colors rounded-full hover:bg-surface-100"
              title="Alternar Tema"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {user && (
              <button onClick={logout} className="text-surface-500 hover:text-red-500 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            )}
            <button 
              className="p-2 text-surface-600 hover:bg-surface-100 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-surface-200 bg-white overflow-hidden"
            >
              <div className="px-6 py-6 flex flex-col gap-5">
                <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-surface-700">Nova Análise</Link>
                <Link to="/compare" onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-surface-700">Comparar Versões</Link>
                <Link to="/history" onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-surface-700">Histórico</Link>
                <Link to="/pricing" onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-surface-700">Planos</Link>
                {user && (
                  <Link to="/settings" onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-surface-700">Configurações</Link>
                )}
                {!user && (
                  <button onClick={() => { signInWithGoogle(); setIsMenuOpen(false); }} className="mt-2 text-base font-semibold bg-brand-600 text-white px-5 py-3 rounded-xl hover:bg-brand-700 transition-colors shadow-sm w-full text-center">
                    Entrar com Google
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 flex flex-col relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {isLanding && (
        <footer className="border-t border-surface-200 bg-white py-12 mt-auto print:hidden">
          <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo iconClassName="w-6 h-6" textClassName="text-lg" />
            <p className="text-surface-500 text-sm">
              &copy; {new Date().getFullYear()} Cláusula Fácil. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
