import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldAlert, CheckCircle2, Info, Send, Bot, User, FileText, Users, DollarSign, PenTool, Trash2, Download, Lock, Sparkles, FileSearch, Columns } from "lucide-react";
import { getContract, deleteContract, ContractRecord } from "../store/contracts";
import { chatWithContract } from "../services/gemini";
import { cn } from "../lib/utils";
import { getUserProfile, UserProfile } from "../store/user";
import { auth } from "../firebase";
import { motion, AnimatePresence } from "motion/react";
import html2pdf from "html2pdf.js";

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";

function DictionaryText({ text, dictionary }: { text: string, dictionary?: {term: string, definition: string}[] }) {
  if (!dictionary || dictionary.length === 0) return <>{text}</>;

  const terms = dictionary.map(d => d.term).sort((a, b) => b.length - a.length);
  const regex = new RegExp(`\\b(${terms.map(t => t.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')).join('|')})\\b`, 'gi');

  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const lowerPart = part.toLowerCase();
        const dictEntry = dictionary.find(d => d.term.toLowerCase() === lowerPart);
        
        if (dictEntry) {
          return (
            <span key={i} className="group relative inline-block cursor-help border-b border-dashed border-brand-400 text-brand-700 transition-colors hover:text-brand-900 hover:border-brand-600">
              {part}
              <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 bg-surface-900 text-white text-sm rounded-2xl shadow-2xl z-50 pointer-events-none font-sans transform group-hover:-translate-y-1">
                <strong className="block mb-1.5 text-brand-300 font-bold tracking-wide uppercase text-xs">{dictEntry.term}</strong>
                <span className="leading-relaxed text-surface-200">{dictEntry.definition}</span>
                <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-surface-900"></span>
              </span>
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function HighlightedText({ text, quote }: { text: string, quote: string | null }) {
  const markRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (quote && markRef.current) {
      markRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [quote]);

  if (!quote) {
    return <div className="whitespace-pre-wrap text-sm text-surface-700 font-mono leading-relaxed">{text}</div>;
  }

  // Simple string matching. For more robust matching, we might need fuzzy search if the AI slightly altered the quote.
  const index = text.toLowerCase().indexOf(quote.toLowerCase());
  
  if (index === -1) {
    return <div className="whitespace-pre-wrap text-sm text-surface-700 font-mono leading-relaxed">{text}</div>;
  }

  const before = text.substring(0, index);
  const match = text.substring(index, index + quote.length);
  const after = text.substring(index + quote.length);

  return (
    <div className="whitespace-pre-wrap text-sm text-surface-700 font-mono leading-relaxed">
      {before}
      <mark ref={markRef} className="bg-brand-200 text-brand-900 px-1 rounded font-bold transition-all duration-500 shadow-sm">
        {match}
      </mark>
      {after}
    </div>
  );
}

export default function Analysis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<ContractRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "model", parts: { text: string }[] }[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [fatalError, setFatalError] = useState<Error | null>(null);
  const [isSplitScreen, setIsSplitScreen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        if (id) {
          const data = await getContract(id);
          if (data) setRecord(data);
        }
        
        if (auth.currentUser) {
          const profile = await getUserProfile();
          setUserProfile(profile);
        }
      } catch (err) {
        setFatalError(err instanceof Error ? err : new Error(String(err)));
      }
      
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (fatalError) {
    throw fatalError;
  }

  const handleDelete = async () => {
    if (!id || !window.confirm("Tem certeza que deseja excluir este contrato?")) return;
    
    setIsDeleting(true);
    try {
      await deleteContract(id);
      navigate('/history');
    } catch (error) {
      console.error("Error deleting contract:", error);
      if (error instanceof Error && error.message.includes('operationType')) {
        setFatalError(error);
        return;
      }
      alert("Erro ao excluir o contrato.");
      setIsDeleting(false);
    }
  };

  const handlePrint = async () => {
    if (!reportRef.current || !record) return;
    
    setIsExporting(true);
    try {
      const element = reportRef.current;
      const opt = {
        margin:       [15, 15, 15, 15] as [number, number, number, number],
        filename:     `Analise_Contrato_${record.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Erro ao gerar o PDF. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWord = async () => {
    if (!record) return;
    setIsExporting(true);
    try {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: "Relatório de Análise Contratual",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                text: `Documento: ${record.title}`,
                heading: HeadingLevel.HEADING_2,
              }),
              new Paragraph({
                text: `Data da Análise: ${new Date(record.date).toLocaleDateString("pt-BR")}`,
                spacing: { after: 400 },
              }),
              new Paragraph({
                text: "Resumo Executivo",
                heading: HeadingLevel.HEADING_2,
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Tipo de Contrato: ", bold: true }),
                  new TextRun(record.analysis.summary.type),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Duração: ", bold: true }),
                  new TextRun(record.analysis.summary.duration),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Foro / Jurisdição: ", bold: true }),
                  new TextRun(record.analysis.summary.jurisdiction || "Não especificado"),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Objetivo Principal: ", bold: true }),
                  new TextRun(record.analysis.summary.objective),
                ],
                spacing: { after: 400 },
              }),
              new Paragraph({
                text: "Riscos Identificados",
                heading: HeadingLevel.HEADING_2,
              }),
              ...(record.analysis.risks.length === 0
                ? [new Paragraph({ text: "Nenhum risco significativo identificado." })]
                : record.analysis.risks.flatMap((risk) => [
                    new Paragraph({
                      children: [
                        new TextRun({ text: `[${risk.severity.toUpperCase()}] `, bold: true, color: risk.severity === "high" ? "FF0000" : risk.severity === "medium" ? "FFA500" : "808080" }),
                        new TextRun({ text: risk.title, bold: true }),
                      ],
                      spacing: { before: 200 },
                    }),
                    new Paragraph({ text: risk.description }),
                    ...(risk.rewriteSuggestion
                      ? [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Sugestão de Redação: ", bold: true, italics: true }),
                              new TextRun({ text: risk.rewriteSuggestion, italics: true }),
                            ],
                          }),
                        ]
                      : []),
                  ])),
              new Paragraph({
                text: "Pontos Importantes",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400 },
              }),
              ...record.analysis.importantPoints.flatMap((point) => [
                new Paragraph({
                  children: [new TextRun({ text: point.title, bold: true })],
                  spacing: { before: 200 },
                }),
                new Paragraph({ text: point.description }),
              ]),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Analise_Contrato_${record.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`);
    } catch (error) {
      console.error("Error generating Word document:", error);
      alert("Erro ao gerar o documento Word. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-50 font-sans">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-50 font-sans p-6">
        <div className="text-center bg-white p-12 rounded-[2rem] shadow-xl border border-surface-200 max-w-md w-full">
          <div className="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-6 text-surface-400">
            <FileSearch className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-surface-900 mb-4 tracking-tight">Contrato não encontrado</h2>
          <p className="text-surface-500 mb-8">O documento que você está procurando não existe ou foi excluído.</p>
          <Link to="/dashboard" className="inline-flex items-center justify-center gap-2 px-6 py-3 w-full bg-brand-600 text-white rounded-full font-bold hover:bg-brand-700 transition-colors premium-shadow hover:-translate-y-0.5">
            <ArrowLeft className="w-4 h-4" />
            Voltar para o Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting || userProfile?.plan === "free") return;

    const userMessage = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: "user", parts: [{ text: userMessage }] }]);
    setIsChatting(true);

    try {
      const response = await chatWithContract(record.text, chatHistory, userMessage);
      setChatHistory(prev => [...prev, { role: "model", parts: [{ text: response }] }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: "model", parts: [{ text: "Ocorreu um erro ao responder sua pergunta. Tente novamente." }] }]);
    } finally {
      setIsChatting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 30) return "text-emerald-500";
    if (score < 70) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score < 30) return "bg-emerald-50 border-emerald-100";
    if (score < 70) return "bg-amber-50 border-amber-100";
    return "bg-red-50 border-red-100";
  };

  const isFreeUser = userProfile?.plan === "free";

  return (
    <div className="flex-1 w-full bg-surface-50 py-8 font-sans print:bg-white print:py-0 relative">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-surface-100 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden"
        >
          <div className="flex items-center gap-4">
            <Link to="/history" className="p-2.5 bg-white rounded-full shadow-sm hover:bg-surface-50 transition-colors border border-surface-200 group">
              <ArrowLeft className="w-5 h-5 text-surface-500 group-hover:text-surface-900 transition-colors" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold uppercase tracking-wider">Relatório de Análise</span>
                <span className="text-surface-400 text-xs font-medium">{new Date(record.date).toLocaleDateString("pt-BR")}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-surface-900 truncate max-w-[300px] sm:max-w-md md:max-w-lg tracking-tight">
                {record.title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={() => setIsSplitScreen(!isSplitScreen)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-full transition-colors border shadow-sm font-bold text-sm",
                isSplitScreen 
                  ? "bg-brand-50 text-brand-700 border-brand-200" 
                  : "bg-white text-surface-700 hover:bg-surface-50 border-surface-200"
              )}
            >
              <Columns className="w-4 h-4" />
              <span className="hidden sm:inline">{isSplitScreen ? "Modo Padrão" : "Lado a Lado"}</span>
            </button>
            <button 
              onClick={handlePrint}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-surface-700 rounded-full hover:bg-surface-50 transition-colors border border-surface-200 shadow-sm font-bold text-sm disabled:opacity-50"
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-surface-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Download className="w-4 h-4 text-surface-500" />
              )}
              <span className="hidden sm:inline">{isExporting ? "Exportando..." : "Exportar PDF"}</span>
            </button>
            <button 
              onClick={handleExportWord}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-surface-700 rounded-full hover:bg-surface-50 transition-colors border border-surface-200 shadow-sm font-bold text-sm disabled:opacity-50"
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-surface-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FileText className="w-4 h-4 text-surface-500" />
              )}
              <span className="hidden sm:inline">{isExporting ? "Exportando..." : "Exportar Word"}</span>
            </button>
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors border border-red-100 disabled:opacity-50 font-bold text-sm"
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Excluir</span>
            </button>
          </div>
        </motion.div>

        {/* Print Header */}
        <div className="hidden print:block mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatório de Análise Contratual</h1>
          <p className="text-gray-600">Documento: {record.title}</p>
          <p className="text-gray-600">Data da Análise: {new Date(record.date).toLocaleDateString("pt-BR")}</p>
        </div>

        <div className={cn("grid gap-8 print:block", isSplitScreen ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 xl:grid-cols-3")}>
          {/* Original Document Column (Split Screen Only) */}
          {isSplitScreen && (
            <div className="lg:col-span-1 h-[800px] overflow-y-auto bg-white rounded-[2rem] p-8 shadow-sm border border-surface-200 print:hidden">
              <div className="flex items-center gap-3 mb-6 sticky top-0 bg-white pb-4 border-b border-surface-100 z-10">
                <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-surface-600" />
                </div>
                <h3 className="text-xl font-bold text-surface-900 tracking-tight">
                  Documento Original
                </h3>
              </div>
              <HighlightedText text={record.text} quote={selectedQuote} />
            </div>
          )}

          {/* Main Analysis Column */}
          <div className={cn("space-y-8 print:space-y-6", isSplitScreen ? "lg:col-span-1 h-[800px] overflow-y-auto pr-4" : "xl:col-span-2")} ref={reportRef}>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {/* Score Card */}
              <div className={cn(
                "md:col-span-1 rounded-[2rem] p-8 shadow-sm border flex flex-col items-center justify-center text-center print:border-gray-300 print:shadow-none print:rounded-xl",
                getScoreBg(record.analysis.riskScore)
              )}>
                <div className="relative mb-4">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-surface-200" />
                    <circle 
                      cx="64" cy="64" r="56" 
                      stroke="currentColor" 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray={351.85} 
                      strokeDashoffset={351.85 - (351.85 * record.analysis.riskScore) / 100}
                      className={cn("transition-all duration-1000 ease-out", getScoreColor(record.analysis.riskScore))} 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn("text-4xl font-black tracking-tighter", getScoreColor(record.analysis.riskScore))}>
                      {record.analysis.riskScore}
                    </span>
                    <span className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mt-1">Score</span>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-surface-900 mb-2 tracking-tight">Nível de Risco</h2>
                <p className="text-surface-600 text-sm leading-relaxed">
                  {record.analysis.riskScore < 30 && "Este contrato parece seguro e padrão."}
                  {record.analysis.riskScore >= 30 && record.analysis.riskScore < 70 && "Atenção: Existem cláusulas que exigem cuidado."}
                  {record.analysis.riskScore >= 70 && "Alerta Vermelho: Contrato altamente abusivo ou perigoso."}
                </p>
              </div>

              {/* Summary */}
              <div className="md:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-surface-200 print:border-gray-300 print:shadow-none print:rounded-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-brand-600 print:text-gray-700" />
                  </div>
                  <h3 className="text-xl font-bold text-surface-900 tracking-tight print:text-gray-900">
                    Resumo Executivo
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2">
                  <div className="bg-surface-50 p-4 rounded-2xl border border-surface-100 print:border-gray-200 print:shadow-none">
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1 print:text-gray-500">Tipo de Contrato</span>
                    <span className="text-surface-900 font-bold print:text-gray-900">{record.analysis.summary.type}</span>
                  </div>
                  <div className="bg-surface-50 p-4 rounded-2xl border border-surface-100 print:border-gray-200 print:shadow-none">
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1 print:text-gray-500">Duração</span>
                    <span className="text-surface-900 font-bold print:text-gray-900">{record.analysis.summary.duration}</span>
                  </div>
                  <div className="bg-surface-50 p-4 rounded-2xl border border-surface-100 sm:col-span-2 print:border-gray-200 print:shadow-none">
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1 print:text-gray-500">Foro / Jurisdição</span>
                    <span className="text-surface-900 font-bold print:text-gray-900">{record.analysis.summary.jurisdiction || "Não especificado"}</span>
                  </div>
                  <div className="bg-surface-50 p-5 rounded-2xl border border-surface-100 sm:col-span-2 print:border-gray-200 print:shadow-none">
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-2 print:text-gray-500">Objetivo Principal</span>
                    <span className="text-surface-700 leading-relaxed print:text-gray-900">
                      <DictionaryText text={record.analysis.summary.objective} dictionary={record.analysis.dictionary} />
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Risks */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-[2rem] p-8 shadow-sm border border-surface-200 print:border-gray-300 print:shadow-none print:rounded-xl print:break-inside-avoid"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-red-500 print:text-gray-700" />
                </div>
                <h3 className="text-xl font-bold text-surface-900 tracking-tight print:text-gray-900">
                  Riscos Identificados
                </h3>
                <span className="ml-auto bg-surface-100 text-surface-600 py-1 px-3 rounded-full text-xs font-bold">
                  {record.analysis.risks.length} encontrados
                </span>
              </div>

              {record.analysis.risks.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-500">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-emerald-900 mb-2">Nenhum risco significativo</h4>
                  <p className="text-emerald-700 max-w-md">A análise não identificou cláusulas abusivas ou perigosas neste documento.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {record.analysis.risks.map((risk, i) => (
                    <div 
                      key={i} 
                      onClick={() => {
                        if (risk.quote) {
                          setSelectedQuote(risk.quote);
                          setIsSplitScreen(true);
                        }
                      }}
                      className={cn(
                        "p-6 rounded-[1.5rem] border bg-surface-50 flex flex-col gap-4 print:border-gray-200 print:shadow-none print:break-inside-avoid transition-colors hover:bg-white",
                        risk.quote ? "cursor-pointer" : "",
                        risk.severity === "high" ? "border-red-200 hover:border-red-300" :
                        risk.severity === "medium" ? "border-amber-200 hover:border-amber-300" :
                        "border-surface-200 hover:border-surface-300",
                        selectedQuote === risk.quote && risk.quote ? "ring-2 ring-brand-500 shadow-md" : ""
                      )}>
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 print:border print:border-gray-200",
                          risk.severity === "high" ? "bg-red-100 text-red-600" :
                          risk.severity === "medium" ? "bg-amber-100 text-amber-600" :
                          "bg-surface-200 text-surface-600"
                        )}>
                          <ShieldAlert className="w-5 h-5 print:text-gray-700" />
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h4 className="font-bold text-surface-900 text-lg tracking-tight print:text-gray-900">
                              <DictionaryText text={risk.title} dictionary={record.analysis.dictionary} />
                            </h4>
                            {risk.category && (
                              <span className={cn(
                                "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider print:border print:border-gray-300 print:bg-transparent print:text-gray-700",
                                risk.category === "financeiro" ? "bg-emerald-100 text-emerald-700" :
                                risk.category === "legal" ? "bg-brand-100 text-brand-700" :
                                risk.category === "operacional" ? "bg-purple-100 text-purple-700" :
                                "bg-surface-200 text-surface-700"
                              )}>
                                {risk.category}
                              </span>
                            )}
                          </div>
                          <p className="text-surface-600 leading-relaxed print:text-gray-700">
                            <DictionaryText text={risk.description} dictionary={record.analysis.dictionary} />
                          </p>
                        </div>
                      </div>
                      
                      {/* Rewrite Suggestion */}
                      {risk.rewriteSuggestion && (
                        <div className="mt-2 ml-14 p-5 bg-brand-50 rounded-2xl border border-brand-100 print:bg-gray-50 print:border-gray-200">
                          <div className="flex items-center gap-2 mb-3">
                            <PenTool className="w-4 h-4 text-brand-600 print:text-gray-600" />
                            <span className="text-xs font-bold text-brand-800 uppercase tracking-wider print:text-gray-700">Sugestão de Redação Mais Segura</span>
                          </div>
                          <p className="text-brand-900 font-medium italic print:text-gray-800 leading-relaxed">"{risk.rewriteSuggestion}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Parties & Financials Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 print:block print:space-y-6"
            >
              {/* Parties */}
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-surface-200 print:border-gray-300 print:shadow-none print:rounded-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-surface-600" />
                  </div>
                  <h3 className="text-xl font-bold text-surface-900 tracking-tight">
                    Partes Envolvidas
                  </h3>
                </div>
                <div className="space-y-4">
                  {record.analysis.parties?.map((party, i) => (
                    <div key={i} className="bg-surface-50 p-4 rounded-2xl border border-surface-100 flex items-center gap-4 print:border-gray-200 print:shadow-none">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-surface-400 flex-shrink-0 shadow-sm print:border print:border-gray-200">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-0.5">{party.role}</span>
                        <span className="text-surface-900 font-bold">{party.name}</span>
                      </div>
                    </div>
                  ))}
                  {(!record.analysis.parties || record.analysis.parties.length === 0) && (
                    <p className="text-surface-500 text-sm italic">Nenhuma parte identificada.</p>
                  )}
                </div>
              </div>

              {/* Financials */}
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-surface-200 print:border-gray-300 print:shadow-none print:rounded-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600 print:text-gray-700" />
                  </div>
                  <h3 className="text-xl font-bold text-surface-900 tracking-tight print:text-gray-900">
                    Financeiro
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-surface-50 p-4 rounded-2xl border border-surface-100 print:border-gray-200 print:shadow-none">
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1 print:text-gray-500">Valor Total</span>
                    <span className="text-surface-900 font-bold text-lg print:text-gray-900">{record.analysis.financials?.value || "Não especificado"}</span>
                  </div>
                  <div className="bg-surface-50 p-4 rounded-2xl border border-surface-100 print:border-gray-200 print:shadow-none">
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1 print:text-gray-500">Condições de Pagamento</span>
                    <span className="text-surface-700 leading-relaxed print:text-gray-900">
                      <DictionaryText text={record.analysis.financials?.paymentTerms || "Não especificado"} dictionary={record.analysis.dictionary} />
                    </span>
                  </div>
                  <div className="bg-surface-50 p-4 rounded-2xl border border-surface-100 print:border-gray-200 print:shadow-none">
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1 print:text-gray-500">Multas e Juros</span>
                    <span className="text-surface-700 leading-relaxed print:text-gray-900">
                      <DictionaryText text={record.analysis.financials?.fines || "Não especificado"} dictionary={record.analysis.dictionary} />
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Important Points */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-[2rem] p-8 shadow-sm border border-surface-200 print:border-gray-300 print:shadow-none print:rounded-xl print:break-inside-avoid"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center">
                  <Info className="w-5 h-5 text-brand-600 print:text-gray-700" />
                </div>
                <h3 className="text-xl font-bold text-surface-900 tracking-tight print:text-gray-900">
                  Pontos Importantes
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {record.analysis.importantPoints.map((point, i) => (
                  <div key={i} className="p-6 rounded-[1.5rem] border border-surface-100 bg-surface-50 flex flex-col gap-3 print:border-gray-200 print:shadow-none print:break-inside-avoid">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-brand-500 flex-shrink-0 print:text-gray-700" />
                      <h4 className="font-bold text-surface-900 print:text-gray-900">
                        <DictionaryText text={point.title} dictionary={record.analysis.dictionary} />
                      </h4>
                    </div>
                    <p className="text-sm text-surface-600 leading-relaxed print:text-gray-700">
                      <DictionaryText text={point.description} dictionary={record.analysis.dictionary} />
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Chat Column */}
          {!isSplitScreen && (
            <div className="xl:col-span-1 print:hidden">
              <div className="sticky top-24">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-[2rem] shadow-xl border border-surface-200 h-[800px] flex flex-col relative overflow-hidden"
              >
                
                {isFreeUser && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)' }}>
                    <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mb-6 relative">
                      <Lock className="w-8 h-8 relative z-10" />
                      <div className="absolute inset-0 bg-brand-400 blur-xl opacity-20 rounded-full"></div>
                    </div>
                    <h3 className="text-2xl font-bold text-surface-900 mb-3 tracking-tight">Chat com Contrato</h3>
                    <p className="text-surface-600 mb-8 leading-relaxed">Faça perguntas específicas sobre o contrato e tire dúvidas com a IA. Exclusivo para assinantes do plano Pro.</p>
                    <Link to="/pricing" className="px-8 py-4 bg-surface-900 text-white rounded-full font-bold hover:bg-surface-800 transition-all premium-shadow hover:premium-shadow-hover hover:-translate-y-0.5">
                      Fazer Upgrade Agora
                    </Link>
                  </div>
                )}

                <div className="p-6 border-b border-surface-100 bg-surface-50">
                  <h3 className="text-lg font-bold text-surface-900 flex items-center gap-2 tracking-tight">
                    <Sparkles className="w-5 h-5 text-brand-500" />
                    Assistente IA
                  </h3>
                  <p className="text-sm text-surface-500 mt-1">Tire dúvidas específicas sobre o documento.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface-50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white border border-surface-200 text-surface-700 p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed shadow-sm">
                      Olá! Eu analisei este contrato. O que você gostaria de saber? Por exemplo: "Tem multa de cancelamento?" ou "Quais são minhas obrigações?"
                    </div>
                  </div>

                  {chatHistory.map((msg, i) => (
                    <div key={i} className={cn("flex items-start gap-3", msg.role === "user" ? "flex-row-reverse" : "")}>
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
                        msg.role === "user" ? "bg-surface-900 text-white" : "bg-brand-100 text-brand-600"
                      )}>
                        {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={cn(
                        "p-4 rounded-2xl text-sm leading-relaxed max-w-[85%] shadow-sm",
                        msg.role === "user" 
                          ? "bg-surface-900 text-white rounded-tr-none" 
                          : "bg-white border border-surface-200 text-surface-700 rounded-tl-none"
                      )}>
                        {msg.parts[0].text}
                      </div>
                    </div>
                  ))}

                  {isChatting && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-white border border-surface-200 text-surface-700 p-4 rounded-2xl rounded-tl-none text-sm flex items-center gap-2 shadow-sm h-12">
                        <div className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        <div className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-surface-100 bg-white">
                  <form onSubmit={handleChat} className="flex items-center gap-2 relative">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Pergunte algo..."
                      className="flex-1 bg-surface-50 border border-surface-200 rounded-full py-3.5 pl-5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                      disabled={isChatting || isFreeUser}
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || isChatting || isFreeUser}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-600 text-white rounded-full flex items-center justify-center hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </button>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
