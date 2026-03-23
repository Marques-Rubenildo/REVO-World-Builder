# REVO World Builder
AR Softworks - Alpha v0.1.0

## Instalacao

  cd revo-world-builder
  npm install
  npm start

## Estrutura de saves

  world_data/
  +-- v001/               <- primeira versao salva
  |   +-- world.json      <- indice (reinos, condados)
  |   +-- kingdoms/
  |   +-- counties/
  |   +-- baronies/
  |   +-- hexmaps/
  +-- v002/               <- segunda versao
  +-- v003/               <- versao mais recente

## Como salvar

  Ctrl+S           -> salva nova versao (vXXX)
  Botao Salvar     -> igual ao Ctrl+S
  Botao Saves      -> abre gerenciador (listar / carregar / apagar)

## Atalhos

  Ctrl+S   -> Salvar
  Espaco   -> Modo pan no editor de hexagonos
  Scroll   -> Zoom no editor de hexagonos
