import React, { useState, useRef, useEffect } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2, ArrowRight, ShieldAlert, FileDiff, RefreshCw, Lock, Sparkles } from "lucide-react";
import { compareContracts, ContractComparison } from "../services/gemini";
import { getUserProfile, UserProfile } from "../store/user";
import { cn } from "../lib/utils";
import * as mammoth from "mammoth";
import { useAuth } from "../components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

interface FileData {
  file: File;
  text?: string;
  base64?: string;
  mimeType?: string;
}

export default function Compare() {
  const [file1, setFile1] = useState<FileData | null>(null);
  const [file2, setFile2] = useState<FileData | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ContractComparison | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

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

  const processFile = async (file: File): Promise<FileData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const validImageTypes = ["image/jpeg", "image/png", "image/webp"];
      
      if (file.type === "application/pdf" || validImageTypes.includes(file.type)) {
        reader.onload = (e) => {
          const base64 = (e.target?.result as string).split(',')[1];
          resolve({ file, base64, mimeType: file.type });
        };
        reader.onerror = () => reject("Erro ao ler o arquivo.");
        reader.readAsDataURL(file);
      } else if (file.name.endsWith(".docx")) {
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const result = await mammoth.extractRawText({ arrayBuffer });
            resolve({ file, text: result.value });
          } catch (err) {
            reject("Erro ao extrair texto do DOCX.");
          }
        };
        reader.onerror = () => reject("Erro ao ler o arquivo DOCX.");
        reader.readAsArrayBuffer(file);
      } else {
        reader.onload = (e) => {
          resolve({ file, text: e.target?.result as string });
        };
        reader.onerror = () => reject("Erro ao ler o arquivo de texto.");
        reader.readAsText(file);
      }
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<FileData | null>>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = ["application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith(".docx")) {
      setError("Por favor, envie apenas arquivos PDF, DOCX, TXT ou Imagens.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("O arquivo deve ter no máximo 10MB.");
      return;
    }

    setError(null);
    try {
      const processed = await processFile(selectedFile);
      setFile(processed);
    } catch (err) {
      setError(typeof err === "string" ? err : "Erro ao processar o arquivo.");
    }
  };

  const handleCompare = async () => {
    if (!file1 || !file2) {
      setError("Por favor, envie as duas versões do contrato.");
      return;
    }
    if (!user) {
      setError("Você precisa estar logado para comparar contratos.");
      return;
    }

    setIsComparing(true);
    setError(null);
    setResult(null);

    try {
      const comparison = await compareContracts(
        { text: file1.text, base64: file1.base64, mimeType: file1.mimeType },
        { text: file2.text, base64: file2.base64, mimeType: file2.mimeType }
      );
      setResult(comparison);
    } catch (err) {
      console.error(err);
      setError("Ocorreu um erro ao comparar os contratos. Tente novamente.");
    } finally {
      setIsComparing(false);
    }
  };

  const resetComparison = () => {
    setFile1(null);
    setFile2(null);
    setResult(null);
    setError(null);
  };

  if (profile?.plan === "free") {
    return (
      <div className="flex-1 w-full bg-surface-50 py-12 font-sans flex items-center justify-center relative">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-surface-100 to-transparent pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2rem] p-12 shadow-xl border border-surface-200 text-center max-w-lg relative z-10"
        >
          <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-500 relative">
            <Lock className="w-10 h-10 relative z-10" />
            <div className="absolute inset-0 bg-brand-400 blur-xl opacity-20 rounded-full"></div>
          </div>
          <h2 className="text-2xl font-bold text-surface-900 mb-4 tracking-tight">Recurso Premium</h2>
          <p className="text-surface-600 mb-8 leading-relaxed">
            A comparação de versões de contratos é um recurso exclusivo para assinantes dos planos Pro e Unlimited. Faça o upgrade para ter acesso.
          </p>
          <button onClick={() => navigate('/pricing')} className="px-8 py-4 bg-brand-600 text-white rounded-full font-bold hover:bg-brand-700 transition-all premium-shadow hover:premium-shadow-hover hover:-translate-y-0.5">
            Ver Planos
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-surface-50 py-12 font-sans relative">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-surface-100 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-6 max-w-5xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-extrabold text-surface-900 mb-4 tracking-tight">Comparar Versões</h1>
          <p className="text-lg text-surface-600 max-w-2xl mx-auto leading-relaxed">
            Faça o upload do contrato original e da versão revisada. A IA destacará o que mudou, se os riscos foram mitigados e se novos riscos foram introduzidos.
          </p>
        </motion.div>

        <AnimatePresence>
          {!user && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-brand-50 border border-brand-200 rounded-[2rem] p-8 mb-8 text-center shadow-sm"
            >
              <h3 className="text-xl font-bold text-brand-900 mb-2 tracking-tight">Faça login para comparar contratos</h3>
              <p className="text-brand-700 mb-6">A comparação de versões é um recurso exclusivo para usuários logados.</p>
              <button onClick={signInWithGoogle} className="px-8 py-3.5 bg-brand-600 text-white rounded-full font-bold hover:bg-brand-700 transition-all premium-shadow hover:-translate-y-0.5">
                Entrar com Google
              </button>
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 p-5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 shadow-sm"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {!result ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] p-8 shadow-xl border border-surface-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
              {/* V1 Upload */}
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-surface-900 mb-4 flex items-center gap-3 tracking-tight">
                  <span className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center text-sm text-surface-600">1</span>
                  Contrato Original (V1)
                </h3>
                <div 
                  onClick={() => fileInput1Ref.current?.click()}
                  className={cn(
                    "flex-1 border-2 border-dashed rounded-[1.5rem] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[240px] group",
                    file1 ? "border-brand-500 bg-brand-50/50" : "border-surface-300 hover:border-brand-400 hover:bg-surface-50"
                  )}
                >
                  <input 
                    type="file" 
                    ref={fileInput1Ref} 
                    onChange={(e) => handleFileChange(e, setFile1)} 
                    className="hidden" 
                    accept=".pdf,.txt,.docx,image/jpeg,image/png,image/webp"
                  />
                  {file1 ? (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-brand-100">
                        <FileText className="w-8 h-8 text-brand-500" />
                      </div>
                      <p className="font-bold text-brand-900 mb-1">{file1.file.name}</p>
                      <p className="text-sm text-brand-600">{(file1.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-brand-50 group-hover:text-brand-500 text-surface-400">
                        <Upload className="w-8 h-8" />
                      </div>
                      <p className="font-bold text-surface-900 mb-1">Clique para enviar a V1</p>
                      <p className="text-sm text-surface-500">PDF, DOCX, TXT ou Imagem</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Arrow separator on desktop */}
              <div className="hidden md:flex absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full border border-surface-200 items-center justify-center shadow-md z-10">
                <ArrowRight className="w-6 h-6 text-surface-400" />
              </div>

              {/* V2 Upload */}
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-surface-900 mb-4 flex items-center gap-3 tracking-tight">
                  <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-sm font-bold">2</span>
                  Contrato Revisado (V2)
                </h3>
                <div 
                  onClick={() => fileInput2Ref.current?.click()}
                  className={cn(
                    "flex-1 border-2 border-dashed rounded-[1.5rem] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[240px] group",
                    file2 ? "border-brand-500 bg-brand-50/50" : "border-surface-300 hover:border-brand-400 hover:bg-surface-50"
                  )}
                >
                  <input 
                    type="file" 
                    ref={fileInput2Ref} 
                    onChange={(e) => handleFileChange(e, setFile2)} 
                    className="hidden" 
                    accept=".pdf,.txt,.docx,image/jpeg,image/png,image/webp"
                  />
                  {file2 ? (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-brand-100">
                        <FileText className="w-8 h-8 text-brand-500" />
                      </div>
                      <p className="font-bold text-brand-900 mb-1">{file2.file.name}</p>
                      <p className="text-sm text-brand-600">{(file2.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-brand-50 group-hover:text-brand-500 text-surface-400">
                        <Upload className="w-8 h-8" />
                      </div>
                      <p className="font-bold text-surface-900 mb-1">Clique para enviar a V2</p>
                      <p className="text-sm text-surface-500">PDF, DOCX, TXT ou Imagem</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-10 flex justify-center">
              <button
                onClick={handleCompare}
                disabled={!file1 || !file2 || isComparing || !user}
                className="px-10 py-4 bg-brand-600 text-white rounded-full font-bold hover:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 premium-shadow hover:premium-shadow-hover hover:-translate-y-0.5"
              >
                {isComparing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Analisando diferenças...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Comparar Versões
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-extrabold text-surface-900 tracking-tight">Resultado da Comparação</h2>
              <button 
                onClick={resetComparison}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-surface-200 rounded-full text-surface-700 hover:bg-surface-50 transition-colors font-bold text-sm shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Nova Comparação
              </button>
            </div>

            {/* Conclusion */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-surface-200 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-brand-500"></div>
              <h3 className="text-xl font-bold text-surface-900 mb-4 tracking-tight">Conclusão da Negociação</h3>
              <p className="text-surface-700 leading-relaxed text-lg">{result.conclusion}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Changes */}
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-surface-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center">
                    <FileDiff className="w-5 h-5 text-surface-600" />
                  </div>
                  <h3 className="text-xl font-bold text-surface-900 tracking-tight">
                    O que mudou?
                  </h3>
                </div>
                
                {result.changes.length === 0 ? (
                  <div className="p-6 bg-surface-50 rounded-2xl border border-surface-100 text-center">
                    <p className="text-surface-500">Nenhuma mudança significativa encontrada.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {result.changes.map((change, i) => (
                      <div key={i} className="flex items-start gap-4 p-5 rounded-[1.5rem] bg-surface-50/50 border border-surface-100 transition-colors hover:bg-white hover:border-surface-200">
                        <div className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mt-0.5 flex-shrink-0 border",
                          change.type === "added" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          change.type === "removed" ? "bg-red-50 text-red-700 border-red-200" :
                          "bg-brand-50 text-brand-700 border-brand-200"
                        )}>
                          {change.type === "added" ? "Adicionado" : change.type === "removed" ? "Removido" : "Modificado"}
                        </div>
                        <p className="text-surface-700 text-sm leading-relaxed">{change.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-8">
                {/* Mitigated Risks */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-surface-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-surface-900 tracking-tight">
                      Riscos Mitigados na V2
                    </h3>
                  </div>
                  
                  {result.mitigatedRisks.length === 0 ? (
                    <div className="p-6 bg-surface-50 rounded-2xl border border-surface-100 text-center">
                      <p className="text-surface-500">Nenhum risco da V1 parece ter sido resolvido na V2.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {result.mitigatedRisks.map((risk, i) => (
                        <div key={i} className="bg-emerald-50/50 p-5 rounded-[1.5rem] border border-emerald-100 transition-colors hover:bg-emerald-50">
                          <h4 className="font-bold text-emerald-900 mb-2">{risk.title}</h4>
                          <p className="text-sm text-emerald-700 leading-relaxed">{risk.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* New Risks */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-surface-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                      <ShieldAlert className="w-5 h-5 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-bold text-surface-900 tracking-tight">
                      Novos Riscos Introduzidos
                    </h3>
                  </div>
                  
                  {result.newRisks.length === 0 ? (
                    <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center flex flex-col items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                      <p className="text-emerald-700 font-medium">Excelente! Nenhum risco novo foi introduzido na V2.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {result.newRisks.map((risk, i) => (
                        <div key={i} className="bg-surface-50/50 p-5 rounded-[1.5rem] border border-surface-100 transition-colors hover:bg-white hover:border-surface-200">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-bold text-surface-900">{risk.title}</h4>
                            <span className={cn(
                              "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                              risk.severity === "high" ? "bg-red-50 text-red-700 border-red-200" :
                              risk.severity === "medium" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-surface-100 text-surface-700 border-surface-200"
                            )}>
                              {risk.severity}
                            </span>
                          </div>
                          <p className="text-sm text-surface-600 leading-relaxed">{risk.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
