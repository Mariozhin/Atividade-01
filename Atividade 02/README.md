# Censo 2010–2022 — Crescimento Populacional e Oportunidades de Mercado no Brasil

Página web interativa e responsiva que analisa o crescimento populacional dos
**5.570 municípios brasileiros** entre os Censos de **2010** e **2022**, usando
**exclusivamente dados oficiais do IBGE**, e deriva perfis de leitura para
oportunidades de mercado.

Projeto acadêmico da disciplina **Tecnologia da Informação e Comunicação Aplicada
à Administração**.

---

## 1. O que o site oferece

- **Panorama nacional:** população, variação absoluta e relativa, taxa geométrica
  anual, distribuição das taxas e crescimento por região.
- **Explorador de municípios:** busca por nome, filtros combinados de região, UF,
  dinamismo e porte populacional, ordenação por coluna, paginação e exportação CSV.
- **Detalhe municipal:** ficha com população de 2010 e 2022, variação, taxa,
  densidade, área, mini-gráfico e link direto para a consulta original no IBGE.
- **Oportunidades:** matriz tamanho × dinamismo, dispersão municipal, rankings de
  ganhos, perdas e taxas, além de leitura setorial com ressalvas metodológicas.
- **Metodologia:** fontes, fórmulas, classes analíticas, limitações e proveniência
  com checksum SHA-256 do snapshot.
- **Tema claro e escuro**, layout responsivo de 320 px a telas amplas e
  acessibilidade AA.

> **Aviso:** crescimento populacional é um indicador de potencial demográfico,
> **não de demanda efetiva**. A leitura setorial organiza hipóteses; a validação
> exigiria renda, PIB, consumo, concorrência e dados primários.

---

## 2. Estrutura do projeto

```text
Atividade 02/
├── index.html                      # Página única (todas as seções)
├── .nojekyll                       # Impede o processamento Jekyll no GitHub Pages
├── assets/
│   ├── css/styles.css              # Design system responsivo e temas
│   ├── img/favicon.svg             # Ícone do site
│   ├── js/
│   │   ├── utils.js                # Formatação pt-BR e utilitários
│   │   ├── config.js               # Constantes, classes e fontes
│   │   ├── data.js                 # Agregações, rankings e validação em runtime
│   │   ├── charts.js               # Gráficos Chart.js e tema
│   │   ├── ui.js                   # Filtros, tabela, modal, rankings, CSV
│   │   └── main.js                 # Ponto de entrada
│   └── vendor/chart.umd.min.js     # Chart.js 4.4.7 local (sem CDN em runtime)
├── data/
│   ├── municipios.json             # Snapshot canônico (5.570 registros)
│   ├── municipios.js               # Mesmo snapshot como window.CENSO_DATA
│   ├── municipios.csv              # Base completa para download
│   └── meta.json                   # Proveniência, consultas, totais e checksum
├── scripts/
│   ├── build-data.ps1              # Pipeline oficial de coleta e validação
│   └── serve.ps1                   # Servidor HTTP local (sem Node/Python)
├── docs/
│   └── relatorio.md                # Relatório acadêmico completo
└── .opencode/skills/censo-ibge-mercado/
    ├── SKILL.md                    # Skill do projeto e checklist
    └── references/                 # API, metodologia e design system
```

---

## 3. Como visualizar

### Opção A — Abrir diretamente

Abra `index.html` no navegador. O site foi construído com scripts clássicos
(IIFE) e caminhos relativos, então funciona via `file://`. A conferência online
da API depende de rede e pode ser bloqueada pelo navegador nesse modo.

### Opção B — Servidor local (recomendado)

Requer apenas Windows PowerShell 5.1:

```powershell
cd "Atividade 02"
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\serve.ps1 -Port 8080
```

