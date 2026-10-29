# Projeto: Buscador de Repositórios do GitHub

## 1. Visão geral

### Objetivo
Aplicação web que permite buscar repositórios públicos do GitHub por palavra-chave e exibir os resultados mais relevantes em cards.

### Fluxo do usuário
1. O usuário digita um termo no campo de busca.
2. Ele pressiona ENTER ou clica no botão "Buscar".
3. A aplicação valida o termo digitado.
4. A aplicação exibe o estado de carregamento (loading).
5. A aplicação faz a requisição à API do GitHub.
6. A aplicação exibe os resultados, ou o estado vazio, ou uma mensagem de erro amigável.

### Escopo
- **Dentro do escopo:** busca por palavra-chave, exibição de 10 resultados ordenados por estrelas, estados de loading, vazio e erro.
- **Fora do escopo:** paginação, filtros, autenticação com token, histórico de buscas, tema escuro.

---

## 2. Informações exibidas em cada card de repositório

| Informação | Detalhe | Fallback se ausente |
|---|---|---|
| Foto do autor | `owner.avatar_url`, com `alt` descritivo | Ocultar a imagem |
| Nome do autor | `owner.login` | - (sempre existe) |
| Nome do repositório | `name` | - (sempre existe) |
| Descrição | `description` | "Sem descrição disponível" |
| Linguagem principal | `language` | "Não informada" |
| Número de estrelas | `stargazers_count`, formatado (ex.: 1.234) | 0 |
| Link do repositório | `html_url`, abre em nova aba | - (sempre existe) |

Complementar: exibir acima da lista o total de resultados encontrados (`total_count`), por exemplo "Mostrando 10 de 1.234 repositórios para 'react'".

---

## 3. Especificações técnicas

### 3.1 Stack e restrições
- Usar apenas HTML, CSS e JavaScript puros, sem bibliotecas ou frameworks externos.
- Sem build tools; o projeto deve abrir diretamente no navegador.

### 3.2 Requisição e tratamento de erros
- Usar `fetch()` dentro de uma função `async/await`.
- Envolver a chamada em `try / catch / finally`:
  - `try`: faz a requisição e processa a resposta.
  - `catch`: converte o erro em mensagem amigável e exibe na tela.
  - `finally`: sempre remove o loading e reabilita o botão.
- Validar `response.ok` e `response.status` antes de converter o JSON.
- Lançar erros com mensagens específicas por status:

| Situação | Mensagem sugerida ao usuário |
|---|---|
| Falha de rede (`TypeError` do fetch) | "Sem conexão. Verifique sua internet e tente novamente." |
| 403 ou 429 (limite de requisições) | "Muitas buscas em pouco tempo. Aguarde um minuto e tente novamente." |
| 422 (termo inválido) | "Não foi possível buscar esse termo. Tente outro." |
| 5xx (erro do servidor) | "O GitHub está instável no momento. Tente novamente mais tarde." |
| Outros | "Algo deu errado. Tente novamente." |

- Enviar o header `Accept: application/vnd.github+json`.
- Usar `AbortController` para cancelar a requisição anterior se o usuário fizer uma nova busca antes da resposta chegar.
- Evitar buscas duplicadas: desabilitar o botão e o campo enquanto a requisição estiver em andamento.

### 3.3 Validação e segurança
- Aplicar `trim()` no termo digitado.
- Se o termo estiver vazio, não fazer requisição; exibir a mensagem "Digite um termo para buscar" e devolver o foco ao campo.
- Codificar o termo com `encodeURIComponent()` antes de montar a URL.
- **Nunca** inserir dados da API com `innerHTML`; usar `createElement` e `textContent` para evitar XSS.
- Links externos devem usar `target="_blank"` e `rel="noopener noreferrer"`.

