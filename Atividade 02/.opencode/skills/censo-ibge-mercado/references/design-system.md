# Design system do projeto

## Princípios

1. **Clareza acadêmica:** o dado vem antes do efeito visual.
2. **Contraste e legibilidade:** texto confortável, números tabulares.
3. **Hierarquia:** panorama → explorador → oportunidades → metodologia.
4. **Acessibilidade:** cor nunca é o único indicador.
5. **Responsividade:** mobile-first, sem rolagem horizontal na página.

## Paleta

### Tema claro

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#f6f7f9` | Fundo da página |
| `--surface` | `#ffffff` | Cartões |
| `--surface-2` | `#eef2f7` | Fundos secundários |
| `--text` | `#101828` | Texto principal |
| `--muted` | `#5b6475` | Texto secundário |
| `--border` | `#dfe4ec` | Bordas |
| `--primary` | `#1d4ed8` | Ações e destaques |
| `--accent` | `#0f766e` | Crescimento e ênfase |
| `--negative` | `#b42318` | Queda |
| `--warning` | `#b54708` | Atenção |
| `--hero-bg` | `#0b1f3a` | Hero |
| `--hero-text` | `#f8fafc` | Texto do hero |

### Tema escuro

| Token | Valor |
|---|---|
| `--bg` | `#070d18` |
| `--surface` | `#0f172a` |
| `--surface-2` | `#16233a` |
| `--text` | `#e6edf7` |
| `--muted` | `#94a3b8` |
| `--border` | `#22314a` |
| `--primary` | `#60a5fa` |
| `--accent` | `#2dd4bf` |
| `--negative` | `#f87171` |
| `--warning` | `#fbbf24` |
| `--hero-bg` | `#060d1a` |
| `--hero-text` | `#f8fafc` |

### Cores por região

| Região | Cor |
|---|---|
| Norte | `#0f766e` |
| Nordeste | `#b45309` |
| Sudeste | `#1d4ed8` |
| Sul | `#7c3aed` |
| Centro-Oeste | `#be123c` |

## Tipografia

```css
--font-display: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
--font-body: "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: "Cascadia Code", Consolas, "Courier New", monospace;
```

- H1: `clamp(2.4rem, 5vw, 4.4rem)`, serif, peso 600, linha 1.05.
- H2: `clamp(1.8rem, 3vw, 2.6rem)`, serif, peso 600.
- H3: 1.05rem, sans, peso 700.
- Corpo: 1rem, linha 1.65.
- Números: `font-variant-numeric: tabular-nums`.

## Espaçamento

Escala de 4 px: `4, 8, 12, 16, 24, 32, 48, 64, 96`.

## Componentes

### Botões

- Primário: fundo `--primary`, texto branco, raio 999 px.
- Secundário: borda `--border`, fundo transparente.
- Ícone: 40 × 40 px, raio 12 px.
- Estados: hover, focus-visible, active, disabled.

### Cartões

- Fundo `--surface`, borda 1 px, raio 16 px, sombra suave.
- Título, subtítulo e conteúdo com espaçamento consistente.

### Badges de dinamismo

- Expansão acelerada: fundo teal claro, texto teal escuro.
- Expansão moderada: fundo azul claro, texto azul escuro.
- Estabilidade: fundo cinza, texto cinza escuro.
- Retração moderada: fundo âmbar claro, texto âmbar escuro.
- Retração acentuada: fundo vermelho claro, texto vermelho escuro.

Sempre acompanhados de texto; nunca apenas cor.

### Tabela

- Cabeçalho sticky, `scope="col"`, ordenação com `aria-sort`.
- Números alinhados à direita.
- Linhas zebradas e hover.
- Em telas pequenas, cartões substituem a tabela.

### Modal

- Backdrop com desfoque.
- Painel com `role="dialog"`, `aria-modal="true"` e foco preso.
- Fechar com Escape, botão e clique no backdrop.

## Breakpoints

| Nome | Largura |
|---|---|
| `sm` | 480 px |
| `md` | 768 px |
| `lg` | 1024 px |
| `xl` | 1280 px |

## Acessibilidade

- Contraste mínimo AA (4,5:1 para texto normal).
- Foco visível em todos os controles.
- Link “pular para o conteúdo”.
- `aria-live="polite"` para contagem de resultados e mensagens.
- Gráficos com resumo textual e link para os dados.
- Respeitar `prefers-reduced-motion`.
- Não usar apenas cor para indicar crescimento ou queda.

## Performance

- Dados carregados uma vez.
- Tabela paginada em 50 linhas.
- Busca com debounce de 250 ms.
- Gráficos criados sob demanda.
- Sem CDN em runtime.
- Meta de peso inicial inferior a 2 MB (com dados) e inferior a 500 KB sem dados.
