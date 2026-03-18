import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, ArrowRight, ShieldCheck, ShieldAlert, Clock, Lock, Trash2, Folder, Tag, Activity, Edit2, X, FileSearch } from "lucide-react";
import { getHistory, deleteContract, updateContract, ContractRecord } from "../store/contracts";
import { cn } from "../lib/utils";
import { useAuth } from "../components/AuthProvider";
import { motion, AnimatePresence } from "motion/react";

export default function History() {
  const [history, setHistory] = useState<ContractRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const [editingRecord, setEditingRecord] = useState<ContractRecord | null>(null);
  const [editFolder, setEditFolder] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editStatus, setEditStatus] = useState<ContractRecord["status"]>("Revisão Pendente");
  const [isSaving, setIsSaving] = useState(false);

  const [filterFolder, setFilterFolder] = useState<string>("Todas");
  const [filterStatus, setFilterStatus] = useState<string>("Todos");

  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      if (user) {
        try {
          const data = await getHistory();
          setHistory(data);
        } catch (err) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
      setLoading(false);
    }
    fetchHistory();
  }, [user]);

  if (error) {
    throw error;
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Tem certeza que deseja excluir este contrato?")) return;
    
    setDeletingId(id);
    try {
      await deleteContract(id);
      setHistory(prev => prev.filter(record => record.id !== id));
    } catch (error) {
      console.error("Error deleting contract:", error);
      alert("Erro ao excluir o contrato.");
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (e: React.MouseEvent, record: ContractRecord) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingRecord(record);
    setEditFolder(record.folder || "Geral");
    setEditTags(record.tags?.join(", ") || "");
    setEditStatus(record.status || "Revisão Pendente");
  };

  const handleSaveMetadata = async () => {
    if (!editingRecord) return;
    setIsSaving(true);
    try {
      const tagsArray = editTags.split(",").map(t => t.trim()).filter(t => t);
      await updateContract(editingRecord.id, {
        folder: editFolder,
        tags: tagsArray,
        status: editStatus
      });
      
      setHistory(prev => prev.map(r => 
        r.id === editingRecord.id 
          ? { ...r, folder: editFolder, tags: tagsArray, status: editStatus } 
          : r
      ));
      setEditingRecord(null);
    } catch (error) {
      console.error("Error updating contract:", error);
      alert("Erro ao atualizar o contrato.");
    } finally {
      setIsSaving(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 30) return "text-emerald-500 bg-emerald-50 border-emerald-200";
    if (score < 70) return "text-amber-500 bg-amber-50 border-amber-200";
    return "text-red-500 bg-red-50 border-red-200";
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Assinado": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Cancelado": return "bg-red-100 text-red-700 border-red-200";
      case "Em Negociação": return "bg-brand-100 text-brand-700 border-brand-200";
      default: return "bg-surface-100 text-surface-700 border-surface-200";
    }
  };

  if (!user) {
    return (
      <div className="flex-1 w-full bg-surface-50 py-12 font-sans">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="bg-white rounded-[2rem] p-12 shadow-xl border border-surface-200 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6 text-brand-500">
              <Lock className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-surface-900 mb-3 tracking-tight">Faça login para ver seu histórico</h2>
            <p className="text-surface-500 mb-8 max-w-md leading-relaxed">Seu histórico de contratos é privado e seguro. Faça login para acessá-lo.</p>
            <button onClick={signInWithGoogle} className="px-8 py-4 bg-brand-600 text-white rounded-full font-bold hover:bg-brand-700 transition-all premium-shadow hover:premium-shadow-hover hover:-translate-y-0.5">
              Entrar com Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  const folders = Array.from(new Set(history.map(r => r.folder || "Geral")));
  const statuses = ["Todos", "Revisão Pendente", "Em Negociação", "Assinado", "Cancelado"];

  const filteredHistory = history.filter(r => {
    const matchFolder = filterFolder === "Todas" || (r.folder || "Geral") === filterFolder;
    const matchStatus = filterStatus === "Todos" || (r.status || "Revisão Pendente") === filterStatus;
    return matchFolder && matchStatus;
  });

  return (
    <div className="flex-1 w-full bg-surface-50 py-12 font-sans relative">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-surface-100 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-6 max-w-5xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div>
            <h1 className="text-3xl font-extrabold text-surface-900 mb-2 tracking-tight">Histórico de Análises</h1>
            <p className="text-surface-600">Acesse e gerencie todos os contratos que você já analisou.</p>
          </div>
          <Link to="/dashboard" className="px-6 py-3 bg-brand-600 text-white rounded-full font-bold hover:bg-brand-700 transition-all premium-shadow hover:premium-shadow-hover hover:-translate-y-0.5 text-center">
            Nova Análise
          </Link>
        </motion.div>

        {history.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl border border-surface-200 shadow-sm"
          >
            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
              <div className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center flex-shrink-0">
                <Folder className="w-4 h-4 text-surface-500" />
              </div>
              <select 
                value={filterFolder} 
                onChange={e => setFilterFolder(e.target.value)}
                className="flex-1 bg-transparent border-none text-surface-700 text-sm font-medium focus:ring-0 cursor-pointer"
              >
                <option value="Todas">Todas as Pastas</option>
                {folders.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="w-px h-8 bg-surface-200 hidden md:block"></div>
            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
              <div className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 text-surface-500" />
              </div>
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)}
                className="flex-1 bg-transparent border-none text-surface-700 text-sm font-medium focus:ring-0 cursor-pointer"
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          </div>
        ) : history.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] p-12 shadow-xl border border-surface-200 text-center flex flex-col items-center justify-center"
          >
            <div className="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mb-6 text-surface-400">
              <FileSearch className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-surface-900 mb-3 tracking-tight">Nenhum contrato analisado</h2>
            <p className="text-surface-500 mb-8 max-w-md leading-relaxed">Você ainda não enviou nenhum contrato para análise. Comece agora para descobrir riscos e pontos importantes.</p>
            <Link to="/dashboard" className="px-8 py-4 bg-brand-600 text-white rounded-full font-bold hover:bg-brand-700 transition-all premium-shadow hover:-translate-y-0.5">
              Analisar meu primeiro contrato
            </Link>
          </motion.div>
        ) : filteredHistory.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-12 shadow-sm border border-surface-200 text-center flex flex-col items-center justify-center">
            <h2 className="text-xl font-bold text-surface-900 mb-2 tracking-tight">Nenhum contrato encontrado</h2>
            <p className="text-surface-500">Tente ajustar os filtros de pasta e status.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence>
              {filteredHistory.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div 
                    onClick={() => navigate(`/analysis/${record.id}`)}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-surface-200 hover:border-brand-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6 group relative cursor-pointer"
                  >
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 border-2",
                      getScoreColor(record.analysis.riskScore)
                    )}>
                      <span className="text-xl font-black tracking-tighter">{record.analysis.riskScore}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-12">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-surface-900 truncate group-hover:text-brand-600 transition-colors tracking-tight">
                          {record.title}
                        </h3>
                        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", getStatusColor(record.status))}>
                          {record.status || "Revisão Pendente"}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-surface-500 mb-3">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {new Date(record.date).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Folder className="w-4 h-4" />
                          {record.folder || "Geral"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          {record.analysis.risks.length > 0 ? (
                            <><ShieldAlert className="w-4 h-4 text-amber-500" /> {record.analysis.risks.length} riscos encontrados</>
                          ) : (
                            <><ShieldCheck className="w-4 h-4 text-emerald-500" /> Nenhum risco grave</>
                          )}
                        </span>
                      </div>

                      {record.tags && record.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {record.tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-surface-100 text-surface-600 rounded-md text-[10px] font-bold uppercase tracking-wider border border-surface-200">
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-4 md:mt-0">
                      <button 
                        onClick={(e) => openEditModal(e, record)}
                        className="w-10 h-10 rounded-full bg-surface-50 flex items-center justify-center text-surface-500 hover:bg-brand-50 hover:text-brand-600 transition-colors border border-transparent hover:border-brand-100"
                        title="Editar organização"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, record.id)}
                        disabled={deletingId === record.id}
                        className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Excluir contrato"
                      >
                        {deletingId === record.id ? (
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                      <div className="w-10 h-10 rounded-full bg-surface-50 flex items-center justify-center text-surface-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingRecord && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative border border-surface-200"
            >
              <button 
                onClick={() => setEditingRecord(null)}
                className="absolute top-6 right-6 text-surface-400 hover:text-surface-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-2xl font-bold text-surface-900 mb-6 tracking-tight">Organizar Contrato</h2>
              
              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-sm font-bold text-surface-700 mb-2">Pasta</label>
                  <input 
                    type="text" 
                    value={editFolder}
                    onChange={e => setEditFolder(e.target.value)}
                    placeholder="Ex: Imóveis, Clientes..."
                    className="w-full bg-surface-50 border border-surface-200 rounded-xl py-3 px-4 text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-surface-700 mb-2">Tags <span className="text-surface-400 font-normal">(separadas por vírgula)</span></label>
                  <input 
                    type="text" 
                    value={editTags}
                    onChange={e => setEditTags(e.target.value)}
                    placeholder="Ex: urgente, renovação, 2024..."
                    className="w-full bg-surface-50 border border-surface-200 rounded-xl py-3 px-4 text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-surface-700 mb-2">Status</label>
                  <select 
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                    className="w-full bg-surface-50 border border-surface-200 rounded-xl py-3 px-4 text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
                  >
                    <option value="Revisão Pendente">Revisão Pendente</option>
                    <option value="Em Negociação">Em Negociação</option>
                    <option value="Assinado">Assinado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setEditingRecord(null)}
                  className="flex-1 py-3.5 px-4 bg-surface-100 text-surface-700 rounded-full font-bold hover:bg-surface-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveMetadata}
                  disabled={isSaving}
                  className="flex-1 py-3.5 px-4 bg-brand-600 text-white rounded-full font-bold hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center premium-shadow"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Salvar Alterações"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
