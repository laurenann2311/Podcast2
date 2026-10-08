import { PodcastSegment, PodcastLanguage } from '../types/podcast';

export interface PresetScript {
  id: string;
  title: string;
  topic: string;
  language: PodcastLanguage;
  description: string;
  segments: Omit<PodcastSegment, 'id' | 'status'>[];
}

export const SAMPLE_SCRIPTS: PresetScript[] = [
  // PORTUGUESE (PORTUGAL) SCRIPTS - pt-PT (STANDARD DEFAULT)
  {
    id: 'pt-historia-narrativa',
    title: 'Crónicas e Memórias de Portugal',
    topic: 'História & Investigação',
    language: 'pt-PT',
    description: 'Diálogo envolvente em português europeu com tom documental, debate histórico e ritmo natural de podcast.',
    segments: [
      {
        speaker: 'male',
        text: 'É uma história fascinante que atravessa décadas da nossa memória coletiva e revela a determinação de quem moldou o país.',
      },
      {
        speaker: 'female',
        text: 'Sem dúvida. Quando analisamos os documentos e os registos da época, percebemos que nada daquilo aconteceu por acaso.',
      },
      {
        speaker: 'male',
        text: 'Exatamente. A capacidade de ultrapassar as adversidades e transformar uma pequena localidade num polo de desenvolvimento é notável.',
      },
      {
        speaker: 'female',
        text: 'E o mais impressionante é como esses acontecimentos históricos continuam a ecoar no presente, mostrando o valor da perseverança.',
      },
      {
        speaker: 'male',
        text: 'É esse cruzamento entre a memória e a modernidade que torna esta investigação tão rica para quem nos ouve.',
      },
      {
        speaker: 'female',
        text: 'Com certeza! Vamos então aprofundar os próximos capítulos desta jornada.',
      },
    ],
  },
  {
    id: 'pt-lisboa-tech',
    title: 'Inovação e Tecnologia em Lisboa',
    topic: 'Tecnologia & Sociedade',
    language: 'pt-PT',
    description: 'Um diálogo dinâmico e natural em português europeu sobre o ecossistema tecnológico e a Web.',
    segments: [
      {
        speaker: 'male',
        text: 'Olá a todos e bem-vindos ao episódio desta semana gravado diretamente de Lisboa. Como estão todos hoje?',
      },
      {
        speaker: 'female',
        text: 'Olá! É fantástico estar aqui hoje. O ecossistema tecnológico em Portugal tem evoluído a uma velocidade impressionante nos últimos anos.',
      },
      {
        speaker: 'male',
        text: 'É verdade. Desde o Hub do Beato até aos centros de investigação no Porto e em Coimbra, vemos equipas a desenvolver soluções de ponta.',
      },
      {
        speaker: 'female',
        text: 'E o mais interessante é como a voz digital em português europeu está a atingir um nível de naturalidade surpreendente, respeitando a nossa fonética única.',
      },
      {
        speaker: 'male',
        text: 'Com certeza. Os ouvintes já não precisam de se contentar com sons robóticos; agora temos entoações humanas autênticas com controlo total de velocidade e tonalidade.',
      },
      {
        speaker: 'female',
        text: 'Ora nem mais! Vamos então continuar com os tópicos da nossa conversa de hoje.',
      },
    ],
  },
  {
    id: 'pt-cultura-cafe',
    title: 'A Tradição do Café e das Tertúlias',
    topic: 'Cultura & Estilo de Vida',
    language: 'pt-PT',
    description: 'Uma conversa calorosa sobre o hábito português da bica e as conversas de café.',
    segments: [
      {
        speaker: 'male',
        text: 'Se há coisa que define o dia a dia em Portugal, é a paragem estratégica a meio da manhã para beber uma bica ao balcão.',
      },
      {
        speaker: 'female',
        text: 'Nem mais! Não se trata apenas da cafeína, mas sim de todo o ritual social e da conversa que se cria à volta da chávena.',
      },
      {
        speaker: 'male',
        text: 'Desde os tempos dos poetas no Chiado até aos dias de hoje, muitas das melhores ideias do país nasceram à mesa de um café histórico.',
      },
      {
        speaker: 'female',
        text: 'E o melhor acompanhamento será sempre um pastel de nata acabado de sair do forno, com uma pitada de canela por cima.',
      },
      {
        speaker: 'male',
        text: 'Um clássico incontornável! Fica aqui a recomendação para quem nos estiver a ouvir.',
      },
    ],
  },

  // ENGLISH SCRIPTS
  {
    id: 'en-tech-ai',
    title: 'The Future of Neural Audio',
    topic: 'Tech & Sound Engineering',
    language: 'en',
    description: 'An analytical and vibrant discussion on generative voice synthesis and podcasting technology.',
    segments: [
      {
        speaker: 'male',
        text: "Welcome back to Sound & Frequency. Today, we're exploring something that completely changes how we think about human voice synthesis.",
      },
      {
        speaker: 'female',
        text: "It really does. For decades, synthetic speech sounded robotic and flat. But today's neural audio models capture cadence, breathing, and subtle emotional nuance.",
      },
      {
        speaker: 'male',
        text: "Exactly. The ability to adjust acoustic timbre, pitch inflection, and stereo positioning in real time means creators can produce entire multi-speaker shows from their browser.",
      },
      {
        speaker: 'female',
        text: "And the implications for accessibility and localization are enormous. Imagine translating an English podcast directly into authentic European Portuguese while keeping natural pacing.",
      },
      {
        speaker: 'male',
        text: "That seamless bilingual pipeline is precisely what we're demonstrating today. Let's walk through the DSP chain and hear the difference.",
      },
      {
        speaker: 'female',
        text: "Let's dive right in!",
      },
    ],
  },
  {
    id: 'en-space-discovery',
    title: 'Deep Ocean & Outer Space',
    topic: 'Science & Exploration',
    language: 'en',
    description: 'A captivating exchange about the uncharted frontiers of our universe.',
    segments: [
      {
        speaker: 'male',
        text: "Did you know that we've mapped the surface of Mars with greater detail than the ocean floor right here on Earth?",
      },
      {
        speaker: 'female',
        text: "It sounds incredible, but it's true. Over eighty percent of the global seabed remains unobserved by human eyes or high-resolution sonar.",
      },
      {
        speaker: 'male',
        text: "Yet every time hydrothermal vent expeditions descend into the Mariana Trench, researchers uncover organisms thriving in complete darkness.",
      },
      {
        speaker: 'female',
        text: "Which gives astrobiologists crucial clues for what life might look like under the ice sheets of Jupiter's moon, Europa.",
      },
      {
        speaker: 'male',
        text: "It reminds us that exploration isn't just about looking upward into the stars, but also looking deeper into our own living world.",
      },
      {
        speaker: 'female',
        text: "A humbling thought for any curious listener.",
      },
    ],
  },

  // PORTUGUESE (PORTUGAL) SCRIPTS - pt-PT
  {
    id: 'pt-lisboa-tech',
    title: 'Inovação e Tecnologia em Lisboa',
    topic: 'Tecnologia & Sociedade',
    language: 'pt-PT',
    description: 'Um diálogo dinâmico e natural em português europeu sobre o ecossistema tecnológico e a Web.',
    segments: [
      {
        speaker: 'male',
        text: 'Olá a todos e bem-vindos ao episódio desta semana gravado diretamente de Lisboa. Como estão todos hoje?',
      },
      {
        speaker: 'female',
        text: 'Olá! É fantástico estar aqui hoje. O ecossistema tecnológico em Portugal tem evoluído a uma velocidade impressionante nos últimos anos.',
      },
      {
        speaker: 'male',
        text: 'É verdade. Desde o Hub do Beato até aos centros de investigação no Porto e em Coimbra, vemos equipas a desenvolver soluções de ponta.',
      },
      {
        speaker: 'female',
        text: 'E o mais interessante é como a voz digital em português europeu está a atingir um nível de naturalidade surpreendente, respeitando a nossa fonética única.',
      },
      {
        speaker: 'male',
        text: 'Com certeza. Os ouvintes já não precisam de se contentar com sons robóticos; agora temos entoações humanas autênticas com controlo total de velocidade e tonalidade.',
      },
      {
        speaker: 'female',
        text: 'Ora nem mais! Vamos então continuar com os tópicos da nossa conversa de hoje.',
      },
    ],
  },
  {
    id: 'pt-cultura-cafe',
    title: 'A Tradição do Café e das Tertúlias',
    topic: 'Cultura & Estilo de Vida',
    language: 'pt-PT',
    description: 'Uma conversa calorosa sobre o hábito português da bica e as conversas de café.',
    segments: [
      {
        speaker: 'male',
        text: 'Se há coisa que define o dia a dia em Portugal, é a paragem estratégica a meio da manhã para beber uma bica ao balcão.',
      },
      {
        speaker: 'female',
        text: 'Nem mais! Não se trata apenas da cafeína, mas sim de todo o ritual social e da conversa que se cria à volta da chávena.',
      },
      {
        speaker: 'male',
        text: 'Desde os tempos dos poetas no Chiado até aos dias de hoje, muitas das melhores ideias do país nasceram à mesa de um café histórico.',
      },
      {
        speaker: 'female',
        text: 'E o melhor acompanhamento será sempre um pastel de nata acabado de sair do forno, com uma pitada de canela por cima.',
      },
      {
        speaker: 'male',
        text: 'Um clássico incontornável! Fica aqui a recomendação para quem nos estiver a ouvir.',
      },
    ],
  },
];
