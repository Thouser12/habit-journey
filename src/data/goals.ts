import { Level } from '@/types/app';

export const GOALS_BY_LEVEL: Record<Level, string[]> = {
  bronze: [
    'Beber pelo menos 6 copos de água',
    'Caminhar por 15 minutos',
    'Comer uma fruta',
    'Dormir antes das 23h',
    'Evitar refrigerante',
    'Fazer 5 minutos de alongamento',
    'Tomar café da manhã saudável',
    'Registrar suas refeições',
    'Praticar 3 minutos de respiração consciente',
    'Ler 10 páginas de um livro',
  ],
  prata: [
    'Beber pelo menos 8 copos de água',
    'Caminhar por 30 minutos',
    'Comer 2 porções de frutas',
    'Dormir antes das 22h30',
    'Evitar alimentos ultraprocessados',
    'Fazer 10 minutos de exercício',
    'Preparar uma refeição saudável',
    'Registrar humor e energia do dia',
    'Meditar por 5 minutos',
    'Reduzir tempo de tela em 30 minutos',
  ],
  ouro: [
    'Beber pelo menos 10 copos de água',
    'Praticar 30 minutos de exercício físico',
    'Comer 3 porções de vegetais',
    'Dormir 7-8 horas completas',
    'Cozinhar todas as refeições do dia',
    'Fazer 15 minutos de treino funcional',
    'Planejar refeições do dia seguinte',
    'Praticar gratidão (3 itens)',
    'Meditar por 10 minutos',
    'Ler por 30 minutos',
  ],
  platina: [
    'Beber 12 copos de água',
    'Treinar por 45 minutos',
    'Seguir plano alimentar completo',
    'Manter rotina de sono consistente',
    'Zero ultraprocessados no dia',
    'Fazer treino de força ou resistência',
    'Preparar marmitas saudáveis',
    'Journaling: reflexão diária escrita',
    'Meditar por 15 minutos',
    'Ensinar um hábito saudável a alguém',
  ],
};

export const LEVEL_ORDER: Level[] = ['bronze', 'prata', 'ouro', 'platina'];

export const LEVEL_LABELS: Record<Level, string> = {
  bronze: 'Bronze',
  prata: 'Prata',
  ouro: 'Ouro',
  platina: 'Platina',
};
