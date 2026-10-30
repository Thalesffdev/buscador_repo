const formularioBusca = document.querySelector("#formulario-busca");
const campoBusca = document.querySelector("#campo-busca");
const botaoBuscar = document.querySelector("#botao-buscar");
const mensagemValidacao = document.querySelector("#mensagem-validacao");
const estadoCarregamento = document.querySelector("#estado-carregamento");
const estadoInicial = document.querySelector("#estado-inicial");
const estadoVazio = document.querySelector("#estado-vazio");
const mensagemVazia = document.querySelector("#mensagem-vazia");
const estadoErro = document.querySelector("#estado-erro");
const mensagemErro = document.querySelector("#mensagem-erro");
const botaoTentarNovamente = document.querySelector("#botao-tentar-novamente");
const contadorResultados = document.querySelector("#contador-resultados");
const listaRepositorios = document.querySelector("#lista-repositorios");

const enderecoApi = "https://api.github.com/search/repositories";
let controladorBusca = null;
let ultimoTermoBuscado = "";

class ErroApi extends Error {
  constructor(status) {
    super(`A API do GitHub respondeu com o status ${status}.`);
    this.name = "ErroApi";
    this.status = status;
  }
}

class ErroDeRede extends Error {
  constructor() {
    super("Não foi possível conectar à API do GitHub.");
    this.name = "ErroDeRede";
  }
}

function tratarEnvio(evento) {
  evento.preventDefault();
  const termo = obterTermoBusca();

  if (!validarTermo(termo)) {
    mostrarMensagemValidacao();
    campoBusca.focus();
    return;
  }

  limparMensagemValidacao();
  ultimoTermoBuscado = termo;
  buscarRepositorios(termo);
}

function tratarNovaTentativa() {
  if (ultimoTermoBuscado) {
    buscarRepositorios(ultimoTermoBuscado);
  }
}

function tratarEntrada() {
  if (campoBusca.value.trim()) {
    limparMensagemValidacao();
  }
}

function obterTermoBusca() {
  return campoBusca.value.trim();
}

function validarTermo(termo) {
  return termo.length > 0;
}

function mostrarMensagemValidacao() {
  mensagemValidacao.textContent = "Digite um termo para buscar.";
  mensagemValidacao.hidden = false;
  campoBusca.setAttribute("aria-invalid", "true");
}

function limparMensagemValidacao() {
  mensagemValidacao.textContent = "";
  mensagemValidacao.hidden = true;
  campoBusca.removeAttribute("aria-invalid");
}

function montarUrlApi(termo) {
  const termoCodificado = encodeURIComponent(termo);
  return `${enderecoApi}?q=${termoCodificado}&sort=stars&per_page=10`;
}

async function buscarNaApi(endereco, sinal) {
  let resposta;

  try {
    resposta = await fetch(endereco, {
      headers: {
        Accept: "application/vnd.github+json"
      },
      signal: sinal
    });
  } catch (erro) {
    if (erro instanceof TypeError) {
      throw new ErroDeRede();
    }

    throw erro;
  }

  if (!resposta.ok) {
    throw new ErroApi(resposta.status);
  }

  return resposta.json();
}

function obterMensagemErro(erro) {
  if (erro instanceof ErroDeRede) {
    return "Sem conexão. Verifique sua internet e tente novamente.";
  }

  if (erro instanceof ErroApi) {
    if (erro.status === 403 || erro.status === 429) {
      return "Muitas buscas em pouco tempo. Aguarde um minuto e tente novamente.";
    }

    if (erro.status === 422) {
      return "Não foi possível buscar esse termo. Tente outro.";
    }

    if (erro.status >= 500) {
      return "O GitHub está instável no momento. Tente novamente mais tarde.";
    }
  }

  return "Algo deu errado. Tente novamente.";
}

async function buscarRepositorios(termo) {
  if (controladorBusca) {
    controladorBusca.abort();
  }

  const controladorAtual = new AbortController();
  controladorBusca = controladorAtual;
  mostrarCarregamento();
  limparResultados();
  ocultarEstadosTela();
  botaoTentarNovamente.hidden = true;
  campoBusca.disabled = true;
  botaoBuscar.disabled = true;

  try {
    const resposta = await buscarNaApi(
      montarUrlApi(termo),
      controladorAtual.signal
    );

    if (!Array.isArray(resposta.items)) {
      throw new Error("A resposta do GitHub não contém uma lista de repositórios.");
    }

    if (resposta.items.length === 0) {
      mostrarEstadoVazio(termo);
      return;
    }

    renderizarResultados(resposta.items, resposta.total_count, termo);
  } catch (erro) {
    if (erro.name !== "AbortError") {
      mostrarErro(obterMensagemErro(erro));
    }
  } finally {
    if (controladorBusca === controladorAtual) {
      controladorBusca = null;
      ocultarCarregamento();
      campoBusca.disabled = false;
      botaoBuscar.disabled = false;
    }
  }
}

function mostrarCarregamento() {
  estadoCarregamento.hidden = false;
}

function ocultarCarregamento() {
  estadoCarregamento.hidden = true;
}