Acesse <(https://mariozhin.github.io/Atividade-01/Atividade%2002/?utm_source=chatgpt.com)>. Para outra porta, use `-Port 5500`.

---

## 4. Dados oficiais do IBGE

| Uso | Agregado / API | Variável |
|---|---|---|
| População 2022 | 4709 | 93 |
| Variação absoluta 2010 compatibilizada | 4709 | 5936 |
| Taxa de crescimento geométrico | 4709 | 10605 |
| População 2010 (censo) | 1378 | 93, com `classificacao=1[0]` |
| Área territorial 2022 | 4714 | 6318 |
| Densidade 2022 | 4714 | 614 |
| Metadados territoriais | API de Localidades v1 | — |

Consultas completas:

```text
https://servicodados.ibge.gov.br/api/v1/localidades/municipios
https://servicodados.ibge.gov.br/api/v3/agregados/4709/periodos/2022/variaveis/93|5936|10605?localidades=N6[all]
https://servicodados.ibge.gov.br/api/v3/agregados/1378/periodos/2010/variaveis/93?localidades=N6[all]&classificacao=1[0]
https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/6318|614?localidades=N6[all]
```

### Fórmulas

```text
pop2010Compat = pop2022 − varAbs5936

varRel (%)    = (pop2022 / pop2010Compat − 1) × 100

taxaAnual (%) = [(pop2022 / pop2010Compat)^(1/12) − 1] × 100

densidade     = população / áreaKm2_2022
```

A taxa de UF/região é calculada sobre os **totais agregados**, nunca pela média
simples das taxas municipais.

### Números verificados

- Universo: **5.570 municípios** (27 UFs, 5 regiões).
- População 2022: **203.080.756**.
- População 2010 compatibilizada: **190.755.799**.
- Variação absoluta: **+12.324.957** (+6,46%).
- Taxa geométrica anual: **0,52% a.a.**
- Crescendo: **3.158** (56,7%); estáveis: **298** (5,4%); em retração: **2.114** (38,0%).

---

## 5. Reproduzir o pipeline

Requisito: **Windows PowerShell 5.1+**. Nenhum Node, Python ou npm é necessário.

```powershell
cd "Atividade 02"
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\build-data.ps1
```

O script:

1. consulta as quatro fontes oficiais, com novas tentativas em caso de falha;
2. normaliza os registros e calcula os indicadores;
3. valida contagem, somas, UFs, regiões, campos nulos e a fórmula da taxa;
4. grava `municipios.json`, `municipios.js`, `meta.json` e `municipios.csv`.

Se qualquer verificação falhar, o script interrompe **sem gravar** os arquivos.

### Verificações automáticas (8/8)

| Verificação | Esperado |
|---|---|
| Registros | 5.570 |
| Soma da população 2022 | 203.080.756 |
| Soma da população 2010 compatibilizada | 190.755.799 |
| Soma da população 2010 (censo) | 190.755.799 |
| UFs | 27 |
| Regiões | 5 |
| Campos centrais nulos | 0 |
| Divergências na fórmula da taxa | 0 |

---

## 6. Tratamento e limitações

- A base de 2010 é a **compatibilizada** pelo IBGE (`pop2022 − varAbs5936`), que
  mitiga mudanças de limites municipais.
- **1.618 municípios** tiveram ajuste de limites entre os censos.
- **5 municípios** criados após 2010 não têm população bruta de 2010; a base
  compatibilizada cobre esses casos.
- **Boa Esperança do Norte/MT** aparece na API de Localidades (5.571 registros),
  mas não no agregado 4709; por isso fica fora do universo de 5.570.
- A densidade usa a área territorial de 2022 para os dois anos.
- As classes de dinamismo e porte são **critérios analíticos do projeto**, não
  classificações oficiais do IBGE.
- A análise é descritiva e exploratória; **não permite previsão de demanda**.

Detalhes completos em [`docs/relatorio.md`](docs/relatorio.md) e em
`.opencode/skills/censo-ibge-mercado/references/metodologia.md`.

---

## 7. Publicar no GitHub Pages

O site é 100% estático. Sugestão de repositório: **`censo-ibge-mercado`**.

### Passo a passo

1. Crie um repositório no GitHub (público).
2. Envie **o conteúdo da pasta `Atividade 02/`** como raiz do repositório:

   ```powershell
   cd "Atividade 02"
   git init
   git add .
   git commit -m "Censo 2010-2022: site academico com dados oficiais do IBGE"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/censo-ibge-mercado.git
   git push -u origin main
   ```

3. No GitHub, abra **Settings → Pages**.
4. Em **Source**, selecione **Deploy from a branch**.
5. Escolha a branch **`main`** e a pasta **`/ (root)`**. Salve.
6. Aguarde a publicação e acesse:

   ```text
   https://SEU-USUARIO.github.io/censo-ibge-mercado/
   ```

O arquivo `.nojekyll` já está incluído, e todos os caminhos são relativos, então o
site funciona tanto na raiz quanto em subpasta. A página não depende de backend.

> **Dica:** o botão **Conferir na API** faz uma consulta ao vivo ao IBGE. Se a rede
> ou o CORS do ambiente bloquearem, o snapshot local continua válido e o site não
> quebra.

---

## 8. Acessibilidade e desempenho

- HTML5 semântico, `lang="pt-BR"`, landmarks e link de salto.
- Navegação por teclado, foco visível e fechamento de modal com `Esc`.
- Tabela com `caption`, `scope` e `aria-sort`.
- `aria-live` para contagem de resultados e avisos.
- Alternativa textual para gráficos e respeito a `prefers-reduced-motion`.
- Lighthouse (viewport móvel): **Acessibilidade 1,0**, **Boas Práticas 1,0**,
  **SEO 1,0**, sem falhas.

---

## 9. Skill do projeto

A pasta `.opencode/skills/censo-ibge-mercado/` documenta o padrão do projeto para
futuras alterações:

- `SKILL.md`: regras de dados, fontes, fórmulas, padrões técnicos e checklist.
- `references/ibge-api.md`: consultas e formato das respostas.
- `references/metodologia.md`: pergunta, indicadores, classes e limitações.
- `references/design-system.md`: cores, tipografia, componentes e breakpoints.

---

## 10. Créditos

- **Dados:** Instituto Brasileiro de Geografia e Estatística (IBGE) — Censos
  Demográficos de 2010 e 2022, API de Agregados v3 e API de Localidades v1.
- **Gráficos:** [Chart.js](https://www.chartjs.org/) 4.4.7, incluído localmente
  (licença MIT).
- **Projeto:** disciplina Tecnologia da Informação e Comunicação Aplicada à
  Administração.

Os dados são de domínio público e citados com suas respectivas fontes oficiais.
