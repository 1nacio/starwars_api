import { useEffect, useState } from "react";
import { carregarPersonagens } from "../services/swapi";
import styles from "./Jogo.module.css";

const CHAVE_STATS = "swguesser:stats";
const EMOJI = { verde: "🟩", amarelo: "🟨", vermelho: "🟥" };

const formatarAno = (n) => (n < 0 ? `${-n} BBY` : `${n} ABY`);

const ATRIBUTOS = [
  { chave: "genero", rotulo: "Gênero", tipo: "lista" },
  { chave: "planeta", rotulo: "Planeta natal", tipo: "lista" },
  {
    chave: "nascimento",
    rotulo: "Nascimento",
    tipo: "numero",
    tolerancia: 10,
    formatar: formatarAno,
  },
  { chave: "altura", rotulo: "Altura (cm)", tipo: "numero", tolerancia: 10 },
  { chave: "peso", rotulo: "Peso (kg)", tipo: "numero", tolerancia: 10 },
  { chave: "cabelo", rotulo: "Cabelo", tipo: "lista" },
  { chave: "pele", rotulo: "Pele", tipo: "lista" },
  { chave: "olhos", rotulo: "Olhos", tipo: "lista" },
  { chave: "especie", rotulo: "Espécie", tipo: "lista" },
  { chave: "filmes", rotulo: "Filmes", tipo: "lista" },
];

/* ---------- utilidades ---------- */