### 3.4 Organização do JavaScript
- Todos os eventos são definidos no JS (nenhum `onclick` ou similar no HTML).
- Usar funções nomeadas como handlers, evitando funções anônimas nos eventos.
- Selecionar todos os elementos do DOM com `document.querySelector()`, guardando as referências em constantes no topo do arquivo.
- Usar um `<form>` com o evento `submit`, que cobre ENTER e clique no botão com um único handler.
- Cada função executa **uma única ação**, delegando ações complexas a outras funções.

Sugestão de funções:

| Função | Responsabilidade única |
|---|---|
| `handleSubmit(event)` | Receber o evento de envio e orquestrar o fluxo |
| `getSearchTerm()` | Ler e limpar o valor do campo |
| `isValidTerm(term)` | Verificar se o termo é válido |
| `buildApiUrl(term)` | Montar a URL com o termo codificado |
| `fetchRepositories(url, signal)` | Fazer a requisição e validar a resposta |
| `getErrorMessage(error)` | Traduzir o erro em mensagem amigável |
| `showLoading()` / `hideLoading()` | Controlar o estado de carregamento |
| `showEmptyState(term)` | Exibir o estado vazio |
| `showError(message)` | Exibir a mensagem de erro |
| `renderResults(repositories)` | Percorrer a lista e anexar os cards |
| `createRepositoryCard(repository)` | Criar o elemento de um card |
| `formatStars(number)` | Formatar o número de estrelas |
| `clearResults()` | Limpar a área de resultados |

### 3.5 Estrutura de pastas
```
buscador-github/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── main.js
├── assets/
│   └── favicon.svg
└── README.md
```

---

## 4. HTML, SEO e acessibilidade

### 4.1 HTML semântico
- Usar `<header>`, `<main>`, `<section>`, `<article>` (um por card), `<form>`, `<footer>`.
- Um único `<h1>` por página e hierarquia correta de títulos (`<h2>` ou `<h3>` nos cards).
- Campo de busca com `<label>` associado (pode ser visualmente oculto com uma classe `.sr-only`).
- Botão com `<button type="submit">`.
- Lista de resultados com `<ul>` e `<li>`.

