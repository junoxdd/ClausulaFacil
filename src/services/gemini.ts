import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ContractAnalysis {
  summary: {
    type: string;
    duration: string;
    objective: string;
    jurisdiction: string;
  };
  parties: {
    role: string;
    name: string;
  }[];
  financials: {
    value: string;
    paymentTerms: string;
    fines: string;
  };
  risks: {
    title: string;
    description: string;
    severity: "high" | "medium" | "low";
    category: "financeiro" | "legal" | "operacional" | "outro";
    rewriteSuggestion?: string;
    quote?: string;
  }[];
  importantPoints: {
    title: string;
    description: string;
  }[];
  dictionary: {
    term: string;
    definition: string;
  }[];
  riskScore: number;
}

export interface ContractComparison {
  changes: {
    type: "added" | "removed" | "modified";
    description: string;
  }[];
  mitigatedRisks: {
    title: string;
    description: string;
  }[];
  newRisks: {
    title: string;
    description: string;
    severity: "high" | "medium" | "low";
  }[];
  conclusion: string;
}

export async function analyzeContract(text: string, fileBase64?: string, mimeType?: string): Promise<ContractAnalysis> {
  const parts: any[] = [];
  
  if (fileBase64 && mimeType) {
    parts.push({
      inlineData: {
        data: fileBase64,
        mimeType: mimeType
      }
    });
    parts.push({ text: "Analise o contrato em anexo e extraia as informações solicitadas em JSON." });
  } else {
    parts.push({ text: `Analise o seguinte contrato e extraia as informações solicitadas em JSON. O contrato é:\n\n${text}` });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: { parts },
    config: {
      systemInstruction: "Você é um advogado especialista em contratos, mas que explica tudo de forma extremamente simples e amigável para pessoas leigas. Seu objetivo é proteger o usuário, destacando riscos, cláusulas abusivas, multas, renovações automáticas e taxas escondidas. Você deve ser direto, claro, extrair entidades importantes como partes e valores, e usar linguagem do dia a dia. Para cada risco encontrado, forneça uma sugestão de reescrita da cláusula para torná-la justa. Além disso, identifique termos jurídicos complexos (ex: Foro, Rescisão Imotivada, Alienação Fiduciária) presentes no contrato e forneça uma explicação simples para eles no dicionário.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "O tipo de contrato (ex: Aluguel, Prestação de Serviços, Termos de Uso)" },
              duration: { type: Type.STRING, description: "A duração do contrato (ex: 12 meses, Indeterminado)" },
              objective: { type: Type.STRING, description: "O objetivo principal do acordo em uma frase simples" },
              jurisdiction: { type: Type.STRING, description: "O foro ou jurisdição onde o contrato será julgado em caso de disputa (ex: Foro da Comarca de São Paulo)" }
            },
            required: ["type", "duration", "objective", "jurisdiction"]
          },
          parties: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                role: { type: Type.STRING, description: "O papel da parte (ex: Locador, Contratante, Usuário)" },
                name: { type: Type.STRING, description: "O nome ou identificação da parte (se disponível, senão 'Não especificado')" }
              },
              required: ["role", "name"]
            }
          },
          financials: {
            type: Type.OBJECT,
            properties: {
              value: { type: Type.STRING, description: "O valor total ou mensal do contrato (ex: R$ 1.500,00/mês, Gratuito)" },
              paymentTerms: { type: Type.STRING, description: "Como e quando o pagamento deve ser feito (ex: Todo dia 5, Cartão de Crédito)" },
              fines: { type: Type.STRING, description: "Resumo das multas por atraso ou rescisão (ex: 2% ao mês por atraso)" }
            },
            required: ["value", "paymentTerms", "fines"]
          },
          risks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Título curto do risco (ex: Multa de Cancelamento Abusiva)" },
                description: { type: Type.STRING, description: "Explicação simples do risco e por que é perigoso" },
                severity: { type: Type.STRING, description: "high, medium, ou low" },
                category: { type: Type.STRING, description: "financeiro, legal, operacional, ou outro" },
                rewriteSuggestion: { type: Type.STRING, description: "Sugestão de como reescrever a cláusula para torná-la justa e equilibrada para ambas as partes." },
                quote: { type: Type.STRING, description: "O trecho exato do contrato original que contém este risco, para que possamos grifá-lo na tela." }
              },
              required: ["title", "description", "severity", "category", "rewriteSuggestion", "quote"]
            }
          },
          importantPoints: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Título do ponto importante (ex: Prazos de Pagamento)" },
                description: { type: Type.STRING, description: "Explicação simples da obrigação ou condição" }
              },
              required: ["title", "description"]
            }
          },
          dictionary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING, description: "O termo jurídico complexo encontrado no contrato (ex: Foro, Rescisão Imotivada)" },
                definition: { type: Type.STRING, description: "Explicação em linguagem simples e do dia a dia do que o termo significa." }
              },
              required: ["term", "definition"]
            }
          },
          riskScore: { type: Type.NUMBER, description: "Uma nota de 0 a 100, onde 100 é um contrato extremamente abusivo e perigoso, e 0 é um contrato perfeito e seguro." }
        },
        required: ["summary", "parties", "financials", "risks", "importantPoints", "dictionary", "riskScore"]
      }
    }
  });

  const jsonStr = response.text?.trim() || "{}";
  return JSON.parse(jsonStr) as ContractAnalysis;
}

