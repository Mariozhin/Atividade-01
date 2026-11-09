# API oficial do IBGE — referência do projeto

Verificação realizada em **09/11/2026**. A API pode ser atualizada pelo IBGE;
o snapshot do projeto registra a data de extração em `data/meta.json`.

## Situação das documentações

| Página | Resultado em 09/11/2026 |
|---|---|
| `https://servicodados.ibge.gov.br/api/docs/localidades` | HTTP 200 |
| `https://servicodados.ibge.gov.br/api/docs/agregados` | HTTP 500 (instabilidade do portal) |
| API v3 de Agregados | HTTP 200 |
| API v1 de Localidades | HTTP 200 |
| SIDRA — tabelas 4709, 4714 e 1378 | HTTP 200 |

A instabilidade da página de documentação de Agregados não afeta a API. As
consultas abaixo foram testadas diretamente e conferidas nas tabelas do SIDRA.

## Consultas usadas

### 1. Universo territorial

```text
GET https://servicodados.ibge.gov.br/api/v1/localidades/municipios
```

- Retorna 5.571 municípios.
- Campos usados: `id`, `nome`, `microrregiao.mesorregiao.UF.sigla`,
  `microrregiao.mesorregiao.UF.id`, `microrregiao.mesorregiao.UF.regiao.nome`,
  `regiao-imediata.nome`.
- Inclui **Boa Esperança do Norte/MT**, que não aparece no agregado 4709.

### 2. Núcleo populacional

```text
GET https://servicodados.ibge.gov.br/api/v3/agregados/4709/periodos/2022/variaveis/93|5936|10605?localidades=N6[all]
```

- 5.570 municípios.
- Variável 93: população residente em 2022.
- Variável 5936: variação absoluta da população residente com base em 2010
  compatibilizada.
- Variável 10605: taxa de crescimento geométrico, em % ao ano.
- É a fonte principal da análise.

### 3. População de 2010

```text
GET https://servicodados.ibge.gov.br/api/v3/agregados/1378/periodos/2010/variaveis/93?localidades=N6[all]&classificacao=1[0]
```

- 5.565 municípios.
- O filtro `classificacao=1[0]` seleciona o total da classificação
  “situação do domicílio”.
- Não retorna os 5 municípios criados depois de 2010.

### 4. Área e densidade

```text
GET https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/6318|614?localidades=N6[all]
```

- 5.570 municípios.
- Variável 6318: área da unidade territorial, em km².
- Variável 614: densidade demográfica, em hab/km².
- O projeto usa a área de 2022 para calcular a densidade dos dois anos.

### 5. Densidade de 2010 (conferência opcional)

```text
GET https://servicodados.ibge.gov.br/api/v3/agregados/1301/periodos/2010/variaveis/616?localidades=N6[all]
```

- 5.565 municípios.
- Usada apenas como conferência; não entra no snapshot principal.

## Formato da resposta de agregados

```json
[
  {
    "id": "93",
    "variavel": "População residente",
    "unidade": "Pessoas",
    "resultados": [
      {
        "classificacoes": [],
        "series": [
          {
            "localidade": {
              "id": "1100015",
              "nivel": { "id": "N6", "nome": "Município" },
              "nome": "Alta Floresta D'Oeste - RO"
            },
            "serie": { "2022": "21494" }
          }
        ]
      }
    ]
  }
]
```

Os valores vêm como texto; o pipeline converte para número.

## Cuidados

- `N6[all]` = todos os municípios; `N3[all]` = todas as UFs.
- O separador de variáveis na URL é `|`.
- Os colchetes de `localidades=N6[all]` devem ser enviados literalmente.
- A API responde com CORS `*`, permitindo consulta direta no navegador.
- Foram observados timeouts pontuais; o pipeline usa até quatro tentativas.
- A soma das populações municipais confere com os totais oficiais:
  - 2022: 203.080.756
  - 2010: 190.755.799
- As somas por UF conferem com a consulta `N3[all]`.

## Municípios criados após 2010

| Município | UF |
|---|---|
| Mojuí dos Campos | PA |
| Pescaria Brava | SC |
| Balneário Rincão | SC |
| Pinto Bandeira | RS |
| Paraíso das Águas | MS |

Eles não têm população bruta de 2010, mas a variação compatibilizada do
agregado 4709 permite calcular a base de 2010.

## Boa Esperança do Norte/MT

Consta na API de Localidades, mas não no agregado 4709. Por isso, fica fora do
universo de 5.570 municípios. O site deve registrar essa exclusão na seção de
metodologia.