function ocultarEstadosTela() {
  estadoInicial.hidden = true;
  estadoVazio.hidden = true;
  estadoErro.hidden = true;
  contadorResultados.hidden = true;
  listaRepositorios.hidden = true;
}

function mostrarEstadoVazio(termo) {
  mensagemVazia.textContent = `Nenhum repositório encontrado para "${termo}".`;
  estadoVazio.hidden = false;
}

function mostrarErro(mensagem) {
  mensagemErro.textContent = mensagem;
  estadoErro.hidden = false;
  botaoTentarNovamente.hidden = false;
}

function renderizarResultados(repositorios, total, termo) {
  const fragmento = document.createDocumentFragment();

  for (const repositorio of repositorios) {
    fragmento.append(criarCartaoRepositorio(repositorio));
  }

  listaRepositorios.replaceChildren(fragmento);
  contadorResultados.textContent =
    `Mostrando ${formatarEstrelas(repositorios.length)} de ` +
    `${formatarEstrelas(total)} repositórios para "${termo}".`;
  contadorResultados.hidden = false;
  listaRepositorios.hidden = false;
}

function criarCartaoRepositorio(repositorio) {
  const item = document.createElement("li");
  const cartao = document.createElement("article");
  const cabecalho = document.createElement("div");
  const nomeAutor = document.createElement("span");
  const titulo = document.createElement("h3");
  const linkTitulo = document.createElement("a");
  const descricao = document.createElement("p");
  const metadados = document.createElement("div");
  const linguagem = document.createElement("span");
  const indicadorLinguagem = document.createElement("span");
  const estrelas = document.createElement("span");
  const iconeEstrelas = document.createElement("span");
  const linkRepositorio = document.createElement("a");
  const urlRepositorio = obterUrlHttps(repositorio.html_url);

  if (!urlRepositorio) {
    throw new Error("O GitHub retornou um link de repositório inválido.");
  }

  item.className = "lista-repositorios__item";
  cartao.className = "repositorio";
  cabecalho.className = "repositorio__autor";
  nomeAutor.textContent = repositorio.owner.login;
  titulo.className = "repositorio__titulo";
  linkTitulo.className = "repositorio__titulo-link";
  linkTitulo.href = urlRepositorio;
  linkTitulo.target = "_blank";
  linkTitulo.rel = "noopener noreferrer";
  linkTitulo.textContent = repositorio.name;
  descricao.className = "repositorio__descricao";
  descricao.textContent = repositorio.description || "Sem descrição disponível";
  metadados.className = "repositorio__metadados";
  linguagem.className = "repositorio__metadado";
  indicadorLinguagem.className = "repositorio__indicador-linguagem";
  indicadorLinguagem.setAttribute("aria-hidden", "true");
  linguagem.append(indicadorLinguagem);
  linguagem.append(
    document.createTextNode(repositorio.language || "Não informada")
  );
  estrelas.className = "repositorio__metadado";
  iconeEstrelas.className = "repositorio__estrelas-icone";
  iconeEstrelas.setAttribute("aria-hidden", "true");
  iconeEstrelas.textContent = "★";
  estrelas.append(iconeEstrelas);
  estrelas.append(
    document.createTextNode(formatarEstrelas(repositorio.stargazers_count || 0))
  );
  linkRepositorio.className = "repositorio__link";
  linkRepositorio.href = urlRepositorio;
  linkRepositorio.target = "_blank";
  linkRepositorio.rel = "noopener noreferrer";
  linkRepositorio.textContent = "Ver no GitHub";

  adicionarAvatar(cabecalho, repositorio.owner);
  cabecalho.append(nomeAutor);
  titulo.append(linkTitulo);
  metadados.append(linguagem, estrelas);
  cartao.append(cabecalho, titulo, descricao, metadados, linkRepositorio);
  item.append(cartao);

  return item;
}

function adicionarAvatar(cabecalho, proprietario) {
  if (!proprietario.avatar_url) {
    return;
  }

  const urlAvatar = obterUrlHttps(proprietario.avatar_url);

  if (!urlAvatar) {
    return;
  }

  const avatar = document.createElement("img");
  avatar.className = "repositorio__avatar";
  avatar.src = urlAvatar;
  avatar.alt = `Foto de perfil de ${proprietario.login}`;
  avatar.loading = "lazy";
  avatar.decoding = "async";
  avatar.addEventListener("error", tratarFalhaAvatar);
  cabecalho.append(avatar);
}

function tratarFalhaAvatar(evento) {
  evento.currentTarget.remove();
}

function obterUrlHttps(endereco) {
  try {
    const url = new URL(endereco);
    return url.protocol === "https:" ? url.href : null;
  } catch (erro) {
    if (erro instanceof TypeError) {
      return null;
    }

    throw erro;
  }
}

function formatarEstrelas(numero) {
  return new Intl.NumberFormat("pt-BR").format(numero);
}

function limparResultados() {
  listaRepositorios.replaceChildren();
  contadorResultados.textContent = "";
}

formularioBusca.addEventListener("submit", tratarEnvio);
campoBusca.addEventListener("input", tratarEntrada);
botaoTentarNovamente.addEventListener("click", tratarNovaTentativa);
