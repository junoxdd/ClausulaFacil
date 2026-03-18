import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, UploadCloud, AlertCircle, Lock, Shield, FileCheck, FileSearch, Sparkles } from "lucide-react";
import { analyzeContract } from "../services/gemini";
import { saveContract } from "../store/contracts";
import { getUserProfile, incrementAnalysesCount, UserProfile } from "../store/user";
import { cn } from "../lib/utils";
import { useAuth } from "../components/AuthProvider";
import * as mammoth from "mammoth";
import { motion } from "motion/react";

const DEMO_CONTRACTS = [
  {
    title: "Contrato de Aluguel (Demo)",
    text: "CONTRATO DE LOCAÇÃO RESIDENCIAL\n\nLOCADOR: João Silva\nLOCATÁRIO: Maria Oliveira\n\n1. OBJETO: O LOCADOR aluga ao LOCATÁRIO o imóvel situado na Rua das Flores, 123.\n2. PRAZO: 12 meses, iniciando em 01/01/2024.\n3. VALOR: R$ 2.000,00 mensais, pagos até o dia 5.\n4. MULTA: Em caso de atraso, multa de 10% sobre o valor do aluguel, mais juros de 1% ao mês.\n5. RESCISÃO: Se o LOCATÁRIO rescindir antes de 12 meses, pagará multa de 3 aluguéis integrais.\n6. FORO: Fica eleito o foro da Comarca de São Paulo."
  },
  {
    title: "Acordo de Confidencialidade (NDA)",
    text: "ACORDO DE CONFIDENCIALIDADE (NDA)\n\nPARTES: Empresa A e Empresa B.\n\n1. INFORMAÇÃO CONFIDENCIAL: Qualquer dado técnico ou comercial compartilhado.\n2. OBRIGAÇÕES: A Empresa B não pode compartilhar os dados com terceiros sob nenhuma hipótese.\n3. PRAZO: A obrigação de sigilo é eterna e não tem prazo de validade.\n4. PENALIDADE: Em caso de vazamento, a Empresa B pagará multa de R$ 500.000,00, independentemente de comprovação de danos.\n5. FORO: Nova York, EUA."
  }
];