export async function compareContracts(
  v1: { text?: string, base64?: string, mimeType?: string },
  v2: { text?: string, base64?: string, mimeType?: string }
): Promise<ContractComparison> {
  const parts: any[] = [];
  parts.push({ text: "Você é um advogado especialista. Compare as duas versões do contrato abaixo e extraia as diferenças, riscos mitigados e novos riscos em JSON." });

  parts.push({ text: "\n\n--- CONTRATO ORIGINAL (V1) ---\n" });
  if (v1.base64 && v1.mimeType) {
    parts.push({ inlineData: { data: v1.base64, mimeType: v1.mimeType } });
  } else if (v1.text) {
    parts.push({ text: v1.text });
  }

  parts.push({ text: "\n\n--- CONTRATO REVISADO (V2) ---\n" });
  if (v2.base64 && v2.mimeType) {
    parts.push({ inlineData: { data: v2.base64, mimeType: v2.mimeType } });
  } else if (v2.text) {
    parts.push({ text: v2.text });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: { parts },
    config: {
      systemInstruction: "Compare as duas versões do contrato. Identifique o que foi adicionado, removido ou modificado. Destaque se algum risco da V1 foi mitigado na V2, e se a V2 introduziu novos riscos. Forneça uma conclusão clara sobre qual versão é mais segura ou se a negociação foi bem-sucedida.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          changes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "added, removed, ou modified" },
                description: { type: Type.STRING, description: "Descrição clara da mudança" }
              },
              required: ["type", "description"]
            }
          },
          mitigatedRisks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Título do risco mitigado" },
                description: { type: Type.STRING, description: "Como o risco foi resolvido na V2" }
              },
              required: ["title", "description"]
            }
          },
          newRisks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Título do novo risco" },
                description: { type: Type.STRING, description: "Descrição do novo risco introduzido na V2" },
                severity: { type: Type.STRING, description: "high, medium, ou low" }
              },
              required: ["title", "description", "severity"]
            }
          },
          conclusion: { type: Type.STRING, description: "Conclusão geral sobre a negociação e qual versão é mais favorável." }
        },
        required: ["changes", "mitigatedRisks", "newRisks", "conclusion"]
      }
    }
  });

  const jsonStr = response.text?.trim() || "{}";
  return JSON.parse(jsonStr) as ContractComparison;
}

export async function chatWithContract(contractText: string, history: any[], message: string): Promise<string> {
  const contents = [
    { role: "user", parts: [{ text: `Aqui está o contrato:\n\n${contractText}\n\nAgora, por favor, responda à minha pergunta com base nele.` }] },
    { role: "model", parts: [{ text: "Entendido. Pode fazer sua pergunta." }] },
    ...history,
    { role: "user", parts: [{ text: message }] }
  ];

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: contents,
    config: {
      systemInstruction: "Você é um assistente jurídico amigável. Responda perguntas sobre o contrato fornecido de forma simples e direta, sem jargões jurídicos. Se a resposta não estiver no contrato, diga que não encontrou essa informação no documento.",
    }
  });

  return response.text || "Desculpe, não consegui analisar sua pergunta.";
}
