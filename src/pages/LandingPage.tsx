import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, FileText, ShieldAlert, Zap, Lock, Scale, FileSearch, Sparkles, Star, ChevronDown, Quote } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: "Como funciona a análise de contrato?", a: "Você envia um arquivo (PDF, DOCX, Imagem) ou cola o texto do contrato. Nossa Inteligência Artificial analisa o documento em segundos e gera um resumo claro, destacando riscos, armadilhas e pontos importantes em linguagem simples." },
    { q: "Posso enviar qualquer tipo de contrato?", a: "Sim! A ferramenta funciona perfeitamente com contratos de aluguel, prestação de serviços, contratos de trabalho, termos de uso de aplicativos, NDAs e diversos outros documentos legais." },
    { q: "Meus contratos ficam seguros?", a: "Absolutamente. Seus documentos são analisados com criptografia de ponta a ponta e não são compartilhados com terceiros nem usados para treinar modelos públicos de IA. Você também pode apagá-los do seu histórico a qualquer momento." },
    { q: "A análise substitui um advogado?", a: "Não. A ferramenta é um assistente poderoso para te ajudar a entender o contrato de forma simples e identificar possíveis riscos antes de assinar, mas não substitui o aconselhamento jurídico profissional de um advogado." },
    { q: "Quais arquivos posso enviar?", a: "A plataforma aceita arquivos em formato PDF, DOCX (Word), TXT, além de imagens (JPG, PNG) usando tecnologia OCR para extrair o texto. Você também pode simplesmente copiar e colar o texto diretamente." }
  ];

  const testimonials = [
    { name: "Mariana Silva", role: "Freelancer de Design", text: "Me salvou de assinar um contrato que cedia todos os meus direitos autorais para sempre. A análise foi instantânea e super clara.", avatar: "https://i.pravatar.cc/150?img=1" },
    { name: "Carlos Eduardo", role: "Pequeno Empresário", text: "Uso para revisar contratos de fornecedores. O Cláusula Fácil aponta exatamente onde estão as pegadinhas e multas abusivas.", avatar: "https://i.pravatar.cc/150?img=11" },
    { name: "Ana Beatriz", role: "Inquilina", text: "Estava prestes a alugar um apartamento com uma cláusula de rescisão terrível. A IA me avisou e consegui renegociar com a imobiliária.", avatar: "https://i.pravatar.cc/150?img=5" },
  ];

  return (
    <div className="flex flex-col w-full font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-surface-50 pt-32 pb-40">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/abstract/1920/1080?blur=10')] opacity-[0.03] mix-blend-overlay" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-500/10 rounded-full blur-3xl -z-10" />
        
        <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-sm font-semibold mb-8">
              <Sparkles className="w-4 h-4" />
              <span>A nova era da análise de contratos</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-surface-900 mb-8 leading-[1.1] text-balance">
              Entenda qualquer contrato em <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">segundos.</span>
            </h1>
            <p className="text-xl md:text-2xl text-surface-600 mb-12 max-w-3xl mx-auto leading-relaxed text-balance">
              Envie um contrato e descubra riscos, cláusulas escondidas e pontos importantes explicados em linguagem simples, sem "juridiquês".
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/dashboard" 
                className="w-full sm:w-auto px-8 py-4 bg-brand-600 text-white rounded-full font-semibold text-lg transition-all premium-shadow hover:premium-shadow-hover hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Analisar meu contrato
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-sm text-surface-500 sm:ml-4 font-medium">
                Não requer cartão de crédito.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-32 bg-white relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-surface-900 mb-6 tracking-tight">
              Você assina sem ler?
            </h2>
            <p className="text-lg md:text-xl text-surface-600 max-w-2xl mx-auto text-balance">
              A maioria das pessoas aceita contratos sem entender as consequências. Isso pode gerar problemas financeiros e dores de cabeça legais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Contratos de Aluguel", desc: "Multas abusivas e responsabilidades de manutenção ocultas.", icon: FileText },
              { title: "Contratos de Freelancer", desc: "Direitos autorais cedidos sem saber e prazos irreais.", icon: Zap },
              { title: "Termos de Aplicativos", desc: "Uso indevido de dados pessoais e renovações automáticas.", icon: Lock },
              { title: "Contratos de Trabalho", desc: "Cláusulas de não-competição e rescisões desfavoráveis.", icon: Scale },
              { title: "Contratos de Softwares", desc: "Limitações de responsabilidade e taxas escondidas.", icon: FileSearch },
              { title: "Empréstimos", desc: "Juros compostos abusivos e penalidades por atraso.", icon: ShieldAlert }
            ].map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface-50 p-8 rounded-3xl border border-surface-200 hover:border-brand-200 transition-colors group"
              >
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-surface-100 mb-6 group-hover:scale-110 transition-transform">
                  <item.icon className="w-7 h-7 text-brand-500" />
                </div>
                <h3 className="text-xl font-bold text-surface-900 mb-3">{item.title}</h3>
                <p className="text-surface-600 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-32 bg-surface-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1">
              <h2 className="text-3xl md:text-5xl font-bold mb-8 tracking-tight text-balance">
                A solução: Inteligência Artificial ao seu lado.
              </h2>
              <p className="text-lg md:text-xl text-surface-300 mb-10 leading-relaxed text-balance">
                O Cláusula Fácil analisa contratos automaticamente e transforma documentos complexos em explicações simples que qualquer um pode entender.
              </p>
              
              <ul className="space-y-6">
                {[
                  "Resumo claro do objetivo do contrato",
                  "Alertas visuais de riscos e armadilhas",
                  "Explicação das cláusulas mais importantes",
                  "Linguagem simples, sem 'juridiquês'"
                ].map((item, i) => (
                  <motion.li 
                    key={i} 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-brand-400" />
                    </div>
                    <span className="text-lg text-surface-100 font-medium">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
            <div className="flex-1 w-full">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-surface-800 rounded-[2rem] p-8 border border-surface-700 shadow-2xl relative"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap">
                  <ShieldAlert className="w-4 h-4" />
                  Risco Encontrado
                </div>
                <div className="space-y-5">
                  <div className="h-4 bg-surface-700 rounded-full w-3/4"></div>
                  <div className="h-4 bg-surface-700 rounded-full w-full"></div>
                  <div className="h-4 bg-surface-700 rounded-full w-5/6"></div>
                  <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl -mt-[97px] relative z-10 backdrop-blur-sm">
                    <div className="flex items-center gap-3 text-red-400 font-semibold mb-3">
                      <ShieldAlert className="w-5 h-5" />
                      Cláusula de Renovação Automática
                    </div>
                    <p className="text-surface-300 text-sm leading-relaxed">
                      O contrato será renovado automaticamente por mais 12 meses se não for cancelado com 30 dias de antecedência.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-32 bg-surface-50 relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center mb-24">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white p-8 rounded-[2rem] shadow-sm border border-surface-200">
              <div className="text-5xl font-black text-brand-600 mb-2 tracking-tighter">10.000+</div>
              <div className="text-surface-600 font-medium text-lg">Contratos analisados</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-white p-8 rounded-[2rem] shadow-sm border border-surface-200">
              <div className="text-5xl font-black text-brand-600 mb-2 tracking-tighter">3.000+</div>
              <div className="text-surface-600 font-medium text-lg">Usuários ativos</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-white p-8 rounded-[2rem] shadow-sm border border-surface-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="text-5xl font-black text-brand-600 tracking-tighter">4.9</div>
                <div className="flex flex-col gap-1">
                  <div className="flex text-amber-400">
                    <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" />
                  </div>
                </div>
              </div>
              <div className="text-surface-600 font-medium text-lg">Avaliação média</div>
            </motion.div>
          </div>

          {/* Testimonials */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-surface-900 mb-6 tracking-tight">
              Quem usa, confia.
            </h2>
            <p className="text-lg text-surface-600 max-w-2xl mx-auto text-balance">
              Veja como nossa inteligência artificial está ajudando profissionais e empresas a assinarem contratos com segurança.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-[2rem] shadow-sm border border-surface-200 relative"
              >
                <Quote className="absolute top-8 right-8 w-10 h-10 text-brand-100" />
                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <img src={testimonial.avatar} alt={testimonial.name} className="w-14 h-14 rounded-full object-cover border-2 border-surface-100" />
                  <div>
                    <h4 className="font-bold text-surface-900">{testimonial.name}</h4>
                    <p className="text-sm text-surface-500 font-medium">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-surface-700 leading-relaxed relative z-10">
                  "{testimonial.text}"
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 bg-white relative">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-surface-900 mb-6 tracking-tight">
              Perguntas Frequentes
            </h2>
            <p className="text-lg text-surface-600 max-w-2xl mx-auto text-balance">
              Tudo o que você precisa saber sobre como analisamos seus contratos.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "border rounded-2xl overflow-hidden transition-colors duration-300",
                  openFaq === i ? "bg-surface-50 border-brand-200" : "bg-white border-surface-200 hover:border-brand-200"
                )}
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-bold text-surface-900 pr-4">{faq.q}</span>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300",
                    openFaq === i ? "bg-brand-100 text-brand-600 rotate-180" : "bg-surface-100 text-surface-500"
                  )}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 text-surface-600 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-brand-600 text-white text-center">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight">
            Pronto para assinar com segurança?
          </h2>
          <p className="text-xl text-brand-100 mb-12 max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já usam o Cláusula Fácil para entender o que estão assinando.
          </p>
          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-2 px-10 py-5 bg-white text-brand-600 rounded-full font-bold text-xl transition-all hover:scale-105 shadow-xl hover:shadow-2xl"
          >
            Começar Agora Gratuitamente
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>
    </div>
  );
}
