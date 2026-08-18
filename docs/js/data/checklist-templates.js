/**
 * Templates de Checklist para Vistorias de Conferência/Qualidade.
 */
export const conferenceChecklists = {
  alvenaria: {
    label: 'Alvenaria Concluída',
    items: [
      'Parede está plana (verificar com régua de alumínio de 2m)?',
      'Desvio de prumo está dentro da tolerância da norma?',
      'Encontros de paredes estão em 90 graus (conferir esquadro)?',
      'Juntas de assentamento estão preenchidas e sem falhas?',
      'Parede está limpa, sem excesso de argamassa?',
    ],
  },
  revestimento_parede: {
    label: 'Revestimentos de Parede (Cerâmica/Porcelanato)',
    items: [
      'Juntas de assentamento estão alinhadas na vertical e horizontal?',
      'Não há "dentes" entre as peças (ressaltos)?',
      'Peças não apresentam som oco ao bater levemente (falta de argamassa)?',
      'Recortes em tomadas, registros e cantos estão bem-acabados?',
      'Rejuntamento está uniforme, sem falhas e limpo (sem manchas nas peças)?',
    ],
  },
  pintura: {
    label: 'Pintura Finalizada',
    items: [
      'Pintura está uniforme, sem manchas, sombras ou marcas de rolo/pincel?',
      'Superfície está lisa ao toque, sem asperezas ou partículas de poeira?',
      'Linhas de recorte entre parede/teto e rodapé estão retas e limpas?',
      'Não há respingos de tinta em pisos, vidros, esquadrias ou metais?',
      'Cor corresponde à especificada em projeto?',
    ],
  },
  eletrica: {
    label: 'Instalações Elétricas (Finalizada)',
    items: [
      'Tomadas, interruptores e espelhos estão firmes e alinhados?',
      'Todos os pontos de iluminação e tomadas estão energizados e funcionando?',
      'Disjuntores no quadro de distribuição estão devidamente identificados?',
      'Não há fios expostos ou conexões mal feitas?',
      'Espelhos e placas estão sem trincas ou quebras?',
    ],
  },
};