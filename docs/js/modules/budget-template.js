/**
 * Estrutura Analítica de Projeto (EAP) para Orçamentos.
 * Mapeia categorias principais para sub-serviços e suas disciplinas.
 */
export const budgetTemplate = {
  "SERVIÇOS TÉCNICOS": {
    discipline: "outro",
    items: ["Projeto Arquitetônico", "Projeto Estrutural", "Projeto de Instalações Elétricas", "Projeto de Instalações Hidrossanitárias", "Laudos e Vistorias Técnicas", "Sondagem de Solo", "Levantamento Topográfico"]
  },
  "SERVIÇOS PRELIMINARES": {
    discipline: "fundacao",
    items: ["Limpeza do Terreno", "Demolições", "Instalação do Canteiro de Obras", "Instalações Provisórias (Água/Energia)", "Tapumes e Placas de Obra", "Locação da Obra"]
  },
  "FUNDAÇÃO, MOVIMENTAÇÃO DE TERRA E ESCAVAÇÕES": {
    discipline: "fundacao",
    items: ["Escavação Mecanizada", "Carga e Bota-Fora de Terra", "Aterro e Compactação", "Formas para Fundação", "Armação para Fundação", "Concretagem de Fundação"]
  },
  "SUPRAESTRUTURA": {
    discipline: "fundacao",
    items: ["Formas para Pilares/Vigas/Lajes", "Armação para Estrutura", "Concretagem de Pilares", "Concretagem de Vigas e Lajes", "Montagem de Estrutura Metálica"]
  },
  "PAREDES E PAINEIS": {
    discipline: "revestimento",
    items: ["Alvenaria de Vedação", "Alvenaria Estrutural", "Drywall (Montagem e Chapeamento)", "Vergas e Contravergas"]
  },
  "ESQUADRIAS E FERRAGENS": {
    discipline: "acabamento",
    items: ["Instalação de Batentes/Marcos", "Instalação de Portas", "Instalação de Janelas", "Instalação de Alisares/Guarnições", "Instalação de Ferragens (Fechaduras/Dobradiças)"]
  },
  "COBERTURA": {
    discipline: "acabamento",
    items: ["Montagem da Estrutura da Cobertura", "Instalação de Telhas", "Instalação de Rufos e Calhas"]
  },
  "PROTEÇÕES E TRATAMENTOS": {
    discipline: "hidraulica",
    items: ["Impermeabilização de Lajes e Áreas Molhadas", "Impermeabilização de Fundações", "Tratamento Anticorrosivo"]
  },
  "REVESTIMENTOS DE ARGAMASSAS": {
    discipline: "revestimento",
    items: ["Chapisco", "Emboço", "Reboco", "Contrapiso"]
  },
  "REVESTIMENTOS PAREDES": {
    discipline: "revestimento",
    items: ["Assentamento de Revestimento Cerâmico/Porcelanato", "Assentamento de Pastilhas", "Rejuntamento"]
  },
  "FORRO": {
    discipline: "acabamento",
    items: ["Instalação de Forro de Gesso Acartonado", "Instalação de Forro de PVC", "Tratamento de Juntas"]
  },
  "PAVIMENTAÇÕES": {
    discipline: "revestimento",
    items: ["Assentamento de Piso Cerâmico/Porcelanato", "Instalação de Piso Laminado/Vinílico", "Instalação de Rodapés"]
  },
  "PINTURAS": {
    discipline: "pintura",
    items: ["Aplicação de Selador", "Emassamento (Massa Corrida/Acrílica)", "Lixamento de Paredes e Tetos", "Aplicação de 1ª Demão de Tinta", "Aplicação de 2ª Demão e Acabamento", "Pintura de Esquadrias", "Pintura de Fachada"]
  },
  "LOUÇAS, METAIS E BANCADAS": {
    discipline: "hidraulica",
    items: ["Instalação de Vasos Sanitários", "Instalação de Lavatórios e Cubas", "Instalação de Torneiras e Registros", "Instalação de Bancadas de Granito/Mármore"]
  },
  "ELÉTRICA AT/BT E TELEFONIA": {
    discipline: "eletrica",
    items: ["Instalação de Eletrodutos e Caixas", "Passagem de Fiação e Cabos", "Montagem de Quadros de Distribuição", "Instalação de Tomadas e Interruptores", "Instalação de Pontos de Iluminação"]
  },
  "INSTALAÇÕES HIDRO-SANITÁRIAS": {
    discipline: "hidraulica",
    items: ["Instalação de Tubulação de Água Fria", "Instalação de Tubulação de Água Quente", "Instalação de Tubulação de Esgoto", "Instalação de Caixas (Inspeção/Gordura)", "Teste de Estanqueidade"]
  },
  "INSTALAÇÕES DE COMBATE A INCENDIO E PANICO": {
    discipline: "hidraulica",
    items: ["Instalação de Tubulação de Hidrantes", "Instalação de Extintores", "Instalação de Iluminação de Emergência"]
  },
  "INSTALAÇÕES PARA DISTRIBUIÇÃO DE GASES": {
    discipline: "hidraulica",
    items: ["Instalação de Tubulação de Gás", "Instalação de Pontos de Gás", "Teste de Estanqueidade de Gás"]
  },
  "INSTALAÇÕES DE CONDICIONAMENTO AMBIENTAL": {
    discipline: "eletrica",
    items: ["Instalação de Infraestrutura para Ar Condicionado", "Instalação de Dutos de Ventilação"]
  },
  "INSTALAÇÕES MECÂNICAS": {
    discipline: "outro",
    items: ["Instalação de Elevadores", "Instalação de Plataformas de Acessibilidade"]
  },
  "COMPLEMENTAÇÃO DE OBRA": {
    discipline: "acabamento",
    items: ["Paisagismo e Jardinagem", "Limpeza Final da Obra", "Execução de Calçadas"]
  },
  "TAXAS E COMISSÕES": {
    discipline: "outro",
    items: ["Taxa de Administração", "Indicação", "Corretagem"]
  }
};