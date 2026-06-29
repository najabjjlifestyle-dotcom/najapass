# ADR-002 — PWA vs App Nativo

**Status:** Aceito  
**Data:** 2026-06-29  
**Decisores:** Vitim, Claude.ai

---

## Contexto

O NajaPass é usado principalmente por professores dentro da academia, durante ou imediatamente após o treino. O dispositivo é o celular pessoal do professor. A experiência precisa ser rápida de abrir, funcionar offline e ser fácil de instalar — sem depender de aprovação da App Store.

---

## Decisão

**Usar PWA (Progressive Web App).**

O app será hospedado na web e poderá ser "instalado" na tela inicial de qualquer smartphone via browser.

---

## Critérios Avaliados

| Critério | PWA | App Nativo |
|---|---|---|
| Tempo até MVP | Semanas | Meses |
| Custo de manutenção | Um codebase | Dois codebases |
| Deploy de updates | Imediato | Aprovação da loja (dias) |
| Instalação pelo usuário | "Adicionar à tela inicial" | Download na loja |
| Acesso offline | ✅ Service Worker | ✅ |
| Push notifications | ✅ iOS 16.4+ / Android | ✅ |
| Câmera / sensores | ✅ suficiente | ✅ |
| Performance | Boa | Excelente |
| Custo operacional | $0 | Apple Developer $99/ano |

---

## Alternativas Consideradas

### React Native + Expo
- Melhor performance e acesso nativo completo
- Requer conta de desenvolvedor Apple/Google
- Updates precisam passar pela loja
- Complexidade operacional alta para um time de 1 desenvolvedor

### App Web sem PWA
- Sem instalação na tela inicial
- Sem suporte offline
- Descartado: experiência mobile degradada

---

## Consequências

- **Positivo:** Deploy contínuo — Vitim e Mestre Naja veem features novas em minutos.
- **Positivo:** Sem fricção de instalação para novos professores.
- **Risco:** Suporte a push notification no iOS limitado a versões recentes.
- **Decisão futura:** Se o produto escalar para Fase 4, avaliar Capacitor/Tauri para empacotar como app nativo sem reescrever o código.
