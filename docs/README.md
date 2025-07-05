# 🏗️ Innoma Obras

**Aplicativo profissional para gestão completa de obras de construção civil**

[![React Native](https://img.shields.io/badge/React%20Native-0.72.6-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-49.0.0-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1.3-blue.svg)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-Offline%20First-green.svg)](https://www.sqlite.org/)

## 🎯 Visão Geral

O Innoma Obras é um aplicativo móvel completo para gerenciamento de obras de construção civil, desenvolvido com foco na experiência do usuário e funcionamento offline-first. Oferece todas as ferramentas necessárias para controlar obras desde o planejamento até a entrega final.

## ✨ Principais Funcionalidades

### 🏢 **Gestão de Obras**
- ✅ Cadastro completo de obras com localização
- 📊 Dashboard com indicadores de performance (KPIs)
- 📈 Acompanhamento de progresso em tempo real
- 🎯 Controle de prazos e orçamentos
- 📍 Geolocalização das atividades

### 👥 **Gestão de Equipe**
- 👤 Controle de perfis e permissões (Admin, Engenheiro, Mestre, Operador, Visitante)
- 🔐 Sistema de convites por e-mail
- 📱 Comunicação interna por obra
- ⏰ Controle de presença e atividades

### 📋 **Diário de Obra**
- 📝 Registro diário das atividades
- 📸 Anexo de fotos com geolocalização
- 🎤 Gravação de áudios
- ☁️ Informações meteorológicas
- ✅ Sistema de aprovação

### ✅ **Gestão de Tarefas**
- 📝 Criação e atribuição de tarefas
- 🎯 Controle de status e prioridades
- ⏱️ Acompanhamento de tempo
- 📊 Relatórios de produtividade
- 🔄 Dependências entre tarefas

### 📅 **Cronograma**
- 📊 Visualização tipo Gantt Chart
- 📈 Acompanhamento de etapas
- ⚠️ Alertas de atrasos
- 🔄 Reprogramação automática
- 📊 Análise de desvios

### 📦 **Controle de Materiais**
- 🏪 Gestão de estoque
- 📋 Controle de entradas e saídas
- 💰 Acompanhamento de custos
- 📊 Relatórios de consumo
- ⚠️ Alertas de estoque mínimo

### 💰 **Gestão Financeira**
- 📊 Controle de custos por categoria
- 💳 Registro de gastos
- 📈 Comparativo planejado vs. executado
- 📋 Aprovação de despesas
- 📊 Relatórios financeiros

### 🔍 **Controle de Qualidade**
- ✅ Checklists personalizáveis
- 📸 Registro de evidências
- ❌ Controle de não conformidades
- ✅ Sistema de aprovações
- 📊 Relatórios de qualidade

### 📄 **Gestão de Documentos**
- 📁 Organização por categorias
- 🔍 Busca inteligente
- 📱 Visualização inline
- 🔒 Controle de acesso
- 📤 Compartilhamento seguro

## 🏗️ Arquitetura Técnica

### 📱 **Frontend**
- **React Native** com Expo para desenvolvimento cross-platform
- **TypeScript** para tipagem estática e melhor DX
- **Expo Router** para navegação file-based
- **Zustand** para gerenciamento de estado global
- **React Hook Form** + Yup para formulários e validação

### 💾 **Armazenamento**
- **SQLite** como banco principal (offline-first)
- **Expo Secure Store** para dados sensíveis
- **File System** para arquivos e mídias
- **Sincronização automática** com servidor

### 🎨 **Design System**
- **Tema dark/light** automático
- **Componentes reutilizáveis** tipados
- **Animações fluidas** com Reanimated
- **Responsividade** para tablets
- **Acessibilidade** nativa

### 🔄 **Offline-First**
- **Funcionamento 100% offline**
- **Sincronização inteligente**
- **Resolução de conflitos**
- **Queue de sincronização**
- **Backup automático**

## 🚀 Instalação e Execução

### 📋 Pré-requisitos
```bash
node >= 18.0.0
npm >= 9.0.0
expo-cli >= 6.0.0
```

### 🔧 Instalação
```bash
# Clone o repositório
git clone https://github.com/sua-empresa/innoma-obras.git

# Entre no diretório
cd innoma-obras

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
```

### 🏃‍♂️ Executação
```bash
# Desenvolvimento
npm start

# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web (para testes)
npm run web
```

### 📦 Build
```bash
# Build Android
npm run build:android

# Build iOS
npm run build:ios
```

## 📁 Estrutura do Projeto

```
innoma-obras/
├── 📱 app/                    # Rotas do Expo Router
│   ├── (auth)/               # Autenticação
│   ├── (tabs)/               # Navegação principal
│   ├── obra/                 # Detalhes das obras
│   └── modal/                # Modais globais
├── 🧩 src/
│   ├── components/           # Componentes reutilizáveis
│   ├── services/            # Serviços (API, DB, etc.)
│   ├── store/               # Gerenciamento de estado
│   ├── hooks/               # Hooks customizados
│   ├── contexts/            # React Contexts
│   ├── constants/           # Constantes globais
│   ├── types/               # Tipos TypeScript
│   └── styles/              # Sistema de design
├── 📄 assets/                # Recursos estáticos
└── 📚 docs/                  # Documentação
```

## 🔐 Segurança e Permissões

### 👤 **Perfis de Usuário**
- **Admin**: Acesso total ao sistema
- **Engenheiro**: Gestão completa da obra
- **Mestre**: Execução e controle operacional
- **Operador**: Registro de atividades
- **Visitante**: Apenas visualização

### 🛡️ **Controle de Acesso**
- Autenticação obrigatória
- Permissões por tela/funcionalidade
- Dados criptografados localmente
- Sincronização segura

## 📊 Funcionalidades Avançadas

### 🤖 **Inteligência Artificial**
- Previsão de atrasos baseada em histórico
- Sugestões de otimização de cronograma
- Análise preditiva de custos
- Detecção automática de padrões

### 📈 **Analytics e Relatórios**
- Dashboard executivo personalizado
- Relatórios automatizados (PDF)
- Indicadores de performance (KPIs)
- Análise de tendências
- Comparativos entre obras

### 🔔 **Notificações Inteligentes**
- Lembretes de prazos
- Alertas de desvios orçamentários
- Notificações de aprovações pendentes
- Updates de status da equipe
- Alertas de estoque baixo

### 📍 **Geolocalização**
- Registro automático de localização
- Controle de presença por geofencing
- Mapeamento de atividades
- Rastreamento de equipamentos
- Verificação de check-ins

## 🛠️ Desenvolvimento por Etapas

### ✅ **Etapa 1 - CONCLUÍDA: Infraestrutura Base**
- [x] Configuração do projeto React Native + Expo
- [x] Setup TypeScript completo
- [x] Estrutura de diretórios modular
- [x] Sistema de tema dark/light
- [x] Componentes base (Button, Input, Card)
- [x] Configuração SQLite + migrações
- [x] Context API estruturado

### 🚧 **Etapa 2 - EM ANDAMENTO: Autenticação**
- [ ] Firebase/Supabase Auth setup
- [ ] Telas de Login/Cadastro/Recuperação
- [ ] Sistema de convites por e-mail
- [ ] Gestão de perfis e permissões
- [ ] Middleware de autorização
- [ ] Persistência de sessão

### 📅 **Etapa 3 - PRÓXIMA: Sincronização**
- [ ] Camada de repositórios
- [ ] Sistema de sincronização
- [ ] Resolução de conflitos
- [ ] Queue offline
- [ ] Testes de conectividade

### 🏗️ **Etapa 4 - MVP Funcional**
- [ ] CRUD de obras
- [ ] Gestão de equipe
- [ ] Diário de obra
- [ ] Sistema de tarefas
- [ ] Interface principal

### 💰 **Etapa 5 - Funcionalidades Avançadas**
- [ ] Controle financeiro
- [ ] Gestão de materiais
- [ ] Relatórios PDF
- [ ] Sistema de qualidade

### 🤖 **Etapa 6 - IA e Analytics**
- [ ] Dashboard inteligente
- [ ] Previsões automáticas
- [ ] Análise de padrões
- [ ] Otimizações sugeridas

## 🎨 Design e UX

### 🖌️ **Princípios de Design**
- **Minimalismo**: Interface limpa e focada
- **Consistência**: Padrões visuais uniformes
- **Acessibilidade**: Suporte completo a screen readers
- **Performance**: Animações de 60fps
- **Responsividade**: Adaptação para todos os tamanhos

### 🌈 **Sistema de Cores**
```typescript
// Cores Primárias
primary: '#2563EB'      // Azul profissional
secondary: '#10B981'    // Verde construção
accent: '#F59E0B'       // Amarelo atenção

// Status
success: '#10B981'      // Verde sucesso
warning: '#F59E0B'      // Amarelo atenção
error: '#EF4444'        // Vermelho erro
info: '#3B82F6'         // Azul informação
```

### 📱 **Componentes Principais**
- **Button**: 4 variantes (primary, secondary, outline, ghost)
- **Input**: Floating labels, validação visual, ícones
- **Card**: Elevação, bordas, gradientes
- **Modal**: Animações suaves, backdrop blur
- **Toast**: Notificações não invasivas

## 🧪 Testes e Qualidade

### 🔍 **Estratégia de Testes**
- **Unit Tests**: Jest + Testing Library
- **E2E Tests**: Detox para automação
- **Performance**: Flipper + metrics
- **Acessibilidade**: Testes automatizados
- **Offline**: Simulação de cenários

### 📊 **Métricas de Qualidade**
- Cobertura de testes > 80%
- Performance bundle < 2MB
- Tempo de inicialização < 3s
- Taxa de crash < 0.1%
- Nota App Store/Play Store > 4.5

## 🚀 Deploy e Distribuição

### 📦 **Build Process**
```bash
# Build de produção
expo build:android --type apk
expo build:ios --type archive

# Upload automático
eas submit --platform android
eas submit --platform ios
```

### 🏪 **Distribuição**
- **Play Store**: Release automático via GitHub Actions
- **App Store**: TestFlight → Produção
- **Enterprise**: MDM para empresas
- **Web**: PWA para acesso browser

## 📈 Roadmap Futuro

### 🌟 **Versão 2.0**
- [ ] Integração com drones para inspeção
- [ ] Realidade aumentada para visualização
- [ ] Blockchain para certificação de qualidade
- [ ] Machine Learning para otimização

### 🔮 **Versão 3.0**
- [ ] IoT para monitoramento automático
- [ ] Integração com BIM (Building Information Modeling)
- [ ] API aberta para integrações
- [ ] Marketplace de fornecedores

## 🤝 Contribuição

### 👨‍💻 **Para Desenvolvedores**
1. Fork o projeto
2. Crie uma branch para sua feature
3. Siga os padrões de código estabelecidos
4. Escreva testes para suas alterações
5. Abra um Pull Request

### 📝 **Padrões de Código**
- ESLint + Prettier configurados
- Conventional Commits
- TypeScript strict mode
- Documentação obrigatória

## 📞 Suporte

### 🆘 **Canais de Suporte**
- **Email**: suporte@innoma.com.br
- **WhatsApp**: +55 (11) 99999-9999
- **Portal**: https://suporte.innoma.com.br
- **GitHub Issues**: Para bugs e sugestões

### 📚 **Documentação**
- [Manual do Usuário](./docs/USER_MANUAL.md)
- [Guia de Implementação](./docs/IMPLEMENTATION_GUIDE.md)
- [API Reference](./docs/API.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**Desenvolvido com ❤️ pela equipe Innoma**

*"Transformando a gestão de obras com tecnologia de ponta"*