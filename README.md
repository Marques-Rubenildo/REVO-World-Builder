````markdown
# 🚀 REVO World Builder™
**AR Softworks™ — Alpha v0.1.0**  

[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)  
[![GitHub stars](https://img.shields.io/github/stars/Marques-Rubenildo/REVO-World-Builder)](https://github.com/Marques-Rubenildo/REVO-World-Builder/stargazers)  
[![GitHub issues](https://img.shields.io/github/issues/Marques-Rubenildo/REVO-World-Builder)](https://github.com/Marques-Rubenildo/REVO-World-Builder/issues)  
[![GitHub forks](https://img.shields.io/github/forks/Marques-Rubenildo/REVO-World-Builder)](https://github.com/Marques-Rubenildo/REVO-World-Builder/network)

---

**Slogan:**  
> “Construa mundos feudalmente ricos, do mapa mundi ao menor hexágono, de forma intuitiva e elegante.”

---

## 📝 Sobre o Projeto

**REVO World Builder™** é uma **ferramenta desktop para criação de mundos RPG/feudais**, feita com **Electron + Node.js**, focada em:

- Hierarquias geográficas: Reino → Condado/Ducado → Barônia → Hexágono → Interior de Edificação  
- Renderização de mapas interativos (2D)  
- Sistema de coordenadas axial + offset + índice flat  
- Salvar mundos localmente em versões numeradas  
- Navegação visual e lógica clara  

---

## 🏗 Estrutura Hierárquica

```text
Reino
  └── Condado / Ducado
        └── Barônia
              └── Hexágono (terreno)
                    └── Edificação (interior)
````

---

## 💻 Stack Tecnológica

| Componente   | Tecnologia                               |
| ------------ | ---------------------------------------- |
| Runtime      | Electron 28 + Node.js 18                 |
| Interface    | HTML5 + CSS3 + Canvas API                |
| Tipografia   | Cinzel + Crimson Text (Google Fonts)     |
| Persistência | Sistema de arquivos local (JSON)         |
| Comunicação  | Electron IPC (contextIsolation)          |
| Coordenação  | Sistema axial (q, r) + offset (col, row) |

---

## 🗺 Funcionalidades por Camada

### Camada I — Mapa Mundi

* Upload de PNG colorido (cada cor = província)
* Zoom, pan, bordas e overlay de nomes
* Edição visual: renomear, tipo, reino, quantidade de barônias

### Camada II — Barônias

* Grid clicável com preview do terreno dominante
* Criação e edição via modal
* N barônias por condado (1–20)

### Camada III — Feudo (Hexágonos)

* Grid hexagonal pointy-top, odd-r offset
* 14 tipos de terreno (planície, floresta, deserto, neve, etc.)
* Ícones de edificações (Castelo, Vila, Mina, Dungeon, Cripta, Santuário)
* Clique direito abre Camada IV

### Camada IV — Interior de Edificações

* Grid hexagonal exclusivo
* Mesma lógica de terrenos da Camada III
* Breadcrumbs para navegação

---

## 📐 Sistema de Coordenadas

```
Axial (q, r)  ←→  Offset (col, row)  ←→  Índice flat [idx]
```

Funções principais:

```javascript
offsetToAxial(col, row)
axialToOffset(q, r)
hexNeighbors(q, r)
hexDistance(q1, r1, q2, r2)
getHexData(fiefId, col, row)
```

---

## 💾 Sistema de Saves

* Ctrl+S salva versão numerada automaticamente
* Estrutura: `world_data/v001/`, `v002/`, …
* Hexmaps: flat → render / axial → lógica

---

## 🔢 IDs das Entidades

| Entidade | Formato                | Exemplo                |
| -------- | ---------------------- | ---------------------- |
| Reino    | `k_[timestamp36]`      | `k_lx4z9a`             |
| Condado  | `cnd_[r]x[g]x[b]`      | `cnd_88x120x184`       |
| Barônia  | `brn_[cndId]_[i]`      | `brn_cnd_88x120x184_0` |
| Interior | `[fiefId]_bld[hexIdx]` | `88,120,184_b0_bld42`  |

---

## 🛠 Roadmap

* Biomas dinâmicos com vizinhos
* Sistema de altura e relevo
* Pathfinding (A* ou BFS)
* Renderização 3D via `exportGridAxial`
* Shaders de blend para bordas
* Modo offline completo

---

## 🌟 Contribua

* Fork o repositório
* Crie sua branch: `git checkout -b feature/nome-da-feature`
* Commit suas alterações: `git commit -m 'Add nova feature'`
* Push e abra Pull Request

---

*REVO World Builder™ — AR Softworks™ — Alpha v0.1.0*

---
