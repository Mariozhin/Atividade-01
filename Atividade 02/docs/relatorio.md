# Relatório — Crescimento Populacional e Oportunidades de Mercado no Brasil

**Disciplina:** Tecnologia da Informação e Comunicação Aplicada à Administração
**Tema:** crescimento populacional municipal e leitura de oportunidades de mercado
**Recorte:** Censos Demográficos de 2010 e 2022
**Fonte:** IBGE — API de Agregados v3 e API de Localidades v1
**Universo:** 5.570 municípios
**Extração:** 9 de novembro de 2026

---

## Resumo

Este trabalho analisa a evolução da população residente dos municípios brasileiros
entre 2010 e 2022 e organiza os resultados em uma leitura de oportunidades de
mercado. A base é composta exclusivamente por dados oficiais do IBGE, obtidos por
API e validados por um pipeline automatizado. Entre 2010 e 2022, o Brasil passou de
**190.755.799** para **203.080.756** habitantes, um acréscimo de **12.324.957**
pessoas (**+6,46%**), equivalente a **0,52% ao ano**. O crescimento, porém, foi
desigual: **3.158 municípios** (56,7%) cresceram, **298** (5,4%) ficaram em
estabilidade e **2.114** (38,0%) entraram em retração. A leitura de mercado cruza
tamanho populacional e dinamismo para levantar hipóteses setoriais, sem confundir
crescimento demográfico com demanda efetiva.

**Palavras-chave:** Censo 2022; população municipal; crescimento geométrico;
oportunidades de mercado; IBGE; análise territorial.

---

## 1. Introdução

A distribuição da população brasileira mudou de forma relevante na última década.
Migrações internas, expansão de fronteiras agrícolas e urbanas, envelhecimento e
mudanças de limites municipais produzem trajetórias distintas entre os 5.570
municípios do país. Para a Administração, esse dinamismo é uma informação
estratégica: ele indica onde o mercado potencial se expande, se estabiliza ou se
retrai.

O objetivo geral é **descrever o crescimento populacional municipal entre 2010 e
2022** e **derivar perfis de leitura para oportunidades de mercado**. Os objetivos
específicos são:

1. construir uma base municipal confiável e reprodutível a partir do IBGE;
2. calcular variação absoluta, variação relativa, taxa geométrica anual e densidade;
3. classificar os municípios por dinamismo e porte populacional;
4. identificar padrões regionais e municipais;
5. propor uma matriz de leitura de oportunidades com ressalvas metodológicas.

### Pergunta de pesquisa

Como o crescimento populacional dos municípios brasileiros entre 2010 e 2022 se
distribui pelo território, e que perfis de oportunidade de mercado podem ser
derivados desse dinamismo demográfico?

---

## 2. Metodologia

### 2.1 Natureza da pesquisa

Pesquisa **descritiva, quantitativa e exploratória**, com dados secundários de
fonte oficial. A unidade de análise é o município; o recorte temporal é de 12 anos
(2010–2022).

### 2.2 Fontes de dados

| Uso | Agregado / API | Variável |
|---|---|---|
| População 2022 | 4709 | 93 |
| Variação absoluta 2010 compatibilizada | 4709 | 5936 |
| Taxa de crescimento geométrico | 4709 | 10605 |
| População 2010 (censo) | 1378 | 93, com `classificacao=1[0]` |
| Área territorial 2022 | 4714 | 6318 |
| Densidade 2022 | 4714 | 614 |
| Metadados territoriais | API de Localidades v1 | — |

Consultas:

```text
https://servicodados.ibge.gov.br/api/v1/localidades/municipios
https://servicodados.ibge.gov.br/api/v3/agregados/4709/periodos/2022/variaveis/93|5936|10605?localidades=N6[all]
https://servicodados.ibge.gov.br/api/v3/agregados/1378/periodos/2010/variaveis/93?localidades=N6[all]&classificacao=1[0]
https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/6318|614?localidades=N6[all]
```

### 2.3 Compatibilização de 2010

Limites municipais mudaram entre os censos. Para permitir comparação, usa-se a
variação absoluta da população residente com base em 2010 **compatibilizada**
(variável 5936 do agregado 4709):

```text
pop2010Compat = pop2022 − varAbs5936
```

A população bruta de 2010 (agregado 1378) é mantida apenas como referência. Em
**1.618 municípios** a base compatibilizada difere da população bruta por ajustes
de limites. **Cinco municípios** criados após 2010 não têm população bruta de 2010;
a base compatibilizada cobre esses casos.

### 2.4 Indicadores

```text
varRel (%)    = (pop2022 / pop2010Compat − 1) × 100

taxaAnual (%) = [(pop2022 / pop2010Compat)^(1/12) − 1] × 100

densidade     = população / áreaKm2_2022
```

