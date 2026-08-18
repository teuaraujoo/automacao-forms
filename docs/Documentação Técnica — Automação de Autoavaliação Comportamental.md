# Documentação Técnica — Automação de Autoavaliação Comportamental

## 1. Visão geral

O projeto consiste na automação do fluxo de processamento de um **Questionário de Autoavaliação Comportamental**, utilizado por uma terapeuta antes das consultas com seus pacientes.

Originalmente, após o preenchimento do formulário, era necessário analisar manualmente as respostas, identificar os principais padrões comportamentais, gerar uma representação gráfica e produzir uma interpretação para o paciente.

A solução automatiza esse processo utilizando principalmente o ecossistema Google:

**Google Forms → Google Apps Script → Google Sheets/Drive → API de IA → E-mail**

O sistema é acionado automaticamente após uma nova resposta ao formulário.

---

## 2. Problema

O processo manual exige que a profissional realize repetidamente as seguintes atividades:

- acessar as respostas do formulário;
- analisar individualmente as respostas;
- separar as perguntas por categorias comportamentais;
- produzir uma interpretação textual;
- enviar o resultado ao paciente.

---

## 3. Objetivo

Automatizar o processamento das respostas do Questionário de Autoavaliação Comportamental.

Após o envio do formulário, o sistema deve ser capaz de:

1. identificar o paciente;  
2. capturar seu e-mail;  
3. capturar as respostas;  
4. agrupar as respostas por trava emocional;  
5. calcular a média de cada grupo;  
6. classificar o impacto;  
7. identificar trava principal, secundária e associadas;  
8. gerar um gráfico dos resultados;  
9. enviar os resultados estruturados para uma IA;  
10. receber uma interpretação textual;  
11. montar um e-mail personalizado;  
12. enviar automaticamente gráfico e interpretação ao paciente.

---

## 4. Tecnologias utilizadas

### Google Forms

Responsável pela coleta das respostas dos pacientes.

O formulário possui perguntas de identificação e perguntas comportamentais avaliadas numericamente.

### Google Apps Script

Responsável pela lógica principal da automação.

Executa:

- captura das respostas;
- tratamento dos dados;
- agrupamento;
- cálculos;
- geração do gráfico;
- comunicação com APIs externas;
- comunicação com Google Drive;
- envio de e-mails.

### Google Sheets

Utilizado para armazenamento das respostas provenientes do Google Forms e, durante o desenvolvimento, como suporte para geração e visualização dos gráficos.

### Google Drive

Utilizado temporariamente durante o desenvolvimento para armazenar os gráficos gerados e permitir sua inspeção.

### Gemini API

Responsável pela geração da interpretação textual dos resultados.

A integração é realizada através de requisição HTTP utilizando:

```javascript
UrlFetchApp.fetch()
```

### OpenAI API

Implementada como alternativa de provedor de IA.

Permite que a arquitetura não fique diretamente dependente de um único fornecedor.

No ambiente atual, seu uso depende da contratação de créditos da API, independentemente da assinatura do ChatGPT.

---

## 5. Requisitos funcionais

O sistema deve:

- executar automaticamente após uma resposta;
- capturar nome do paciente;
- capturar e-mail coletado pelo Google Forms;
- capturar data/hora da resposta;
- processar respostas de 0 a 10;
- relacionar perguntas aos grupos correspondentes;
- calcular a média de cada grupo;
- classificar o impacto;
- ordenar os resultados;
- determinar trava principal;
- determinar trava secundária;
- identificar travas associadas;
- gerar gráfico;
- gerar interpretação através de IA;
- montar e-mail;
- incorporar o gráfico;
- enviar o resultado ao endereço capturado.

---

## 6. Requisitos não funcionais

O sistema deve buscar:

**Automação:** nenhuma intervenção manual deve ser necessária no fluxo normal.

**Modularidade:** cálculo, IA, gráfico e e-mail devem permanecer separados.

**Manutenibilidade:** perguntas, agrupamentos e prompts devem poder ser modificados sem reescrever todo o sistema.

**Resiliência:** A indisponibilidade temporária de uma API não deve idealmente provocar perda da resposta original.

**Segurança:** chaves das APIs devem permanecer em `Script Properties`, não diretamente no código.

