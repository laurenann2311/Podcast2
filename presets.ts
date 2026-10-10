import { PresetBroadcast, VoiceOption } from "../types";

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: "Fenrir",
    name: "Fenrir — O Baixo Solene de Estado",
    role: "Emissora Nacional Newsreader (Quelhas, Lisboa)",
    description: "Baixo-barítono muito profundo, cavernoso e solene, com ressonância peitoral máxima e autoridade ministerial.",
    pitchHint: "Baixo cavernoso, grave e pausado",
  },
  {
    id: "Charon",
    name: "Charon — O Barítono Nobre de Noticiário",
    role: "Comentador Noticioso & Editorialista de Época",
    description: "Voz média-grave culta, aristocrática e elegante de estúdio, típica do Jornal Falado e crónicas internacionais.",
    pitchHint: "Barítono distinto, nobre e equilibrado",
  },
  {
    id: "Puck",
    name: "Puck — O Repórter Dinâmico de Campo",
    role: "Correspondente de Exterior em Emissão Direta",
    description: "Voz masculina viva, enérgica, incisiva e projetada, ideal para reportagens nas minas, portos e exterior.",
    pitchHint: "Barítono enérgico, vivo e direto",
  },
  {
    id: "Zephyr",
    name: "Zephyr — O Cronista Noturno de Salão",
    role: "Apresentador Noturno & Boletins Marítimos",
    description: "Voz aveludada, suave, profunda e intimista, com caloroso efeito de proximidade de microfone de fita.",
    pitchHint: "Aveludado, suave e acolhedor",
  },
];

export const PRESET_BROADCASTS: PresetBroadcast[] = [
  {
    id: "espadanal-1950s",
    title: "Visita Ministerial às Minas de Lenhite do Espadanal (1950s)",
    date: "25 de Outubro (c. 1952)",
    location: "Rio Maior, Ribatejo",
    category: "Noticiário Industrial & Mineiro",
    stationName: "Emissora Nacional de Radiodifusão",
    frequency: 756, // kHz (Lisboa I)
    suggestedVoice: "Fenrir",
    text: "Em visita particular às instalações das Minas de Lenhite do Espadanal, chegou a esta vila, cerca das 15 horas do dia 25, o Senhor Ministro da Economia, que, como já dissemos no último número do nosso jornal, em informação aliás incompleta, era aguardado junto do cais do caminho de ferro mineiro pelos senhores Doutor Astério Rosa, Administrador Delegado da Empresa Industrial Carbonífera Electrotécnica, Limitada, proprietária das referidas minas; Engenheiro Cílio Rosa, Administrador da mesma empresa; Engenheiro Falcão Mena, Director Técnico das Minas; Major Cabral de Quadros e Doutor Branco, respectivamente, Presidente e Secretário da Câmara Municipal; Doutor Vidigal Pais, médico da empresa, e Doutor Calado da Maia, que representava a União Nacional, na ausência do Presidente do mesmo organismo; Engenheiros Castro e Sola, Director Geral de Minas; Ferreira do Amaral, Director Geral dos Serviços Industriais; Alexandre Vasconcelos Matias.",
    historicalContext: "Registo histórico da visita oficial às Minas do Espadanal em Rio Maior, exploradas pela Empresa Industrial Carbonífera Electrotécnica, Lda. Durante as décadas de 1940 e 1950, as jazidas de lenhite do Espadanal foram um pilar estratégico da produção energética e industrial de Portugal, contando com uma linha de caminho de ferro própria (caminho de ferro mineiro) para escoamento do carvão até aos fornos e termoelétricas.",
  },
  {
    id: "boletim-emissora-nacional",
    title: "Abertura de Emissão da Emissora Nacional (1954)",
    date: "1954",
    location: "Estúdios da Rua do Quelhas, Lisboa",
    category: "Abertura Oficial de Antena",
    stationName: "Emissora Nacional - Lisboa I",
    frequency: 666,
    suggestedVoice: "Charon",
    text: "Aqui Emissora Nacional de Radiodifusão, transmitindo em ondas médias de quatrocentos e trinta e cinco metros e na frequência de seiscentos e sessenta e seis quilociclos por segundo. São exatamente vinte e uma horas. Damos início ao nosso Jornal Falado com o sumário dos acontecimentos nacionais e internacionais mais relevantes do dia.",
    historicalContext: "O tom característico de abertura de emissão da rádio pública portuguesa na década de 1950, emitido a partir dos estúdios centrais de Lisboa com solenes sinais horários.",
  },
  {
    id: "noticia-linha-rio-maior",
    title: "Caminho de Ferro Mineiro e Produção de Lenhite",
    date: "c. 1950",
    location: "Vila de Rio Maior",
    category: "Reportagem Económica",
    stationName: "Rádio Clube Português",
    frequency: 1035,
    suggestedVoice: "Puck",
    text: "Informa-se que os comboios da linha mineira do Espadanal mantêm ritmo intenso de transporte de lenhite para os centros industriais da capital e do norte. Os ilustres engenheiros e mestres de lavra confirmam a excelência da exploração nas galerias subterrâneas de Rio Maior, assegurando o abastecimento às centrais elétricas do país.",
    historicalContext: "Crónica sobre a circulação das locomotivas a vapor e a diesel no caminho de ferro mineiro de via estreita do Espadanal, essencial para o transporte do minério.",
  },
  {
    id: "boletim-meteorologico-maritimo",
    title: "Boletim Meteorológico e dos Portos Nacionais (1956)",
    date: "Novembro de 1956",
    location: "Serviço Meteorológico Nacional",
    category: "Boletim Marítimo e Meteorologia",
    stationName: "Rádio Renascença - Emissora Católica",
    frequency: 1259,
    suggestedVoice: "Zephyr",
    text: "Boletim dos Portos e Navegação para a Costa Ocidental Portuguesa: Vento de noroeste bonançoso a moderado no Cabo Carvoeiro e Cabo da Roca. Mar com vagas de dois a três metros. Visibilidade boa. Barómetros em lenta subida em todo o território continental.",
    historicalContext: "Os boletins de navegação e meteorologia transmitidos na rádio dos anos 50 eram vitais para os pescadores e a marinha mercante de Portugal.",
  },
];
