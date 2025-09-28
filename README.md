# dplm

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Models

- Place your model files under `resources/model`.
- For llama.cpp (node-llama-cpp), put a `.gguf` file (e.g., `qwen2.5-0.5b-q4_k_m.gguf`).
- You can also set `LLAMA_MODEL_PATH` env var to an absolute path.

### IPC example

- Renderer: `window.api.runCompletion('Hello')` → returns generated text.

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
