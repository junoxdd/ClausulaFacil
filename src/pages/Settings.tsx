import React, { useEffect, useState } from "react";
import { Shield, Trash2, Save, Lock, Settings as SettingsIcon, CheckCircle2 } from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { getUserProfile, updateAutoDeleteSetting, UserProfile } from "../store/user";
import { motion, AnimatePresence } from "motion/react";

export default function Settings() {
  const { user, signInWithGoogle } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [autoDeleteDays, setAutoDeleteDays] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<Error | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        try {
          const p = await getUserProfile();
          setProfile(p);
          setAutoDeleteDays(p.autoDeleteDays || 0);
        } catch (err) {
          setFatalError(err instanceof Error ? err : new Error(String(err)));
        }
      }
      setLoading(false);
    }
    fetchProfile();
  }, [user]);

  if (fatalError) {
    throw fatalError;
  }

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setShowSuccess(false);
    try {
      await updateAutoDeleteSetting(autoDeleteDays);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      if (error instanceof Error && error.message.includes('operationType')) {
        setFatalError(error);
        return;
      }
      alert("Erro ao salvar configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 w-full bg-surface-50 py-12 font-sans relative flex items-center justify-center">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-surface-100 to-transparent pointer-events-none" />
        <div className="container mx-auto px-6 max-w-3xl relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] p-12 shadow-xl border border-surface-200 text-center flex flex-col items-center justify-center"
          >
            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6 text-brand-500 relative">
              <Lock className="w-10 h-10 relative z-10" />
              <div className="absolute inset-0 bg-brand-400 blur-xl opacity-20 rounded-full"></div>
            </div>
            <h2 className="text-2xl font-extrabold text-surface-900 mb-4 tracking-tight">Faça login para ver suas configurações</h2>
            <p className="text-surface-600 mb-8 max-w-md leading-relaxed">Acesse suas configurações de privacidade e retenção de dados.</p>
            <button onClick={signInWithGoogle} className="px-8 py-4 bg-brand-600 text-white rounded-full font-bold hover:bg-brand-700 transition-all premium-shadow hover:premium-shadow-hover hover:-translate-y-0.5">
              Entrar com Google
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-50 font-sans">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-surface-50 py-12 font-sans relative">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-surface-100 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-6 max-w-3xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-surface-200 text-surface-700">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-surface-900 tracking-tight">Configurações</h1>
            <p className="text-surface-600 mt-1">Gerencie suas preferências de privacidade e retenção de dados.</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] p-8 md:p-10 shadow-xl border border-surface-200"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 border border-brand-100">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-surface-900 tracking-tight">Privacidade e Retenção</h2>
              <p className="text-sm text-surface-500 mt-1">Controle por quanto tempo mantemos seus contratos.</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="p-8 bg-surface-50/50 rounded-[1.5rem] border border-surface-200 transition-colors hover:bg-white">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center flex-shrink-0 text-surface-500">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-surface-900 mb-2 tracking-tight">Auto-exclusão de Contratos</h3>
                  <p className="text-surface-600 leading-relaxed mb-6">
                    Para garantir a máxima confidencialidade, você pode configurar o sistema para excluir automaticamente seus contratos analisados após um determinado período.
                  </p>
                  
                  <div className="relative">
                    <select 
                      value={autoDeleteDays}
                      onChange={(e) => setAutoDeleteDays(Number(e.target.value))}
                      className="w-full md:w-auto appearance-none bg-white border border-surface-300 rounded-xl py-3.5 pl-5 pr-12 text-surface-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-sm transition-shadow cursor-pointer"
                    >
                      <option value={0}>Nunca excluir automaticamente (Padrão)</option>
                      <option value={1}>Excluir após 1 dia</option>
                      <option value={7}>Excluir após 7 dias</option>
                      <option value={30}>Excluir após 30 dias</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-surface-500">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-surface-100 gap-4">
              <AnimatePresence>
                {showSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-emerald-600 font-medium flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Configurações salvas com sucesso!
                  </motion.div>
                )}
              </AnimatePresence>
              
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-brand-600 text-white rounded-full font-bold hover:bg-brand-700 transition-all premium-shadow hover:premium-shadow-hover hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Configurações
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
