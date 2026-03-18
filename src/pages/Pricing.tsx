import { CheckCircle2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

export default function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { user, signInWithGoogle } = useAuth();

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      signInWithGoogle();
      return;
    }

    setLoadingPlan(planId);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId: user.uid,
          successUrl: `${window.location.origin}/dashboard`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Error subscribing:", error);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="flex-1 w-full bg-surface-50 py-24 font-sans relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-400/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-sm font-bold mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Preços Transparentes
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-surface-900 mb-6 tracking-tight text-balance"
          >
            Invista na segurança dos seus contratos
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-surface-600 max-w-2xl mx-auto leading-relaxed"
          >
            Escolha o plano ideal para suas necessidades. Cancele a qualquer momento.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-8 rounded-[2rem] shadow-sm border border-surface-200 flex flex-col hover:shadow-md transition-shadow"
          >
            <h3 className="text-2xl font-bold text-surface-900 mb-2 tracking-tight">Gratuito</h3>
            <p className="text-surface-500 mb-8">Para experimentar a plataforma</p>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-5xl font-black text-surface-900 tracking-tighter">R$0</span>
              <span className="text-surface-500 font-medium">/mês</span>
            </div>
            <ul className="space-y-5 mb-10 flex-1">
              <li className="flex items-start gap-3 text-surface-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Até 3 análises por mês</span>
              </li>
              <li className="flex items-start gap-3 text-surface-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Resumo executivo do contrato</span>
              </li>
              <li className="flex items-start gap-3 text-surface-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Alertas de risco básicos</span>
              </li>
            </ul>
            <Link to="/dashboard" className="w-full py-4 px-6 text-center rounded-full font-bold bg-surface-100 text-surface-900 hover:bg-surface-200 transition-colors">
              Começar Grátis
            </Link>
          </motion.div>

          {/* Pro Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-surface-900 p-8 rounded-[2rem] shadow-xl border border-surface-800 flex flex-col relative transform md:-translate-y-4"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-400 to-brand-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
              Mais Popular
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Pro</h3>
            <p className="text-surface-400 mb-8">Para profissionais e freelancers</p>
            <div className="mb-8 flex items-baseline gap-1 text-white">
              <span className="text-5xl font-black tracking-tighter">R$49</span>
              <span className="text-surface-400 font-medium">/mês</span>
            </div>
            <ul className="space-y-5 mb-10 flex-1 text-surface-200">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
                <span>Até 30 análises por mês</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
                <span>Análise detalhada de riscos com sugestões de reescrita</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
                <span>Chat interativo com a IA sobre o contrato</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
                <span>Histórico completo de análises</span>
              </li>
            </ul>
            <button 
              onClick={() => handleSubscribe('pro')}
              disabled={loadingPlan === 'pro'}
              className="w-full py-4 px-6 text-center rounded-full font-bold bg-white text-surface-900 hover:bg-surface-50 transition-all shadow-lg disabled:opacity-70 flex justify-center items-center gap-2 hover:-translate-y-0.5"
            >
              {loadingPlan === 'pro' && <div className="w-4 h-4 border-2 border-surface-900 border-t-transparent rounded-full animate-spin"></div>}
              Assinar Pro
            </button>
          </motion.div>

          {/* Unlimited Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-8 rounded-[2rem] shadow-sm border border-surface-200 flex flex-col hover:shadow-md transition-shadow"
          >
            <h3 className="text-2xl font-bold text-surface-900 mb-2 tracking-tight">Unlimited</h3>
            <p className="text-surface-500 mb-8">Para empresas e escritórios</p>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-5xl font-black text-surface-900 tracking-tighter">R$199</span>
              <span className="text-surface-500 font-medium">/mês</span>
            </div>
            <ul className="space-y-5 mb-10 flex-1">
              <li className="flex items-start gap-3 text-surface-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Análises ilimitadas</span>
              </li>
              <li className="flex items-start gap-3 text-surface-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Prioridade no processamento da IA</span>
              </li>
              <li className="flex items-start gap-3 text-surface-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Suporte premium prioritário</span>
              </li>
              <li className="flex items-start gap-3 text-surface-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Exportação em PDF com marca d'água personalizada</span>
              </li>
            </ul>
            <button 
              onClick={() => handleSubscribe('unlimited')}
              disabled={loadingPlan === 'unlimited'}
              className="w-full py-4 px-6 text-center rounded-full font-bold bg-surface-100 text-surface-900 hover:bg-surface-200 transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {loadingPlan === 'unlimited' && <div className="w-4 h-4 border-2 border-surface-900 border-t-transparent rounded-full animate-spin"></div>}
              Assinar Unlimited
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