function normalizar(texto) {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function sortear(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function lerStats() {
  try {
    const bruto = localStorage.getItem(CHAVE_STATS);
    return bruto ? JSON.parse(bruto) : { vitorias: 0, melhor: null };
  } catch {
    return { vitorias: 0, melhor: null };
  }
}

function salvarStats(stats) {
  try {
    localStorage.setItem(CHAVE_STATS, JSON.stringify(stats));
  } catch {
    // sem localStorage: o jogo continua funcionando, só não guarda
  }
}

/* ---------- comparação ---------- */

function compararLista(chute, alvo) {
  const iguais =
    chute.length === alvo.length && chute.every((x) => alvo.includes(x));
  if (iguais) return { cor: "verde" };
  if (chute.some((x) => alvo.includes(x))) return { cor: "amarelo" };
  return { cor: "vermelho" };
}

function compararNumero(chute, alvo, tolerancia) {
  // se algum dos dois é desconhecido, só é verde quando ambos são
  if (chute === null || alvo === null) {
    return { cor: chute === alvo ? "verde" : "vermelho" };
  }
  if (chute === alvo) return { cor: "verde" };

  const seta = alvo > chute ? "↑" : "↓";
  const cor = Math.abs(chute - alvo) <= tolerancia ? "amarelo" : "vermelho";
  return { cor, seta };
}

function comparar(attr, chute, alvo) {
  const a = chute[attr.chave];
  const b = alvo[attr.chave];
  if (attr.tipo === "numero") return compararNumero(a, b, attr.tolerancia);
  return compararLista(a, b);
}

function mostrarValor(attr, valor) {
  if (attr.tipo === "lista") return valor.join(", ");
  if (valor === null) return "?";
  return attr.formatar ? attr.formatar(valor) : valor;
}

/* ---------- vitória ---------- */

// em qual tentativa (1, 2, 3...) o atributo ficou verde pela primeira vez
function primeiroAcerto(attr, chutes, alvo) {
  const i = chutes.findIndex((c) => comparar(attr, c, alvo).cor === "verde");
  return i === -1 ? null : i + 1;
}

// texto para compartilhar, sem revelar o nome do personagem
function montarResultado(chutes, alvo) {
  const linhas = chutes.map((c) =>
    ATRIBUTOS.map((a) => EMOJI[comparar(a, c, alvo).cor]).join(""),
  );
  return `Adivinhe o personagem: acertei em ${chutes.length} tentativa(s)\n\n${linhas.join("\n")}`;
}

/* ---------- componente ---------- */

export default function Jogo() {
  const [personagens, setPersonagens] = useState([]);
  const [alvo, setAlvo] = useState(null);
  const [chutes, setChutes] = useState([]);
  const [palpite, setPalpite] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [modalFechado, setModalFechado] = useState(false);
  const [copiado, setCopiado] = useState(null); // null | "ok" | "erro"
  const [stats, setStats] = useState(lerStats);

  useEffect(() => {
    carregarPersonagens()
      .then((lista) => {
        setPersonagens(lista);
        setAlvo(sortear(lista));
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  const ganhou = chutes.includes(alvo);
  const mostrarModal = ganhou && !modalFechado;
  const disponiveis = personagens.filter((p) => !chutes.includes(p));

  // fecha o modal com Esc (precisa ficar antes dos returns condicionais)
  useEffect(() => {
    if (!mostrarModal) return;
    function aoTeclar(e) {
      if (e.key === "Escape") setModalFechado(true);
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [mostrarModal]);

  function aoEnviar(e) {
    e.preventDefault();
    const chute = personagens.find(
      (p) => normalizar(p.nome) === normalizar(palpite),
    );

    if (!chute) {
      setMensagem("Personagem não encontrado. Escolha um da lista.");
      return;
    }
    if (chutes.includes(chute)) {
      setMensagem("Você já tentou esse personagem.");
      return;
    }

    const novosChutes = [...chutes, chute];
    setChutes(novosChutes);
    setPalpite("");
    setMensagem("");

    if (chute === alvo) {
      const novas = {
        vitorias: stats.vitorias + 1,
        melhor:
          stats.melhor === null
            ? novosChutes.length
            : Math.min(stats.melhor, novosChutes.length),
      };
      setStats(novas);
      salvarStats(novas);
    }
  }

  function novaRodada() {
    setAlvo(sortear(personagens));
    setChutes([]);
    setPalpite("");
    setMensagem("");
    setModalFechado(false);
    setCopiado(null);
  }

  async function compartilhar() {
    try {
      await navigator.clipboard.writeText(montarResultado(chutes, alvo));
      setCopiado("ok");
    } catch {
      setCopiado("erro");
    }
    setTimeout(() => setCopiado(null), 2000);
  }

  if (carregando) return <p>Carregando personagens...</p>;
  if (erro) return <p>Erro: {erro}</p>;

  return (
    <main id="jogo" className={styles.jogo}>
      <h2>Adivinhe o Personagem de Star Wars</h2>
    
      {!ganhou ? (
        <form className={styles.formulario} onSubmit={aoEnviar}>
          <input
            className={styles.input}
            list="nomes"
            value={palpite}
            onChange={(e) => setPalpite(e.target.value)}
            placeholder="Digite o nome de um personagem"
          />
          <datalist id="nomes">
            {disponiveis.map((p) => (
              <option key={p.nome} value={p.nome} />
            ))}
          </datalist>
          <button className={styles.botao} type="submit">
            Chutar
          </button>
          {mensagem && <p className={styles.mensagem}>{mensagem}</p>}
        </form>
      ) : (
        <div className={styles.vitoria}>
          <p>
            Acertou em {chutes.length} tentativa(s)! Era {alvo.nome}.
          </p>
          <button
            className={styles.botaoSecundario}
            onClick={() => setModalFechado(false)}
          >
            Ver detalhes
          </button>
          <button className={styles.botao} onClick={novaRodada}>
            Jogar de novo
          </button>
        </div>
      )}

      {chutes.length > 0 && (
        <div className={styles.tabelaWrapper}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Personagem</th>
                {ATRIBUTOS.map((a) => (
                  <th key={a.chave}>{a.rotulo}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...chutes].reverse().map((chute, i) => (
                <tr
                  key={chute.nome}
                  className={i === 0 ? styles.linhaNova : undefined}
                >
                  <td className={styles.colunaPersonagem}>
                    <img
                      src={chute.imagem}
                      alt={chute.nome}
                      className={styles.foto}
                      loading="lazy"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                    <div className={styles.nomePersonagem}>{chute.nome}</div>
                  </td>

                  {ATRIBUTOS.map((attr) => {
                    const r = comparar(attr, chute, alvo);
                    return (
                      <td
                        key={attr.chave}
                        className={`${styles.celula} ${styles[r.cor]}`}
                      >
                        {mostrarValor(attr, chute[attr.chave])}
                        {r.seta && <span className={styles.seta}> {r.seta}</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mostrarModal && (
        <div className={styles.overlay} onClick={() => setModalFechado(true)}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.modalFechar}
              onClick={() => setModalFechado(true)}
              aria-label="Fechar"
            >
              
            </button>

            <p className={styles.modalSubtitulo}>Você acertou!</p>

            <img
              className={styles.modalFoto}
              src={alvo.imagem}
              alt={alvo.nome}
              onError={(e) => (e.currentTarget.style.display = "none")}
            />

            <h2 id="titulo-modal" className={styles.modalNome}>
              {alvo.nome}
            </h2>

            {/* curiosidades do personagem */}
            <dl className={styles.curiosidades}>
              <dt>Planeta natal</dt>
              <dd>{alvo.planeta.join(", ")}</dd>
              <dt>Espécie</dt>
              <dd>{alvo.especie.join(", ")}</dd>
              <dt>Filmes</dt>
              <dd>{alvo.filmes.join(", ")}</dd>
            </dl>

            {/* estatísticas da partida */}
            <h3 className={styles.modalSecao}>
              Você acertou em {chutes.length} tentativa(s)
            </h3>
            <p className={styles.modalLegenda}>
              Tentativa em que cada atributo ficou verde:
            </p>
            <ul className={styles.chips}>
              {ATRIBUTOS.map((a) => (
                <li key={a.chave} className={styles.chip}>
                  {a.rotulo}: {primeiroAcerto(a, chutes, alvo)}ª
                </li>
              ))}
            </ul>

            {/* vitórias guardadas no navegador */}
            <div className={styles.statsGlobais}>
              <div>
                <span className={styles.statNumero}>{stats.vitorias}</span>
                <span className={styles.statRotulo}>vitórias</span>
              </div>
              <div>
                <span className={styles.statNumero}>{stats.melhor}</span>
                <span className={styles.statRotulo}>melhor resultado</span>
              </div>
            </div>

            <div className={styles.modalAcoes}>
              <button className={styles.botaoSecundario} onClick={compartilhar}>
                {copiado === "ok"
                  ? "Copiado!"
                  : copiado === "erro"
                    ? "Não foi possível copiar"
                    : "Compartilhar resultado"}
              </button>
              <button className={styles.botao} onClick={novaRodada}>
                Jogar de novo
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
         