### 4.2 Meta tags
- `<html lang="pt-BR">`
- `<meta charset="UTF-8">`
- `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- `<title>` único e descritivo
- `<meta name="description">` com até 160 caracteres
- `<meta name="robots" content="index, follow">`
- `<meta name="theme-color">`
- `<link rel="canonical">` (quando houver URL de publicação)
- Open Graph: `og:title`, `og:description`, `og:type`, `og:url`, `og:image`
- Twitter Card: `twitter:card`, `twitter:title`, `twitter:description`
- Favicon (`<link rel="icon">`)

### 4.3 Acessibilidade (WCAG AA)
- Região de resultados com `aria-live="polite"` para anunciar mudanças a leitores de tela.
- Loading com `role="status"` e texto alternativo ("Carregando resultados...").
- Mensagem de erro com `role="alert"`.
- Foco visível em todos os elementos interativos (`:focus-visible`).
- Imagens com `alt` descritivo (ex.: "Foto de perfil de {login}").
- Contraste mínimo de 4,5:1 entre texto e fundo.
- Navegação completa por teclado (Tab, Enter).
- Respeitar `prefers-reduced-motion` na animação do loading.
- Alvos de toque com no mínimo 44x44px no mobile.

---

## 5. Especificações da interface

### 5.1 Princípios visuais
- **Mobile-first:** CSS base escrito para telas pequenas; `@media (min-width: ...)` para telas maiores.
- **Tema claro:** fundo da página em tom claro-acinzentado, **um pouco mais escuro que os cards**, e cards brancos. Texto escuro sobre fundo claro, sempre com contraste adequado.
- Página centralizada, com `max-width: 960px`, `margin: 0 auto` e padding lateral.
- Bordas arredondadas nos cards (busca e resultados).

### 5.2 Breakpoints sugeridos
| Faixa | Comportamento |
|---|---|
| Base (< 600px) | 1 coluna; campo e botão empilhados |
| ≥ 600px | Campo e botão na mesma linha |
| ≥ 900px | Resultados em grade de 2 colunas (opcional) |

### 5.3 Componentes

**Card de busca**
- Contém título (`<h1>`), campo de texto com placeholder (ex.: "Ex.: react, javascript, api") e botão "Buscar".
- Estados do botão: padrão, hover, focus, active e disabled.
- Estado do campo: padrão, focus e inválido.

**Card de resultado**
- Cabeçalho: avatar redondo + login do autor.
- Corpo: nome do repositório (em destaque, como link), descrição (limitada a 2-3 linhas com `line-clamp`) e metadados.
- Rodapé de metadados: linguagem (com indicador visual) e estrelas (com ícone).
- Link/botão "Ver no GitHub".
- Estado hover leve (sombra ou elevação).
- Todo o conteúdo deve quebrar corretamente com textos longos (`overflow-wrap: anywhere`).

### 5.4 Estados da tela

| Estado | Quando aparece | Conteúdo |
|---|---|---|
| Inicial | Antes da primeira busca | Mensagem orientando o usuário a buscar |
| Loading | Durante a requisição | Spinner ou skeleton cards + texto "Carregando..." |
| Sucesso | Resultados encontrados | Contador de resultados + lista de cards |
| Vazio | `items` vazio | Ícone, mensagem "Nenhum repositório encontrado para '{termo}'" e sugestão de tentar outro termo |
| Erro | Falha na requisição | Mensagem amigável + botão "Tentar novamente" |
| Validação | Campo vazio | Mensagem de campo obrigatório junto ao input |

### 5.5 CSS
- Variáveis em `:root` para:
  - cores (fundo da página, fundo dos cards, texto principal, texto secundário, cor de destaque, cor de erro, bordas);
  - tamanhos de texto (`--font-size-sm`, `--font-size-md`, `--font-size-lg`, `--font-size-xl`);
  - espaçamentos (`--space-xs` até `--space-xl`);
  - raio de borda (`--radius-md`, `--radius-lg`);
  - sombras (`--shadow-card`).
- Reset básico (`box-sizing: border-box`, margens zeradas).
- Usar Flexbox e/ou Grid para o layout.
- Nomear classes de forma consistente (sugestão: BEM, como `.repo-card__title`).
- Transições curtas (150-250ms) em hover e focus.

---

## 6. API

**Endpoint:**
`https://api.github.com/search/repositories?q={PALAVRA-CHAVE}&sort=stars&per_page=10`

- Substituir `{PALAVRA-CHAVE}` pelo termo digitado (já tratado com `trim` e `encodeURIComponent`).
- Campos usados da resposta: `total_count` e, em cada item de `items`: `name`, `description`, `language`, `stargazers_count`, `html_url`, `owner.login`, `owner.avatar_url`.
- Limite da API sem autenticação: aproximadamente 10 requisições por minuto na busca. Por isso o tratamento de 403/429 é obrigatório.

---

## 7. Critérios de aceite

- [ ] ENTER e clique no botão disparam a busca
- [ ] Campo vazio não dispara requisição e mostra aviso
- [ ] Loading aparece durante a requisição e some ao final (sucesso ou erro)
- [ ] Os 10 resultados exibem todos os campos, com fallbacks quando necessário
- [ ] Estado vazio aparece quando não há resultados
- [ ] Erros de rede, limite de requisições e servidor exibem mensagens amigáveis
- [ ] Nenhum evento no HTML; nenhuma função anônima em eventos
- [ ] Nenhum uso de `innerHTML` com dados da API
- [ ] Layout funciona de 320px a 1440px sem rolagem horizontal
- [ ] Navegação completa por teclado, com foco visível
- [ ] Lighthouse com nota ≥ 90 em Performance, Acessibilidade, Boas Práticas e SEO

---

## 8. Entrega
- Código versionado no Git, com commits pequenos e descritivos.
- README com descrição, print da tela, como rodar e tecnologias.
- Publicação opcional no GitHub Pages.
- O codigo inteiro deve esta em portugues (INcluindo nome de variaveis, funções entre outros elementos do codigo)