**Privacidade:** somente os dados necessários devem ser enviados aos provedores externos.

---

## 7. Regras de negócio

As principais regras atualmente definidas são:

| Regra | Resultado |
| --- | --- |
| Resposta individual | 0 → 10 |
| Média `< 4` | Baixo impacto |
| Média `>= 4` e `< 7` | Impacto moderado |
| Média `>= 7` | Alto impacto |

Depois da ordenação:

| Posição | Classificação |
| --- | --- |
| Maior média | Principal |
| Segunda maior média | Secundária |
| Demais | Associadas |

A IA **não determina essas classificações**. Ela recebe o resultado pronto.

## 8. Acionamento da automação

O fluxo começa através de um acionador do Google Apps Script associado ao Google Forms.

Função principal:

```javascript
function onFormSubmit(e) {
  // processamento
}
```

O acionador executa essa função sempre que uma nova resposta é enviada.

O objeto:

```javascript
e.response
```

contém a resposta submetida pelo usuário.

---

## 9. Agrupamento das perguntas

As perguntas foram divididas em **10 grupos comportamentais**:

1. Medo de errar  
2. Autossabotagem  
3. Síndrome do impostor  
4. Necessidade de aprovação  
5. Mentalidade de escassez  
6. Comparação constante  
7. Crenças limitantes  
8. Procrastinação emocional  
9. Apego ao passado  
10. Perfeccionismo excessivo

A configuração é armazenada em uma estrutura semelhante a:

```javascript
const GRUPOS = {
  "Medo de errar": [
    "Pergunta 1",
    "Pergunta 2",
    "Pergunta 3"
  ],
  "Autossabotagem": [
    "Pergunta 4",
    "Pergunta 5",
    "Pergunta 6"
  ]
};
```

Isso permite separar a configuração do algoritmo responsável pelos cálculos.

---

## 10. Regra de pontuação

Cada pergunta possui resposta numérica entre:

0 — 10

As notas das perguntas pertencentes ao mesmo grupo são utilizadas para calcular sua média.

Exemplo:

```text
Medo de errar

Pergunta 1 = 8
Pergunta 2 = 6
Pergunta 3 = 7
Pergunta 4 = 9

Média = 7,5
```

O uso da média permite comparar grupos mesmo quando eles possuem quantidades diferentes de perguntas.

---

## 11. Classificação de impacto

A média calculada é transformada em uma classificação.

A implementação atual utiliza:

```javascript
function classificarImpacto(media) {
  if (media < 4) {
    return "Baixo impacto";
  }

  if (media < 7) {
    return "Impacto moderado";
  }

  return "Alto impacto";
}
```

Portanto:

| Média | Classificação |
| --- | --- |
| `0 a < 4` | Baixo impacto |
| `4 a < 7` | Impacto moderado |
| 7 a 10 | Alto impacto |

---

## 12. Identificação das principais travas

Após calcular todas as médias, os resultados são ordenados:

```javascript
resultados.sort(
  (a, b) => b.media - a.media
);
```

A maior média recebe:

Principal

A segunda maior:

Secundária

As demais:

Associada

Exemplo de resultado:

```json
[
  {
    "trava": "Crenças limitantes",
    "media": 6,
    "impacto": "Impacto moderado",
    "classificacao": "Principal"
 },
  {
    "trava": "Perfeccionismo excessivo",
    "media": 6,
    "impacto": "Impacto moderado",
    "classificacao": "Secundária"
 },
  {
    "trava": "Medo de errar",
    "media": 5.5,
    "impacto": "Impacto moderado",
    "classificacao": "Associada"
  }
]
```

---

## 13. Geração do gráfico

Foi implementada a geração automática de um **gráfico radar** utilizando os recursos de gráficos do Google Sheets.

O gráfico utiliza:

```javascript
Charts.ChartType.RADAR
```

e apresenta as médias das diferentes travas emocionais.

Durante o desenvolvimento, uma aba denominada:

`Resultado Temporário`

é utilizada para inserir os dados necessários para construção do gráfico.

O gráfico é criado através de:

```javascript
const grafico = sheet.newChart()
  .setChartType(Charts.ChartType.RADAR)
  .addRange(...)
  .build();

sheet.insertChart(grafico);
```

