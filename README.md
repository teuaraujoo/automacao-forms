# Automação de Autoavaliação Comportamental

Este projeto automatiza o processamento de um Questionário de Autoavaliação
Comportamental utilizado por uma terapeuta antes das consultas com seus
pacientes. A solução principal funciona no ecossistema Google: coleta as
respostas pelo Google Forms, processa os dados no Google Apps Script, gera um
gráfico, solicita uma interpretação a uma API de IA e envia o resultado ao
paciente por e-mail.

```text
Google Forms -> Google Apps Script -> Google Sheets/Drive -> API de IA -> E-mail
```

Este repositório contém a automação auxiliar feita com Node.js e
[Playwright](https://playwright.dev/). Ela serve exclusivamente para preencher e
enviar respostas de teste ao formulário, permitindo validar o fluxo principal
desenvolvido no Google Apps Script e nos demais serviços Google.

A arquitetura, as regras de negócio e o fluxo do sistema principal estão
descritos na [documentação técnica](docs/Documentação%20Técnica%20—%20Automação%20de%20Autoavaliação%20Comportamental.md).

## Por que o projeto existe

Antes da automação, a terapeuta precisava analisar cada resposta manualmente,
separar as perguntas por categorias comportamentais, identificar os principais
padrões, produzir uma interpretação e enviar o resultado ao paciente. O sistema
principal automatiza esse processamento. A ferramenta Playwright reduz o esforço
de testar esse fluxo, gerando preenchimentos variados de maneira repetível.

## Automação auxiliar com Playwright

A automação preenche os dados pessoais, identifica as perguntas com opções de 1
a 10 e sorteia uma nota para cada uma. Notas consecutivas não são repetidas, o
que gera respostas variadas em vez de selecionar sempre a nota 10.

O envio continua sob controle do usuário: depois do preenchimento automático, o
navegador permanece aberto para conferência. Quando o usuário clica em **Enviar**,
a automação detecta a navegação para a página `formResponse`, fecha o navegador e
encerra o processo.

## Requisitos

Antes de começar, instale:

- [Node.js](https://nodejs.org/) 22 ou mais recente;
- Google Chrome;
- npm, normalmente instalado junto com o Node.js.

## Instalação

Clone o repositório, entre na pasta do projeto e instale as dependências:

```powershell
git clone <URL_DO_REPOSITORIO>
cd teste-formulario
npm install
```

As principais dependências são:

- `@playwright/test`: controla o navegador e interage com o formulário;
- `dotenv`: carrega configurações do arquivo `.env`.

## Configuração

Crie um arquivo `.env` na raiz do projeto. Você pode copiar o modelo existente:

```powershell
Copy-Item .env.example .env
```

Depois, informe a URL pública do formulário:

```dotenv
FORM_URL="https://docs.google.com/forms/d/e/ID_DO_FORMULARIO/viewform"
```

Não compartilhe nem envie o `.env` para o Git. Esse arquivo está incluído no
`.gitignore`, mas arquivos adicionados ao repositório anteriormente continuam
rastreados e precisam ser removidos do índice do Git separadamente.

### Dados preenchidos

Atualmente, e-mail, nome e data da sessão estão definidos diretamente em
`responder.spec.ts`. Altere os valores destas chamadas conforme necessário:

```ts
.fill('email@exemplo.com');
await textboxes.nth(1).fill('Nome da pessoa');
await textboxes.nth(2).fill('17/08/2026');
```

A automação considera a seguinte ordem para os campos de texto:

1. e-mail;
2. nome;
3. data da sessão.

Se a estrutura ou a ordem dos campos do formulário mudar, os seletores em
`responder.spec.ts` também precisarão ser ajustados.

## Como executar

Na raiz do projeto, execute:

```powershell
npm start
```

O processo seguirá estas etapas:

1. carrega a URL configurada no `.env`;
2. abre o Google Chrome em modo visível;
3. preenche e-mail, nome e data;
4. localiza todas as perguntas do tipo escala/opção;
5. seleciona notas aleatórias entre 1 e 10, sem repetir a nota anterior;
6. aguarda a conferência e o envio manual;
7. detecta o envio, fecha o Chrome e termina o processo.

Para interromper a automação antes do envio, feche o navegador ou pressione
`Ctrl+C` no terminal.

## Estrutura principal

```text
teste-formulario/
├── .env.example          # Modelo das variáveis de ambiente
├── docs/                 # Documentação técnica do sistema principal
├── package.json          # Dependências e comando de execução
├── playwright.config.ts  # Configuração padrão do Playwright
└── responder.spec.ts     # Automação de preenchimento
```

## Observações importantes

- O botão **Enviar** não é clicado automaticamente. Isso permite revisar os
  dados antes de criar uma resposta real.
- O script espera que as notas disponíveis tenham nomes acessíveis de `1` a
  `10` no Google Forms. Já que esse projeto foi feito para um formulário nesse padrão. 
  Caso seu formulário não siga esse padrão, será ncessário fazer modificações no script.
- A confirmação é identificada pela navegação para uma URL terminada em
  `/formResponse`.
- O processamento das respostas, os cálculos, a integração com IA, o gráfico e
  o envio de e-mail pertencem ao projeto Google Apps Script e não são executados
  pelo Playwright.
- Use a automação somente em formulários próprios ou quando você tiver
  autorização para realizar testes.
