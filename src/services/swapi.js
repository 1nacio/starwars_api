const BASE = "https://swapi.dev/api";
const IMAGENS = "https://starwarsgallery.netlify.app/assets";

/* ========== BUSCA COM CACHE ========== */

const cache = new Map();

async function buscarTudo(recurso) {
  let url = `${BASE}/${recurso}/`;
  const todos = [];

  while (url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Erro ao buscar ${recurso}`);
    const dados = await r.json();
    todos.push(...dados.results);
    url = dados.next;
  }

  return todos;
}

// guarda a promessa: chamadas simultâneas compartilham a mesma requisição
export function listarTudo(recurso) {
  if (!cache.has(recurso)) {
    cache.set(
      recurso,
      buscarTudo(recurso).catch((e) => {
        cache.delete(recurso); // não guarda falhas
        throw e;
      }),
    );
  }
  return cache.get(recurso);
}

/* ========== UTILIDADES ========== */

function idDaUrl(url) {
  return url.split("/").filter(Boolean).pop();
}

function urlImagem(categoria, id) {
  return `${IMAGENS}/${categoria}/${id}.jpg`;
}

function paraLista(texto) {
  return texto.split(",").map((t) => t.trim());
}

function paraNumero(texto) {
  if (!texto || texto === "unknown" || texto === "n/a") return null;
  const n = Number(texto.replace(",", "")); // "1,358" vira 1358
  return Number.isNaN(n) ? null : n;
}

// "19BBY" vira -19, "4ABY" vira 4. Assim dá para comparar anos.
function anoParaNumero(texto) {
  const m = /^([\d.]+)(BBY|ABY)$/.exec(texto);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return m[2] === "BBY" ? -n : n;
}

function limparValor(valor) {
  if (!valor || valor === "unknown" || valor === "n/a") return "Desconhecido";
  return valor;
}

/* ========== JOGO ========== */

export async function carregarPersonagens() {
  const [pessoas, planetas, filmes, especies] = await Promise.all([
    listarTudo("people"),
    listarTudo("planets"),
    listarTudo("films"),
    listarTudo("species"),
  ]);

  const nomePlaneta = Object.fromEntries(planetas.map((p) => [p.url, p.name]));
  const tituloFilme = Object.fromEntries(filmes.map((f) => [f.url, f.title]));
  const nomeEspecie = Object.fromEntries(especies.map((s) => [s.url, s.name]));

  return pessoas.map((p) => {
    const id = idDaUrl(p.url);
    return {
      id,
      imagem: urlImagem("people", id),
      nome: p.name,
      genero: [p.gender],
      planeta: [nomePlaneta[p.homeworld] ?? "unknown"],
      nascimento: anoParaNumero(p.birth_year),
      altura: paraNumero(p.height),
      peso: paraNumero(p.mass),
      cabelo: paraLista(p.hair_color),
      pele: paraLista(p.skin_color),
      olhos: paraLista(p.eye_color),
      especie: p.species.length
        ? p.species.map((url) => nomeEspecie[url])
        : ["Human"],
      filmes: p.films.map((url) => tituloFilme[url]),
    };
  });
}

/* ========== GALERIA ========== */

// a ordem aqui é a ordem das abas; os detalhes são sugestões, troque à vontade
export const CATEGORIAS = {
  people: {
    rotulo: "Personagens",
    detalhes: [
      { chave: "birth_year", rotulo: "Nascimento" },
      { chave: "gender", rotulo: "Gênero" },
    ],
    detalhesModal: [
      { chave: "birth_year", rotulo: "Nascimento" },
      { chave: "gender", rotulo: "Gênero" },
      { chave: "height", rotulo: "Altura" },
      { chave: "mass", rotulo: "Peso" },
      { chave: "hair_color", rotulo: "Cor do cabelo" },
      { chave: "skin_color", rotulo: "Cor da pele" },
      { chave: "eye_color", rotulo: "Cor dos olhos" },
    ],
  },
  starships: {
    rotulo: "Naves",
    detalhes: [
      { chave: "model", rotulo: "Modelo" },
      { chave: "manufacturer", rotulo: "Fabricante" },
    ],
    detalhesModal: [
      { chave: "model", rotulo: "Modelo" },
      { chave: "manufacturer", rotulo: "Fabricante" },
      { chave: "starship_class", rotulo: "Classe" },
      { chave: "cost_in_credits", rotulo: "Custo em créditos" },
      { chave: "length", rotulo: "Comprimento" },
      { chave: "crew", rotulo: "Tripulação" },
      { chave: "passengers", rotulo: "Passageiros" },
      { chave: "hyperdrive_rating", rotulo: "Classificação do hipermotor" },
      { chave: "max_atmosphering_speed", rotulo: "Velocidade máxima" },
    ],
  },
  vehicles: {
    rotulo: "Veículos",
    detalhes: [
      { chave: "model", rotulo: "Modelo" },
      { chave: "manufacturer", rotulo: "Fabricante" },
    ],
    detalhesModal: [
      { chave: "model", rotulo: "Modelo" },
      { chave: "manufacturer", rotulo: "Fabricante" },
      { chave: "vehicle_class", rotulo: "Classe" },
      { chave: "cost_in_credits", rotulo: "Custo em créditos" },
      { chave: "length", rotulo: "Comprimento" },
      { chave: "crew", rotulo: "Tripulação" },
      { chave: "passengers", rotulo: "Passageiros" },
      { chave: "max_atmosphering_speed", rotulo: "Velocidade máxima" },
    ],
  },
  planets: {
    rotulo: "Planetas",
    detalhes: [
      { chave: "climate", rotulo: "Clima" },
      { chave: "terrain", rotulo: "Terreno" },
    ],
    detalhesModal: [
      { chave: "climate", rotulo: "Clima" },
      { chave: "terrain", rotulo: "Terreno" },
      { chave: "diameter", rotulo: "Diâmetro" },
      { chave: "rotation_period", rotulo: "Período de rotação" },
      { chave: "orbital_period", rotulo: "Período orbital" },
      { chave: "gravity", rotulo: "Gravidade" },
      { chave: "population", rotulo: "População" },
    ],
  },
  species: {
    rotulo: "Espécies",
    detalhes: [
      { chave: "classification", rotulo: "Classificação" },
      { chave: "language", rotulo: "Idioma" },
    ],
    detalhesModal: [
      { chave: "classification", rotulo: "Classificação" },
      { chave: "designation", rotulo: "Designação" },
      { chave: "average_lifespan", rotulo: "Expectativa de vida" },
      { chave: "average_height", rotulo: "Altura média" },
      { chave: "skin_colors", rotulo: "Cores de pele" },
      { chave: "hair_colors", rotulo: "Cores de cabelo" },
      { chave: "eye_colors", rotulo: "Cores dos olhos" },
      { chave: "language", rotulo: "Idioma" },
    ],
  },
};

const PERSONAGENS_NOTAVEIS_POR_ESPECIE = {
  "1": [
    { nome: "Luke Skywalker", url: "https://starwars.fandom.com/wiki/Luke_Skywalker" },
  ], // Human
  "2": [
    { nome: "C-3PO", url: "https://starwars.fandom.com/wiki/C-3PO" },
  ], // Droid
  "3": [
    { nome: "Chewbacca", url: "https://starwars.fandom.com/wiki/Chewbacca" },
  ], // Wookiee
  "4": [
    { nome: "Greedo", url: "https://starwars.fandom.com/wiki/Greedo" },
  ], // Rodian
  "5": [
    {
      nome: "Jabba the Hutt",
      url: "https://starwars.fandom.com/wiki/Jabba_Desilijic_Tiure",
    },
  ], // Hutt
  "6": [
    { nome: "Yoda", url: "https://starwars.fandom.com/wiki/Yoda" },
  ], // Yoda's species
  "7": [
    { nome: "Bossk", url: "https://starwars.fandom.com/wiki/Bossk" },
  ], // Trandoshan
  "8": [
    {
      nome: "Admiral Ackbar",
      url: "https://starwars.fandom.com/wiki/Admiral_Ackbar",
    },
  ], // Mon Calamari
  "9": [
    {
      nome: "Wicket W. Warrick",
      url: "https://starwars.fandom.com/wiki/Wicket_W._Warrick",
    },
  ], // Ewok
  "10": [
    { nome: "Nien Nunb", url: "https://starwars.fandom.com/wiki/Nien_Nunb" },
  ], // Sullustan
  "11": [
    { nome: "Nute Gunray", url: "https://starwars.fandom.com/wiki/Nute_Gunray" },
  ], // Neimoidian
  "12": [
    { nome: "Jar Jar Binks", url: "https://starwars.fandom.com/wiki/Jar_Jar_Binks" },
  ], // Gungan
  "13": [
    { nome: "Watto", url: "https://starwars.fandom.com/wiki/Watto" },
  ], // Toydarian
  "14": [
    { nome: "Sebulba", url: "https://starwars.fandom.com/wiki/Sebulba" },
  ], // Dug
  "15": [
    { nome: "Aayla Secura", url: "https://starwars.fandom.com/wiki/Aayla_Secura" },
  ], // Twi'lek
  "21": [
    { nome: "Kit Fisto", url: "https://starwars.fandom.com/wiki/Kit_Fisto" },
  ], // Nautolan
  "22": [
    { nome: "Darth Maul", url: "https://starwars.fandom.com/wiki/Darth_Maul" },
  ], // Zabrak
  "26": [
    { nome: "Plo Koon", url: "https://starwars.fandom.com/wiki/Plo_Koon" },
  ], // Kel Dor
  "28": [
    {
      nome: "Poggle the Lesser",
      url: "https://starwars.fandom.com/wiki/Poggle_the_Lesser",
    },
  ], // Geonosian
  "29": [
    {
      nome: "Luminara Unduli",
      url: "https://starwars.fandom.com/wiki/Luminara_Unduli",
    },
  ], // Mirialan
  "30": [
    { nome: "Zam Wesell", url: "https://starwars.fandom.com/wiki/Zam_Wesell" },
  ], // Clawdite
  "31": [
    {
      nome: "Dexter Jettster",
      url: "https://starwars.fandom.com/wiki/Dexter_Jettster",
    },
  ], // Besalisk
  "32": [
    { nome: "Lama Su", url: "https://starwars.fandom.com/wiki/Lama_Su" },
  ], // Kaminoan
  "34": [
    { nome: "San Hill", url: "https://starwars.fandom.com/wiki/San_Hill" },
  ], // Muun
  "35": [
    { nome: "Ahsoka Tano", url: "https://starwars.fandom.com/wiki/Ahsoka_Tano" },
  ], // Togruta
  "36": [
    {
      nome: "General Grievous",
      url: "https://starwars.fandom.com/wiki/Grievous",
    },
  ], // Kaleesh
  "37": [
    {
      nome: "The Grand Inquisitor",
      url: "https://starwars.fandom.com/wiki/Grand_Inquisitor",
    },
  ], // Pau'an
};

const EVENTOS_PLANETAS = {
  "1": ["Nascimento de Anakin Skywalker"], 
  "2": ["Planeta destruído pela Estrela da Morte no Episódio IV"], 
  "4": ["Batalha de Hoth"], 
  "5": ["Luke conheceu os caminhos da força com seu Mestre Yoda"], 
  "6": ["Han solo foi congelado"], 
  "7": ["Batalha de Endor"],
  "8": ["Invasão de Naboo"],
  "9": ["Batalha de Coruscant"], 
  "10": ["Duelo entre Obi-Wan e Jango Fett"], 
  "13": ["Icônica batalha entre Anakin e Obi-Wan"], 
};

function formatarDetalhes(item, campos) {
  return campos.map(({ chave, rotulo }) => ({
    rotulo,
    valor: limparValor(
      Array.isArray(item[chave]) ? item[chave].join(", ") : item[chave],
    ),
  }));
}

// devolve itens padronizados para os cards e para os detalhes do modal
export async function carregarGaleria(categoria) {
  const config = CATEGORIAS[categoria];
  if (!config) throw new Error(`Categoria desconhecida: ${categoria}`);

  const lista = await listarTudo(categoria);

  return lista.map((item) => {
    const id = idDaUrl(item.url);
    return {
      id,
      nome: item.name,
      imagem: urlImagem(categoria, id),
      imagemFallback: categoria === "planets" ? "/planeta-sem-imagem.svg" : null,
      detalhes: formatarDetalhes(item, config.detalhes),
      detalhesModal: formatarDetalhes(item, config.detalhesModal),
      eventos: categoria === "planets" ? EVENTOS_PLANETAS[id] ?? [] : undefined,
      personagensNotaveis:
        categoria === "species"
          ? PERSONAGENS_NOTAVEIS_POR_ESPECIE[id] ?? []
          : undefined,
    };
  });
}