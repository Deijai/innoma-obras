# 🚀 **GUIA DE INSTALAÇÃO - INNOMA OBRAS**

## 📋 **PRÉ-REQUISITOS**

### **🖥️ Sistema Operacional**
- Windows 10/11, macOS 10.15+, ou Linux Ubuntu 18.04+
- Pelo menos 8GB de RAM (16GB recomendado)
- 50GB de espaço livre em disco

### **🛠️ Ferramentas Necessárias**
```bash
# Node.js (versão 18 ou superior)
node --version  # v18.0.0 ou superior

# npm (versão 8 ou superior)
npm --version   # 8.0.0 ou superior

# Git
git --version

# Expo CLI
npm install -g @expo/cli
```

### **📱 Para Desenvolvimento Mobile**
- **Android**: Android Studio + SDK
- **iOS**: Xcode (apenas macOS)
- **Simuladores**: iOS Simulator, Android Emulator

---

## 🔧 **INSTALAÇÃO DO PROJETO**

### **1. Clonar o Repositório**
```bash
git clone https://github.com/sua-empresa/innoma-obras.git
cd innoma-obras
```

### **2. Instalar Dependências**
```bash
# Instalar todas as dependências
npm install

# Verificar se não há erros
npm audit
```

### **3. Configurar Variáveis de Ambiente**
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas configurações
nano .env
```

**Configurações necessárias no `.env`:**
```bash
# Firebase (obrigatório)
FIREBASE_API_KEY=sua_chave_api
FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
FIREBASE_PROJECT_ID=seu_projeto_id
FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:android:abcdef

# Configurações opcionais
APP_ENV=development
DEBUG_MODE=true
```

### **4. Configurar Firebase (Obrigatório)**

#### **4.1 Criar Projeto Firebase**
1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Clique em "Criar um projeto"
3. Nome: "Innoma Obras" (ou seu nome preferido)
4. Habilite Google Analytics (opcional)

#### **4.2 Configurar Authentication**
1. Vá para **Authentication** → **Sign-in method**
2. Habilite **Email/Password**
3. Configure domínios autorizados se necessário

#### **4.3 Configurar Firestore**
1. Vá para **Firestore Database**
2. Clique em "Criar banco de dados"
3. Escolha modo de **teste** (por enquanto)
4. Selecione localização (preferencialmente `us-central1`)

#### **4.4 Configurar Storage**
1. Vá para **Storage**
2. Clique em "Começar"
3. Use regras padrão de segurança

#### **4.5 Obter Credenciais**
1. Vá para **Configurações do projeto** (ícone de engrenagem)
2. Na aba **Geral**, role até "Seus apps"
3. Clique em "Adicionar app" → escolha plataforma
4. Copie as credenciais para o arquivo `.env`

---

## ▶️ **EXECUTAR O PROJETO**

### **1. Iniciar o Servidor de Desenvolvimento**
```bash
# Modo development
npm start

# Ou com cache limpo
npm start -- --clear
```

### **2. Executar em Dispositivos**

#### **📱 iOS (apenas macOS)**
```bash
# iOS Simulator
npm run ios

# Ou diretamente
npx expo start --ios
```

#### **🤖 Android**
```bash
# Android Emulator
npm run android

# Ou diretamente
npx expo start --android
```

#### **🌐 Web (para testes)**
```bash
# Navegador
npm run web

# Ou diretamente
npx expo start --web
```

#### **📲 Dispositivo Físico**
1. Instale o app **Expo Go**
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Escaneie o QR Code que aparecer no terminal

---

## 🔧 **CONFIGURAÇÕES ADICIONAIS**

### **🍃 Configurar Emuladores Firebase (Opcional)**
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar projeto (na pasta do projeto)
firebase init

# Selecionar:
# - Authentication
# - Firestore
# - Storage
# - Functions (opcional)

# Executar emuladores
firebase emulators:start
```

### **📱 Configurar Android Studio**
1. Baixe [Android Studio](https://developer.android.com/studio)
2. Instale SDK API 33 (mínimo API 21)
3. Configure AVD (Android Virtual Device)
4. Adicione ao PATH:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

### **🍎 Configurar Xcode (macOS)**
1. Instale Xcode da App Store
2. Execute: `sudo xcode-select --install`
3. Abra Xcode e aceite os termos
4. Instale simuladores iOS desejados

---

## ✅ **VERIFICAR INSTALAÇÃO**

### **1. Testar Compilação**
```bash
# TypeScript sem erros
npx tsc --noEmit

# ESLint sem erros
npm run lint

# Executar testes (quando disponíveis)
npm test
```

### **2. Testar Funcionalidades**
- [ ] App abre sem crashar
- [ ] Tema dark/light funciona
- [ ] Navegação entre telas funciona
- [ ] Firebase conecta (check no console)
- [ ] Banco SQLite inicializa
- [ ] Formulários validam corretamente

---

## 🐛 **SOLUÇÃO DE PROBLEMAS COMUNS**

### **❌ Erro: "Metro bundler failed"**
```bash
# Limpar cache do Metro
npx expo start --clear
rm -rf node_modules package-lock.json
npm install
```

### **❌ Erro: "Firebase not configured"**
- Verifique se todas as variáveis no `.env` estão corretas
- Certifique-se que o projeto Firebase foi criado
- Verifique se as regras do Firestore permitem leitura/escrita

### **❌ Erro: "SQLite database failed"**
```bash
# Resetar banco de dados
npx expo start --clear
# O banco será recriado automaticamente
```

### **❌ Erro: "Module not found"**
```bash
# Reinstalar dependências
rm -rf node_modules
npm install

# Verificar se há dependências em falta
npm install
```

### **❌ Erro: "Android build failed"**
```bash
# Limpar build do Android
cd android
./gradlew clean
cd ..

# Ou recriar projeto
npx expo run:android --clear
```

### **❌ Erro: "iOS build failed"**
```bash
# Limpar build do iOS
cd ios
rm -rf build
pod install --clean-install
cd ..
```

---

## 📞 **SUPORTE**

### **🆘 Precisa de Ajuda?**
1. **Documentação**: Consulte os arquivos na pasta `docs/`
2. **Issues**: Abra uma issue no GitHub
3. **Discord**: Entre no servidor da comunidade
4. **Email**: suporte@innoma.com

### **📋 Template para Reportar Problemas**
```markdown
**Ambiente:**
- OS: [Windows/macOS/Linux]
- Node: [versão]
- Expo: [versão]
- Device: [físico/emulador]

**Erro:**
[descreva o erro]

**Passos para reproduzir:**
1. [passo 1]
2. [passo 2]
3. [erro ocorre]

**Logs:**
[cole os logs aqui]
```

---

## 🎉 **PRÓXIMOS PASSOS**

Após a instalação bem-sucedida:

1. **Explorar a Documentação**: Leia `docs/ARCHITECTURE.md`
2. **Configurar Firebase**: Siga `docs/FIREBASE_SETUP.md`
3. **Entender o Código**: Veja `docs/CODE_STRUCTURE.md`
4. **Contribuir**: Leia `CONTRIBUTING.md`

**✅ Instalação concluída com sucesso!** 🚀