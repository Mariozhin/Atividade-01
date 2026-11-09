---
name: Censo IBGE — Mercado
description: Constrói, revisa e valida o site acadêmico sobre crescimento populacional 2010–2022 e oportunidades de mercado no Brasil, usando exclusivamente dados oficiais do IBGE.
---

# Skill: Censo IBGE — Mercado

## Quando usar

Use esta skill antes de criar, alterar ou revisar qualquer parte do projeto
**“Crescimento Populacional e Oportunidades de Mercado no Brasil”**: pipeline de
dados, HTML, CSS, JavaScript, gráficos, textos analíticos e documentação.

## Contexto do projeto

- **Disciplina:** Tecnologia da Informação e Comunicação Aplicada à Administração.
- **Tema:** crescimento populacional e oportunidades de mercado no Brasil.
- **Recorte:** municípios brasileiros, Censos de 2010 e 2022.
- **Produto:** página HTML interativa, responsiva, publicada no GitHub Pages.
- **Público:** avaliação acadêmica e leitura gerencial dos dados.

## Regras de dados (não negociáveis)

1. Usar **exclusivamente** dados oficiais do IBGE.
2. Nunca inventar, estimar, interpolar ou “completar” valores.
3. Exibir `n/d` quando o dado não existir.
4. Separar claramente **dado oficial** de **interpretação analítica**.
5. Registrar em `data/meta.json` a URL, a variável e a data de extração.
6. Não apresentar crescimento populacional como sinônimo de demanda efetiva.
7. Toda afirmação do site deve ser rastreável a um campo do snapshot ou a uma
   fórmula documentada.

## Fontes oficiais

| Uso | Agregado / API | Variável |
|---|---|---|
| População 2022 | 4709 | 93 |
| Variação absoluta 2010 compatibilizada | 4709 | 5936 |
| Taxa de crescimento geométrico | 4709 | 10605 |
| População 2010 (censo) | 1378 | 93, com `classificacao=1[0]` |
| Área territorial 2022 | 4714 | 6318 |
| Densidade 2022 | 4714 | 614 |
| Metadados territoriais | API de Localidades v1 | — |

Consultas completas: `references/ibge-api.md`.

## Fórmulas

```text
pop2010Compat = pop2022 − varAbs5936

varRel (%) = (pop2022 / pop2010Compat − 1) × 100

taxaAnual (%) = [(pop2022 / pop2010Compat)^(1/12) − 1] × 100

densidade2010 = pop2010Compat / areaKm2_2022
densidade2022 = pop2022 / areaKm2_2022

taxa da UF (%) = [(Σ pop2022 / Σ pop2010Compat)^(1/12) − 1] × 100
```

Nunca calcular a taxa da UF pela média simples das taxas municipais.

## Classes analíticas

### Dinamismo

| Classe | Critério |
|---|---|
| Expansão acelerada | taxa ≥ +2,0% ao ano |
| Expansão moderada | 0% < taxa < +2,0% |
| Estabilidade | −0,1% ≤ taxa ≤ 0% |
| Retração moderada | −1,0% ≤ taxa < −0,1% |
| Retração acentuada | taxa < −1,0% |

### Porte populacional (2022)

| Faixa | Critério |
|---|---|
| Muito pequeno | até 5.000 |
| Pequeno | 5.001 a 20.000 |
| Médio-pequeno | 20.001 a 50.000 |
| Médio | 50.001 a 100.000 |
| Grande | 100.001 a 500.000 |
| Metrópole | acima de 500.000 |

Esses cortes são **critérios analíticos do projeto**, não classificações oficiais.

## Padrões técnicos

- HTML5 semântico, em português (pt-BR).
- CSS3 mobile-first, com custom properties e breakpoints em 480, 768, 1024 e 1280 px.
- JavaScript vanilla, em scripts clássicos com IIFE, para funcionar também via `file://`.
- Chart.js local em `assets/vendor/`, sem CDN em runtime.
- Dados em `data/municipios.js` (fallback offline) e `data/municipios.json` (fonte canônica).
- Caminhos relativos, sem barra inicial, para funcionar em subpasta do GitHub Pages.
- Sem backend, banco de dados, login ou dependência de npm.
- Sem fontes externas; usar a pilha de fontes do sistema.
- Acessibilidade: landmarks, foco visível, contraste AA, tabela com `scope`,
  `aria-live` para filtros e alternativa textual aos gráficos.
- Respeitar `prefers-reduced-motion`.
- Formatar números com `Intl.NumberFormat("pt-BR")`.

## Estrutura esperada

```text
index.html
assets/css/styles.css
assets/js/config.js
assets/js/data.js
assets/js/charts.js
assets/js/ui.js
assets/js/main.js
assets/vendor/chart.umd.min.js
data/municipios.json
data/municipios.js
data/meta.json
data/municipios.csv
scripts/build-data.ps1
docs/relatorio.md
```

## Checklist de validação

Antes de considerar o artefato pronto:

- [ ] `data/municipios.json` tem 5.570 registros.
- [ ] Soma de `pop2022` = 203.080.756.
- [ ] Soma de `pop2010Compat` = 190.755.799.
- [ ] Soma de `pop2010Censo` (não nulos) = 190.755.799.
- [ ] Nenhum campo central nulo.
- [ ] Fórmula da taxa confere com a variável 10605 em todos os registros.
- [ ] 27 UFs e 5 regiões.
- [ ] Os 5 municípios sem população bruta de 2010 estão cobertos pela base compatibilizada.
- [ ] Boa Esperança do Norte/MT está fora do universo e isso está documentado.
- [ ] Nenhum valor inventado ou estimado.
- [ ] Site responsivo de 320 px a 1440 px.
- [ ] Navegação por teclado e contraste adequado.
- [ ] Nenhum erro no console do navegador.
- [ ] GitHub Pages abre corretamente em subpasta.

## Definição de pronto

O projeto está pronto quando:

1. O pipeline roda do zero e gera os quatro arquivos de dados.
2. O site carrega o snapshot, permite explorar os 5.570 municípios e apresenta
   a leitura de oportunidades com as ressalvas metodológicas.
3. A documentação permite reproduzir a análise.
4. A URL pública do GitHub Pages funciona.
5. Todos os números exibidos são rastreáveis à API do IBGE.