A taxa geométrica foi conferida contra a variável 10605 do IBGE para todos os
5.570 municípios, com tolerância de 0,02 ponto percentual. A taxa de UF e de região
é calculada sobre os **totais agregados**:

```text
taxa da UF (%) = [(Σ pop2022 / Σ pop2010Compat)^(1/12) − 1] × 100
```

Nunca se usa a média simples das taxas municipais, pois municípios pequenos
receberiam o mesmo peso que municípios grandes.

### 2.5 Classes analíticas

**Dinamismo:**

| Classe | Critério |
|---|---|
| Expansão acelerada | taxa ≥ +2,0% ao ano |
| Expansão moderada | 0% < taxa < +2,0% |
| Estabilidade | −0,1% ≤ taxa ≤ 0% |
| Retração moderada | −1,0% ≤ taxa < −0,1% |
| Retração acentuada | taxa < −1,0% |

**Porte populacional (2022):**

| Faixa | Critério |
|---|---|
| Muito pequeno | até 5.000 |
| Pequeno | 5.001 a 20.000 |
| Médio-pequeno | 20.001 a 50.000 |
| Médio | 50.001 a 100.000 |
| Grande | 100.001 a 500.000 |
| Metrópole | acima de 500.000 |

Os cortes são **critérios analíticos do projeto**, não classificações oficiais do
IBGE. Foram calibrados a partir da distribuição observada (mediana +0,13%,
10º percentil −0,91%, 90º percentil +1,48%).

### 2.6 Validação

O pipeline `scripts/build-data.ps1` aplica oito verificações antes de gravar
qualquer arquivo:

| Verificação | Resultado |
|---|---|
| Registros | 5.570 |
| Soma da população 2022 | 203.080.756 |
| Soma da população 2010 compatibilizada | 190.755.799 |
| Soma da população 2010 (censo) | 190.755.799 |
| UFs | 27 |
| Regiões | 5 |
| Campos centrais nulos | 0 |
| Divergências na fórmula da taxa | 0 |

O snapshot também recebe um checksum SHA-256, registrado em `data/meta.json`:
`2837fa4087b57a64aae5741c5ab05156ced8a5b8e0f1ce4a298a4691b6fea0a2`.

---

## 3. Resultados

### 3.1 Panorama nacional

| Indicador | Valor |
|---|---|
| População 2022 | 203.080.756 |
| População 2010 compatibilizada | 190.755.799 |
| Variação absoluta | +12.324.957 |
| Variação relativa | +6,46% |
| Taxa geométrica anual | +0,52% a.a. |
| Municípios analisados | 5.570 |

A distribuição das taxas municipais é assimétrica:

| Estatística | Taxa anual |
|---|---|
| Mínimo | −4,89% (Catarina/CE) |
| 10º percentil | −0,91% |
| Mediana | +0,13% |
| Média | +0,23% |
| 90º percentil | +1,48% |
| Máximo | +9,23% (Canaã dos Carajás/PA) |

### 3.2 Dinamismo municipal

| Classe | Municípios | Participação |
|---|---:|---:|
| Expansão acelerada | 305 | 5,5% |
| Expansão moderada | 2.853 | 51,2% |
| Estabilidade | 298 | 5,4% |
| Retração moderada | 1.667 | 29,9% |
| Retração acentuada | 447 | 8,0% |
| **Crescendo** | **3.158** | **56,7%** |
| **Estáveis** | **298** | **5,4%** |
| **Em retração** | **2.114** | **38,0%** |

Apenas 31 municípios têm taxa exatamente igual a zero; o projeto define
estabilidade como o intervalo −0,1% ≤ taxa ≤ 0%, o que abrange 298 municípios.

### 3.3 Porte populacional

| Faixa | Municípios |
|---|---:|
| Até 5 mil | 1.324 |
| 5 a 20 mil | 2.537 |
| 20 a 50 mil | 1.052 |
| 50 a 100 mil | 338 |
| 100 a 500 mil | 278 |
| Acima de 500 mil | 41 |

A maioria absoluta dos municípios é pequena: **3.861 (69,3%)** têm até 20 mil
habitantes. Os 41 municípios acima de 500 mil concentram parcela relevante da
população nacional.

### 3.4 Crescimento por região

| Região | Municípios | População 2022 | Variação absoluta | Variação relativa | Taxa anual |
|---|---:|---:|---:|---:|---:|
| Centro-Oeste | 467 | 16.289.538 | +2.231.444 | +15,87% | **+1,24%** |
| Norte | 450 | 17.354.884 | +1.490.430 | +9,39% | +0,75% |
| Sul | 1.191 | 29.937.706 | +2.550.815 | +9,31% | +0,74% |
| Sudeste | 1.668 | 84.840.113 | +4.475.703 | +5,57% | +0,45% |
| Nordeste | 1.794 | 54.658.515 | +1.576.565 | +2,97% | +0,24% |

