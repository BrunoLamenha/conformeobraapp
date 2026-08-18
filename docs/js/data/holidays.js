/**
 * Lista de feriados nacionais fixos no Brasil.
 * Formato: 'MM-DD'
 * Feriados móveis como Carnaval e Corpus Christi precisariam de um cálculo mais complexo.
 */
export const nationalHolidays = [
  '01-01', // Confraternização Universal
  '04-21', // Tiradentes
  '05-01', // Dia do Trabalho
  '09-07', // Independência do Brasil
  '10-12', // Nossa Senhora Aparecida
  '11-02', // Finados
  '11-15', // Proclamação da República
  '12-25', // Natal
];

/**
 * Verifica se uma data é um feriado.
 * @param {Date} date - A data a ser verificada.
 * @returns {boolean} - True se for um feriado.
 */
export function isHoliday(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return nationalHolidays.includes(`${month}-${day}`);
}