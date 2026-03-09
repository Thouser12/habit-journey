

# Aplicativo de Acompanhamento Comportamental — Visão Paciente

## Visão Geral
MVP de um app gamificado de mudança de hábitos em saúde, com metas diárias, sistema de níveis (Bronze → Platina), ranking semanal e conexão opcional com médico. Sem autenticação — usuário já logado. Dados armazenados em localStorage.

---

## Telas

### 1. Aviso Inicial (Terms)
- Exibido apenas na primeira vez
- Mensagem educativa sobre uso da plataforma
- Botão "Entendi" para prosseguir

### 2. Dashboard (Tela Principal)
- Saudação personalizada ("Olá, João")
- Badge visual do nível atual com cores temáticas (Bronze dourado-escuro, Prata cinza, Ouro amarelo, Platina azul)
- Barra de progresso semanal (%)
- Lista de 10 metas diárias com checkboxes animados
- Contador "X/10 metas concluídas hoje"
- Feedback visual motivacional ao completar metas (confetti/animação ao atingir 100%)
- Botões para Histórico e Conexão com Médico

### 3. Histórico Semanal
- Lista das últimas semanas com: percentual, status (⬆️ promovido / ➡️ manteve / ⬇️ rebaixado), nível antes e depois
- Gráfico de barras simples com Recharts mostrando evolução

### 4. Conexão com Médico
- Campo para inserir Doctor ID
- Botão "Solicitar vínculo"
- Status da solicitação (Pendente/Aceito/Recusado) — simulado localmente
- Indicador "Vinculado ao Dr. [Nome]" quando aceito
- Texto explicativo sobre personalização de metas

---

## Lógica Principal (localStorage)
- **Metas diárias**: 10 metas por nível, resetam a cada novo dia
- **Progresso semanal**: acumula completions dos últimos 7 dias
- **Ranking automático**: ao fechar ciclo de 7 dias — ≥70% sobe, ≤30% desce, entre mantém
- **Metas por nível**: cada nível tem conjunto próprio de metas genéricas progressivas
- **Vínculo médico**: ao aceitar, metas podem ser substituídas; ao remover, volta às genéricas

## Design
- Interface minimalista e motivadora com Tailwind
- Paleta suave por nível, transições animadas
- Mobile-first, responsivo