O **Centro-Oeste** lidera o ritmo relativo, seguido por Norte e Sul. O **Nordeste**
cresce abaixo da média nacional, e o **Sudeste** combina o maior volume absoluto
com taxa moderada.

### 3.5 Extremos estaduais

**Maiores taxas anuais:**

| UF | Taxa anual | Municípios | Crescendo | Em retração |
|---|---:|---:|---:|---:|
| Roraima | +2,93% | 15 | 15 | 0 |
| Santa Catarina | +1,66% | 295 | 224 | 71 |
| Mato Grosso | +1,57% | 141 | 91 | 50 |
| Goiás | +1,36% | 246 | 154 | 90 |
| Acre | +1,03% | 22 | 21 | 0 |

**Menores taxas anuais:**

| UF | Taxa anual | Municípios | Crescendo | Em retração |
|---|---:|---:|---:|---:|
| Alagoas | +0,02% | 102 | 33 | 69 |
| Rio de Janeiro | +0,03% | 92 | 64 | 26 |
| Bahia | +0,07% | 417 | 181 | 232 |
| Rondônia | +0,10% | 52 | 13 | 39 |
| Rio Grande do Sul | +0,15% | 497 | 207 | 289 |

### 3.6 Rankings municipais

**Maiores ganhos absolutos:**

| Município | UF | Variação absoluta | População 2022 |
|---|---|---:|---:|
| Manaus | AM | +261.675 | 2.063.689 |
| Brasília | DF | +245.222 | 2.817.381 |
| São Paulo | SP | +198.496 | 11.451.999 |
| Sorocaba | SP | +136.866 | 723.682 |
| Goiânia | GO | +135.454 | 1.437.366 |

**Maiores perdas absolutas:**

| Município | UF | Variação absoluta | População 2022 |
|---|---|---:|---:|
| Salvador | BA | −257.978 | 2.417.678 |
| Rio de Janeiro | RJ | −109.223 | 6.211.223 |
| São Gonçalo | RJ | −102.984 | 896.744 |
| Belém | PA | −89.996 | 1.303.403 |
| Porto Alegre | RS | −76.506 | 1.332.845 |

**Maiores taxas anuais:**

| Município | UF | Taxa anual | População 2022 |
|---|---|---:|---:|
| Canaã dos Carajás | PA | +9,23% | 77.079 |
| Abadia de Goiás | GO | +8,88% | 19.128 |
| Extremoz | RN | +7,97% | 61.635 |
| Goianira | GO | +6,43% | 71.916 |
| Itapoá | SC | +6,31% | 30.750 |

**Maiores retrações anuais:**

| Município | UF | Taxa anual | População 2022 |
|---|---|---:|---:|
| Catarina | CE | −4,89% | 10.243 |
| Santana do Araguaia | PA | −4,48% | 32.413 |
| Salgadinho | PE | −3,97% | 5.727 |
| Ministro Andreazza | RO | −3,85% | 6.466 |
| Campo Alegre | AL | −3,80% | 32.106 |

**Maiores populações:**

| Município | UF | População 2022 |
|---|---|---:|
| São Paulo | SP | 11.451.999 |
| Rio de Janeiro | RJ | 6.211.223 |
| Brasília | DF | 2.817.381 |
| Fortaleza | CE | 2.428.708 |
| Salvador | BA | 2.417.678 |

### 3.7 Densidade

A área territorial somada é de **8.497.332 km²**, resultando em densidade nacional
média de **23,9 hab/km²**. Os municípios mais densos são Taboão da Serra/SP
(13.415,5 hab/km²), Diadema/SP (12.796,5) e São João de Meriti/RJ (12.520,2).

---

## 4. Leitura de oportunidades

### 4.1 Matriz tamanho × dinamismo

O corte usa **50 mil habitantes** no eixo de tamanho e **0%** no eixo de dinamismo:

| Quadrante | Perfil | Municípios | Leitura |
|---|---|---:|---|
| Grande e crescendo | Expansão consolidada | 569 | Volume relevante e dinamismo positivo |
| Grande e sem crescimento | Mercado maduro | 88 | Volume alto, sem dinamismo populacional |
| Pequeno e crescendo | Fronteira de crescimento | 2.589 | Base menor, em expansão |
| Pequeno e sem crescimento | Baixa prioridade | 2.324 | Volume baixo e sem dinamismo |

### 4.2 Hipóteses setoriais