O título também pode utilizar o nome do paciente.

---

## 14. Armazenamento temporário do gráfico

Durante a fase de testes, o gráfico é convertido em imagem e armazenado no Google Drive.

Exemplo:

```javascript
DriveApp.createFile(grafico);
```

Isso permite verificar visualmente se o gráfico está sendo gerado corretamente antes da implementação definitiva do envio.

Na versão final, esse armazenamento poderá ser removido caso não exista necessidade de manter os gráficos individualmente no Drive.

---

## 15. Integração com Inteligência Artificial

Depois dos cálculos, o sistema envia os **resultados processados**, e não as respostas brutas, para uma IA.

Exemplo:

```json
[
  {
    "trava": "Crenças limitantes",
    "media": 6,
    "impacto": "Impacto moderado",
    "classificacao": "Principal"
  }
]
```

Essa decisão separa duas responsabilidades importantes:

- Apps Script → calcula
- IA → interpreta

A IA não é responsável por determinar médias, impacto ou classificação.

---

## 16. Prompt

O prompt enviado à IA estabelece regras para que o modelo interprete somente os resultados fornecidos.

Entre as regras previstas estão:

- não recalcular as médias;
- não modificar as classificações;
- não inventar dados;
- priorizar a trava principal;
- destacar a trava secundária;
- contextualizar os padrões associados;
- considerar o nível de impacto;
- utilizar linguagem profissional;
- evitar afirmações deterministas;
- não produzir diagnóstico clínico autônomo.

---

## 17. Organização do código

Para evitar um único arquivo muito grande, o projeto foi dividido em diferentes arquivos `.gs`.

Estrutura feita:

```text
Projeto Apps Script  
│  
├── Código.gs  
│   └── onFormSubmit()  
│   └── myFunction()  
│  
├── Config.gs  
│   ├── GRUPOS  
│  
├── Resultado.gs  
│   └── calcularResultados()  
│   
├── Calculo.gs  
│   └── classificarImpacto()  
│  
├── Graficos.gs  
│   ├── gerarGrafico()  
│   └── salvarGraficoNoDrive()  
│  
├── IA.gs  
│   ├── gerarInterpretacao()  
│  
└── Email.gs  
   └── enviarResultadoPorEmail()
```

Todos os arquivos `.gs` pertencentes ao mesmo projeto Apps Script compartilham as funções, portanto não é necessário utilizar `import` ou `export`.

---

## 18. Fluxo técnico atual

O sistema pode ser representado da seguinte maneira:

```text
┌─────────── Formulário ─────────┐  
└──────────┬─────────────────────┘  
           │  
           ▼  
┌─────────────────────┐  
│   onFormSubmit(e)   │  
│     Apps Script     │  
└──────────┬──────────┘  
           │  
           ▼  
┌─────────────────────┐  
│ Captura dos dados   │  
│                     │  
│ Nome                │  
│ E-mail              │  
│ Data                │  
│ Respostas           │  
└──────────┬──────────┘  
           │  
           ▼  
┌─────────────────────┐  
│ Agrupamento         │  
│ das perguntas       │  
└──────────┬──────────┘  
           │  
           ▼  
┌─────────────────────┐  
│ Cálculo das médias  │  
└──────────┬──────────┘  
           │  
           ▼  
┌─────────────────────┐  
│ Classificação       │  
│                     │  
│ Principal           │  
│ Secundária          │  
│ Associadas          │  
└──────────┬──────────┘  
           │  
     ┌─────┴────┐  
     ▼          ▼  
┌──────────┐ ┌──────────────┐  
│ Gráfico  │ │ API de IA    │  
│ Radar    │ │ Gemini/OpenAI│  
└───┬──────┘ └───────┬──────┘  
    │                │  
    │                ▼  
    │        ┌──────────────┐  
    │        │Interpretação │  
    │        └──────┬───────┘  
    │               │  
    └───────┬───────┘  
            ▼  
    ┌───────────────┐  
    │ Montagem do   │  
    │    e-mail     │  
    └───────┬───────┘  
            ▼  
    ┌───────────────┐  
    │ Envio para o  │  
    │   paciente    │  
    └───────────────┘
```
