# Metodologia do projeto

## 1. Pergunta de pesquisa

Como o crescimento populacional dos municípios brasileiros entre os Censos de
2010 e 2022 se distribui pelo território, e que perfis de oportunidade de
mercado podem ser derivados desse dinamismo demográfico?

## 2. Natureza da pesquisa

- Pesquisa descritiva, quantitativa e exploratória.
- Dados secundários, de fonte oficial (IBGE).
- Unidade de análise: município.
- Recorte temporal: 2010 a 2022 (12 anos).
- Universo: 5.570 municípios com dados censitários em 2022.

## 3. Compatibilização de 2010

Limites municipais mudaram entre os censos. Para comparar, o projeto usa a
variação absoluta da população residente com base em 2010 **compatibilizada**
(variável 5936 do agregado 4709):

```text
pop2010Compat = pop2022 − varAbs5936
```

Para 5.565 municípios, o valor bruto de 2010 também é obtido no agregado 1378.
Para os 5 municípios criados depois de 2010, apenas a base compatibilizada
existe. Em 1.618 municípios, a base compatibilizada difere da população bruta
de 2010 por causa de ajustes de limites territoriais.

## 4. Indicadores

### Variação relativa

```text
varRel (%) = (pop2022 / pop2010Compat − 1) × 100
```

### Taxa de crescimento geométrico anual

```text
taxaAnual (%) = [(pop2022 / pop2010Compat)^(1/12) − 1] × 100
```

A fórmula foi conferida contra a variável 10605 do IBGE para todos os 5.570
municípios, com tolerância de 0,02 ponto percentual.

### Densidade

```text
densidade2010 = pop2010Compat / areaKm2_2022
densidade2022 = pop2022 / areaKm2_2022
```

Usar a mesma área (2022) para os dois anos evita viés por atualizações de
limites. A densidade de 2010 do IBGE (agregado 1301) serve apenas como
conferência.

### Agregação por UF e região

```text
taxa da UF (%) = [(Σ pop2022 / Σ pop2010Compat)^(1/12) − 1] × 100
```

Nunca usar a média simples das taxas municipais: municípios pequenos teriam o
mesmo peso que municípios grandes.

## 5. Classes de dinamismo

| Classe | Critério |
|---|---|
| Expansão acelerada | taxa ≥ +2,0% ao ano |
| Expansão moderada | 0% < taxa < +2,0% |
| Estabilidade | −0,1% ≤ taxa ≤ 0% |
| Retração moderada | −1,0% ≤ taxa < −0,1% |
| Retração acentuada | taxa < −1,0% |

Os cortes são critérios analíticos do projeto, não classificações oficiais.
Foram escolhidos a partir da distribuição observada:

- mediana: +0,13% ao ano;
- 10º percentil: −0,91%;
- 90º percentil: +1,48%.

## 6. Porte populacional

| Faixa | Critério |
|---|---|
| Muito pequeno | até 5.000 |
| Pequeno | 5.001 a 20.000 |
| Médio-pequeno | 20.001 a 50.000 |
| Médio | 50.001 a 100.000 |
| Grande | 100.001 a 500.000 |
| Metrópole | acima de 500.000 |

## 7. Matriz de leitura de oportunidades

Eixos:

- horizontal: taxa de crescimento anual;
- vertical: população de 2022, em escala logarítmica;
- linhas de referência: 0% e 50.000 habitantes;
- cores: região geográfica.

| Quadrante | Perfil | Leitura |
|---|---|---|
| Grande e crescendo | Expansão consolidada | Volume e dinamismo |
| Grande e sem crescimento | Mercado maduro/defensivo | Volume alto, sem dinamismo populacional |
| Pequeno e crescendo | Fronteira de crescimento | Mercado menor, em expansão |
| Pequeno e sem crescimento | Baixa prioridade | Volume baixo e sem dinamismo |

A matriz é uma ferramenta de leitura, não um índice oficial. O projeto não cria
um ranking composto arbitrário. Se for necessário um índice único, ele deve ser
transparente, com pesos explícitos e análise de sensibilidade.

## 8. Leitura de mercado

A análise sob a perspectiva da Administração parte de três dimensões:

1. **Tamanho:** população de 2022 e variação absoluta.
2. **Dinamismo:** taxa geométrica anual.
3. **Acessibilidade territorial:** densidade e região.

Essas dimensões ajudam a levantar hipóteses sobre setores com maior aderência
demográfica, como varejo, serviços, saúde, educação, construção, logística e
alimentação. Essas hipóteses **não são medidas de demanda**. A validação exigiria
renda, PIB, consumo, concorrência e dados primários.

## 9. Limitações

- Censos de 2010 e 2022 têm datas de referência e métodos de coleta distintos.
- Limites municipais mudaram; a base compatibilizada mitiga, mas não elimina
  esse efeito.
- Cinco municípios não têm população bruta de 2010.
- Boa Esperança do Norte/MT não está no agregado 4709.
- População não mede poder de compra.
- A densidade depende da área territorial de 2022.
- As classes e os perfis são construções analíticas.
- A análise é exploratória e não permite previsão de demanda.

## 10. Reprodutibilidade

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\build-data.ps1
```

O script:

1. consulta as quatro fontes oficiais;
2. normaliza os registros;
3. calcula os indicadores;
4. valida contagens, somas, UFs, regiões, nulos e fórmula;
5. grava `municipios.json`, `municipios.js`, `meta.json` e `municipios.csv`.

Se qualquer validação falhar, o script interrompe e não grava os arquivos.