| Perfil demográfico | Leitura de mercado | Setores para investigação |
|---|---|---|
| Expansão acelerada + alta densidade | Mercado em expansão e com proximidade | Varejo de proximidade, alimentação, serviços pessoais, educação, saúde |
| Expansão acelerada + baixa densidade | Fronteira de ocupação | Construção, agroserviços, logística, serviços essenciais |
| Crescimento moderado + grande porte | Mercado maduro em expansão | Serviços especializados, franquias, saúde, educação |
| Estabilidade ou retração + grande porte | Mercado consolidado | Eficiência, nichos, serviços para idosos, consolidação |
| Retração + pequeno porte | Risco de mercado | Cautela, negócios digitais/remotos, serviços essenciais |

Essas hipóteses **não são medidas de demanda**. A validação de uma oportunidade
exige renda, PIB, consumo, concorrência e dados primários.

---

## 5. Discussão

Os resultados mostram um país que cresce, mas com **desigualdade territorial
crescente**. O Centro-Oeste e partes do Norte e do Sul avançam acima da média,
enquanto o Nordeste e o Sudeste crescem menos. No nível municipal, a polarização é
mais nítida: quase quatro em cada dez municípios perdem população, e muitos deles
são pequenos e dependentes de atividades tradicionais.

Para a Administração, isso significa que **o mercado nacional não é homogêneo**.
Estratégias de expansão baseadas apenas no tamanho populacional podem ignorar
municípios dinâmicos de porte médio, enquanto estratégias baseadas apenas no
crescimento podem superestimar mercados pequenos. A matriz tamanho × dinamismo
ajuda a organizar a priorização, mas deve ser combinada com indicadores
socioeconômicos.

A leitura setorial é exploratória. Ela sugere, por exemplo, que municípios em
expansão acelerada e alta densidade tendem a demandar serviços de proximidade,
enquanto municípios em expansão e baixa densidade podem se beneficiar de
construção, logística e agroserviços. Essas são **hipóteses de trabalho**, não
conclusões.

---

## 6. Limitações

1. Censos de 2010 e 2022 têm datas de referência e métodos de coleta distintos.
2. Limites municipais mudaram; a base compatibilizada mitiga, mas não elimina esse
   efeito.
3. Cinco municípios criados após 2010 não têm população bruta de 2010.
4. Boa Esperança do Norte/MT não está no agregado 4709 e fica fora do universo.
5. População não mede renda, consumo ou poder de compra.
6. A densidade depende da área territorial de 2022.
7. As classes e os perfis são construções analíticas do projeto.
8. A análise é exploratória e não permite previsão de demanda.

---

## 7. Considerações finais

O projeto entrega uma base municipal reprodutível, um site interativo e uma leitura
de oportunidades transparente. Todos os números exibidos são rastreáveis às APIs
oficiais do IBGE ou a fórmulas documentadas. O pipeline valida contagens, somas,
UFs, regiões, nulos e a fórmula da taxa antes de publicar os dados.

Como extensões futuras, sugere-se:

- incorporar renda, PIB e consumo para qualificar a demanda;
- analisar estrutura etária e envelhecimento;
- incluir mapas coropléticos por município;
- comparar com projeções populacionais oficiais do IBGE.

---

## 8. Referências

INSTITUTO BRASILEIRO DE GEOGRAFIA E ESTATÍSTICA. **Censo Demográfico 2022**.
Rio de Janeiro: IBGE. Disponível em:
<https://www.ibge.gov.br/estatisticas/sociais/populacao/22827-censo-demografico-2022.html>.

INSTITUTO BRASILEIRO DE GEOGRAFIA E ESTATÍSTICA. **API de Agregados v3**.
Disponível em: <https://servicodados.ibge.gov.br/api/docs/agregados>.

INSTITUTO BRASILEIRO DE GEOGRAFIA E ESTATÍSTICA. **API de Localidades v1**.
Disponível em: <https://servicodados.ibge.gov.br/api/docs/localidades>.

INSTITUTO BRASILEIRO DE GEOGRAFIA E ESTATÍSTICA. **SIDRA — Tabela 4709**.
Disponível em: <https://sidra.ibge.gov.br/tabela/4709>.

INSTITUTO BRASILEIRO DE GEOGRAFIA E ESTATÍSTICA. **SIDRA — Tabela 4714**.
Disponível em: <https://sidra.ibge.gov.br/tabela/4714>.

---

## Apêndice A — Reprodutibilidade

```powershell
cd "Atividade 02"
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\build-data.ps1
```

O script gera `data/municipios.json`, `data/municipios.js`, `data/meta.json` e
`data/municipios.csv`. Se qualquer validação falhar, ele interrompe sem gravar.

## Apêndice B — Estrutura do snapshot

Cada registro municipal contém:

```text
id, nome, uf, ufId, regiao, regiaoImediata,
pop2010Censo, pop2010Compat, pop2022, varAbs, varRel,
taxaAnual, areaKm2, densidade2010, densidade2022
```
