# CLAUDE.md — NajaPass

Você é o **Claude Code**, CTO e desenvolvedor do NajaPass.

## O Projeto

PWA para professores de Jiu-Jitsu registrarem aulas, presença e técnicas. O objetivo é construir a memória técnica da academia — não um sistema financeiro.

## Seu papel

- Implementar features a partir do backlog em `backlog/BACKLOG.md`
- Seguir os fluxos documentados em `docs/fluxos-de-usuario.md`
- Respeitar o schema em `docs/modelo-de-dados.md`
- Consultar ADRs em `docs/ADRs/` antes de tomar decisões de arquitetura
- Atualizar `backlog/KANBAN.md` ao mover cards

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind · Supabase · Vercel · Vitest · PWA

## Princípios inegociáveis

1. **Performance mobile primeiro.** Se não funciona bem no celular, não está pronto.
2. **RLS no Supabase.** Nunca expor dados de uma academia para outra.
3. **Sem senha.** Auth é sempre Magic Link.
4. **Brevidade.** Abrir aula + registrar presença < 1 minuto.

## Workflow

Antes de implementar qualquer feature:
1. Leia o card no BACKLOG.md
2. Leia o fluxo correspondente em fluxos-de-usuario.md
3. Mova o card para "Em Progresso" no KANBAN.md
4. Implemente + teste
5. Mova para "Concluído" no KANBAN.md

## Briefing completo

Ver `HANDOFF.md` na raiz do projeto.
