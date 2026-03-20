# 🐟 Peixe Pixel Supremo

Um Desktop Pet interativo desenvolvido em **Electron**, que traz um peixe pixelado (e um pouco temperamental) para nadar livremente sobre o seu papel de parede.

![Versão Atual](https://img.shields.io/badge/Vers%C3%A3o-v0.1.0-blue)
![Electron](https://img.shields.io/badge/Framework-Electron-informational)
![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-success)

---

## ✨ Funcionalidades

- **Janela Transparente**: O peixe nada "por cima" de tudo, sem bordas ou fundos.
- **IA de Personalidade**: O comportamento do peixe muda dinamicamente com o tempo.
- **Interatividade**: Ele reage ao movimento do cursor do mouse.
- **Sistema de Fala**: Balões de texto com frases motivacionais (ou nem tanto) de programador.
- **Efeitos de Áudio**: Bips sintetizados que mudam conforme o humor do pet.
- **Skins Customizáveis**: Fácil troca de aparência via pastas de skins.

---

## 🧠 Personalidades

O peixe possui três estados mentais principais que alternam automaticamente:

1.  **😌 Calmo**: Nada tranquilamente, é curioso mas mantém distância.
2.  **😏 Travesso**: Gosta de fugir do mouse e fazer movimentos rápidos.
3.  **🔥 Caótico**: Persegue o cursor, dá "mordidas" e pode até dar um leve "empurrão" no seu mouse (se o `robotjs` estiver ativo).

---

## 🚀 Como Executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) instalado.

### Instalação

1. Clone ou baixe este repositório.
2. No terminal da pasta do projeto, instale as dependências:
   ```powershell
   npm install
   ```

### Iniciando o Pet

Para ver o peixe nadando agora mesmo:

```powershell
npm start
```

### Gerando um Executável (.exe)

Para criar uma versão que você pode enviar para os amigos:

```powershell
npm run dist
```

---

## 🎨 Customização de Skins

Você pode criar novas aparências para o seu peixe facilmente:

1. Vá até a pasta `skins/`.
2. Crie uma nova pasta (ex: `peixe-espada`).
3. Adicione um arquivo `sheet.png` (sprite sheet) e um `meta.json`.
4. No `meta.json`, configure a grade (cols/rows) e as animações:
   ```json
   {
     "frameWidth": 64,
     "frameHeight": 64,
     "cols": 2,
     "rows": 2,
     "fps": 8,
     "displayScale": 1.0,
     "animations": {
       "swim": [0, 1, 2, 3]
     }
   }
   ```
5. Mude a variável `skinName` no arquivo `renderer/src/state.js` para o nome da sua pasta.

---

## 🛠️ Estrutura do Projeto

- `main.js`: Processo principal do Electron (janela, menu de contexto e bootstrap).
- `preload.js`: Bridge segura entre renderer e main process via IPC.
- `src/main/`: Módulos do processo principal (`ipc.js`, `windowTracker.js`).
- `renderer/index.html` + `renderer/styles.css`: Base visual da aplicação.
- `renderer/src/`: Lógica modular do pet (`main.js`, física, desenho, áudio, input e estado).
- `skins/`: Aparências do peixe (padrão: `goldfish`).
- `scripts/`: Utilitários de assets e scripts auxiliares.

---

## ⚠️ Notas Importantes

- **Mover Cursor**: O recurso de mover o cursor depende da biblioteca `robotjs`. Se não conseguir instalar, o app funcionará normalmente, apenas sem essa interação física.
- **Sempre no Topo**: O peixe é configurado para ficar acima de outras janelas, mas você ainda consegue clicar "através" dele para usar outros programas.
- **Windows Primeiro**: A integração de rastreamento de janela ativa foi feita para `win32` com PowerShell.

---

## ✅ Qualidade de Código

Scripts úteis disponíveis:

```powershell
npm run format
npm run format:check
```

---

_Feito com 💙 para animar o seu desktop._
