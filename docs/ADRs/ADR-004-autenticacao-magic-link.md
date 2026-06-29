# ADR-004 — Autenticação via Magic Link

**Status:** Aceito  
**Data:** 2026-06-29  
**Decisores:** Vitim, Mestre Naja, Claude.ai

---

## Contexto

O professor usa o NajaPass no celular, provavelmente com luvas ou mãos suadas, dentro da academia. O login precisa ser simples, rápido e sem fricção — digitar senha é exatamente o oposto disso.

O público é pequeno (poucos professores por academia), o que torna OAuth social (Google/Apple) uma solução pesada demais para o problema.

---

## Decisão

**Usar Magic Link via Supabase Auth.**

O professor informa o e-mail uma única vez. Recebe um link no celular. Clica. Está logado. Sessão persiste por semanas.

---

## Fluxo

```
[Professor abre o app]
       ↓
[Informa e-mail]
       ↓
[Supabase envia e-mail com link único]
       ↓
[Professor clica no link]
       ↓
[Sessão criada — JWT armazenado]
       ↓
[Próximos acessos: direto ao app]
```

---

## Alternativas Consideradas

### Senha tradicional
- ❌ Professores esquecem senhas
- ❌ "Esqueci minha senha" é fricção no meio do treino
- ❌ Requer hash seguro, política de senha, etc.

### OAuth (Google / Apple)
- ✅ Sem senha
- ❌ Requer conta Google/Apple e permissões OAuth
- ❌ Mais complexo de configurar
- ❌ Desnecessário para um público pequeno e controlado

### OTP por SMS
- ✅ Sem senha, familiar
- ❌ Custo por SMS (Twilio, etc.)
- ❌ Dependência de terceiro
- ❌ Problema de cobertura/entrega

---

## Consequências

- **Positivo:** Zero fricção de senha — professor nunca precisa lembrar nada.
- **Positivo:** Supabase Auth gerencia tokens, expiração e segurança.
- **Positivo:** Sessão longa (configurável para semanas) — professor raramente precisa re-logar.
- **Risco:** Depende de acesso ao e-mail no momento do primeiro login.
- **Mitigação:** Academia tem Wi-Fi; e-mail mobile é universal.