export default function Dashboard() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<{ base64: string, mimeType: string, name: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();

  const [fatalError, setFatalError] = useState<Error | null>(null);

  useEffect(() => {
    if (user) {
      getUserProfile().then(setProfile).catch(err => {
        setFatalError(err instanceof Error ? err : new Error(String(err)));
      });
    }
  }, [user]);

  if (fatalError) {
    throw fatalError;
  }

  const handleAnalyze = async () => {
    if (!user) {
      setError("Você precisa estar logado para analisar contratos.");
      return;
    }

    if (profile?.plan === "free" && profile.analysesCount >= 3) {
      setError("Você atingiu o limite de 3 análises gratuitas. Faça upgrade para o plano Pro para continuar.");
      return;
    }

    if (!text.trim() && !file) {
      setError("Por favor, cole o texto ou envie um arquivo de contrato para analisar.");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const analysis = await analyzeContract(text, file?.base64, file?.mimeType);
      const id = crypto.randomUUID();
      
      let title = "Contrato sem título";
      if (file) {
        title = file.name;
      } else {
        const titleMatch = text.substring(0, 100).match(/^.*$/m);
        if (titleMatch) title = titleMatch[0].trim();
      }

      await saveContract({
        id,
        userId: user.uid,
        date: new Date().toISOString(),
        title: title || "Contrato sem título",
        text: file ? `[Arquivo: ${file.name}]` : text,
        analysis
      });

      await incrementAnalysesCount();
      navigate(`/analysis/${id}`);
    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.message.includes('operationType')) {
        setFatalError(err);
        return;
      }
      setError("Ocorreu um erro ao analisar o contrato. Tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validImageTypes = ["image/jpeg", "image/png", "image/webp"];
    
    if (selectedFile.type === "application/pdf" || validImageTypes.includes(selectedFile.type)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(',')[1];
        setFile({ base64, mimeType: selectedFile.type, name: selectedFile.name });
        setText(""); 
        setError("");
      };
      reader.readAsDataURL(selectedFile);
    } else if (selectedFile.name.toLowerCase().endsWith(".docx") || selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          setText(result.value);
          setFile(null);
          setError("");
        } catch (err) {
          console.error("Mammoth error:", err);
          setError("Erro ao extrair texto do arquivo DOCX.");
        }
      };
      reader.onerror = () => {
        setError("Erro ao ler o arquivo DOCX.");
      };
      reader.readAsArrayBuffer(selectedFile);
    } else if (selectedFile.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (e) => {
        setText(e.target?.result as string);
        setFile(null);
        setError("");
      };
      reader.readAsText(selectedFile);
    } else {
      setError("Formato não suportado. Envie PDF, DOCX, TXT ou Imagens (JPG/PNG) para OCR.");
    }
  };

  const loadDemo = (demoText: string) => {
    setText(demoText);
    setFile(null);
    setError("");
  };

  return (
    <div className="flex-1 w-full bg-surface-50 py-12 font-sans relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold text-surface-900 mb-4 tracking-tight">Nova Análise de Contrato</h1>
          <p className="text-lg text-surface-600 max-w-2xl mx-auto text-balance">Envie um arquivo PDF, DOCX, Imagem (OCR) ou cole o texto do contrato abaixo para descobrir riscos e pontos importantes.</p>
        </motion.div>

        {/* Privacy Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-10 bg-emerald-50/50 border border-emerald-200/50 rounded-2xl p-5 flex items-start sm:items-center gap-4 text-emerald-800 shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-sm leading-relaxed">
            <strong className="font-semibold text-emerald-900">Privacidade Garantida:</strong> Seus contratos são criptografados. Não usamos seus dados para treinar nossa IA. Você pode excluir seus documentos permanentemente a qualquer momento.
          </p>
        </motion.div>

        {!user ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[2rem] p-12 shadow-xl border border-surface-200 text-center flex flex-col items-center justify-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-surface-50/50 to-transparent pointer-events-none" />
            <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center mb-8 text-brand-500 relative z-10">
              <Lock className="w-10 h-10" />
              <div className="absolute inset-0 bg-brand-400 blur-xl opacity-20 rounded-full"></div>
            </div>
            <h2 className="text-3xl font-bold text-surface-900 mb-4 relative z-10 tracking-tight">Faça login para continuar</h2>
            <p className="text-surface-600 mb-10 max-w-md text-lg relative z-10 text-balance">Para proteger seus dados e salvar seu histórico de contratos, você precisa estar autenticado.</p>
            <button 
              onClick={signInWithGoogle} 
              className="px-8 py-4 bg-surface-900 text-white rounded-full font-bold hover:bg-surface-800 transition-all premium-shadow hover:premium-shadow-hover hover:-translate-y-0.5 relative z-10 flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continuar com Google
            </button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[2rem] shadow-xl border border-surface-200 overflow-hidden"
          >
            <div className="p-8 md:p-10">
              
              {/* Usage Limits Warning */}
              {profile?.plan === "free" && (
                <div className="mb-8 p-5 bg-brand-50/50 border border-brand-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-brand-800">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <FileSearch className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Plano Gratuito</p>
                      <p className="text-sm text-brand-600/80">{profile.analysesCount} de 3 análises utilizadas.</p>
                    </div>
                  </div>
                  {profile.analysesCount >= 3 && (
                    <button onClick={() => navigate('/pricing')} className="w-full sm:w-auto px-6 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-full hover:bg-brand-700 transition-colors premium-shadow">
                      Fazer Upgrade
                    </button>
                  )}
                </div>
              )}

              {/* Demo Contracts */}
              <div className="mb-10">
                <p className="text-sm font-semibold text-surface-500 mb-4 uppercase tracking-wider">Testar com exemplo</p>
                <div className="flex flex-wrap gap-3">
                  {DEMO_CONTRACTS.map((demo, idx) => (
                    <button
                      key={idx}
                      onClick={() => loadDemo(demo.text)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-surface-50 hover:bg-surface-100 text-surface-700 rounded-full text-sm font-medium transition-colors border border-surface-200 hover:border-surface-300"
                    >
                      <FileCheck className="w-4 h-4 text-surface-400" />
                      {demo.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Area */}
              <div className={cn(
                "border-2 border-dashed rounded-[2rem] p-10 text-center transition-all relative mb-10 group",
                file ? "border-brand-400 bg-brand-50/30" : "border-surface-300 hover:border-brand-300 hover:bg-surface-50 cursor-pointer"
              )}>
                <input 
                  type="file" 
                  accept=".txt,.pdf,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={handleFileUpload}
                />
                <div className="flex flex-col items-center justify-center gap-5 relative z-0">
                  <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center transition-transform group-hover:scale-105",
                    file ? "bg-brand-100 text-brand-600" : "bg-surface-100 text-surface-500 group-hover:bg-brand-50 group-hover:text-brand-500"
                  )}>
                    <UploadCloud className="w-10 h-10" />
                  </div>
                  <div>
                    {file ? (
                      <>
                        <p className="text-lg font-bold text-brand-900 mb-1">{file.name}</p>
                        <p className="text-brand-600/80 text-sm">Clique ou arraste outro arquivo para trocar</p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-bold text-surface-900 mb-1">Clique para enviar um arquivo</p>
                        <p className="text-surface-500 text-sm">PDF, DOCX, TXT ou Imagem (Max 10MB)</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-10">
                <div className="h-px bg-surface-200 flex-1"></div>
                <span className="text-surface-400 font-bold text-xs uppercase tracking-widest">OU</span>
                <div className="h-px bg-surface-200 flex-1"></div>
              </div>

              {/* Text Area */}
              <div className="mb-8">
                <label htmlFor="contract-text" className="block text-sm font-bold text-surface-700 mb-3 uppercase tracking-wider">
                  Cole o texto do contrato
                </label>
                <div className="relative">
                  <textarea
                    id="contract-text"
                    value={text}
                    onChange={(e) => { setText(e.target.value); setFile(null); }}
                    placeholder="Cole o conteúdo do contrato aqui..."
                    className="w-full h-64 p-6 rounded-[1.5rem] border border-surface-300 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 resize-none font-mono text-sm text-surface-800 bg-surface-50/50 transition-all"
                  />
                  {text && (
                    <button 
                      onClick={() => setText("")}
                      className="absolute top-4 right-4 text-surface-400 hover:text-surface-600 text-xs font-bold uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-surface-200 shadow-sm"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-8 p-5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                  <p className="text-sm font-medium leading-relaxed">{error}</p>
                </motion.div>
              )}

              <div className="flex justify-end pt-4 border-t border-surface-100">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || (!text.trim() && !file) || (profile?.plan === "free" && profile.analysesCount >= 3)}
                  className={cn(
                    "px-10 py-4 rounded-full font-bold text-lg transition-all flex items-center gap-3",
                    isAnalyzing || (!text.trim() && !file) || (profile?.plan === "free" && profile.analysesCount >= 3)
                      ? "bg-surface-200 text-surface-400 cursor-not-allowed" 
                      : "bg-brand-600 text-white hover:bg-brand-700 premium-shadow hover:premium-shadow-hover hover:-translate-y-0.5"
                  )}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Analisando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Analisar Contrato</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
