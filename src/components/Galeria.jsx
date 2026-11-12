import { useEffect, useState } from "react";
import { CATEGORIAS, carregarGaleria } from "../services/swapi";
import styles from "./Galeria.module.css";

export default function Galeria() {
  const [categoria, setCategoria] = useState("people");
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [itemSelecionado, setItemSelecionado] = useState(null);

  useEffect(() => {
    let cancelado = false; // evita que uma resposta antiga sobrescreva a aba atual
    setCarregando(true);
    setErro(null);

    carregarGaleria(categoria)
      .then((lista) => {
        if (!cancelado) setItens(lista);
      })
      .catch((e) => {
        if (!cancelado) setErro(e.message);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [categoria]);

  useEffect(() => {
    if (!itemSelecionado) return undefined;

    function fecharComEscape(evento) {
      if (evento.key === "Escape") setItemSelecionado(null);
    }

    window.addEventListener("keydown", fecharComEscape);
    return () => window.removeEventListener("keydown", fecharComEscape);
  }, [itemSelecionado]);

  return (
    <section id="galeria" className={styles.galeria}>
      <h2 className={styles.titulo}>Galeria</h2>

      {/* abas */}
      <div className={styles.abas} role="tablist">
        {Object.entries(CATEGORIAS).map(([chave, { rotulo }]) => (
          <button
            key={chave}
            role="tab"
            aria-selected={categoria === chave}
            className={`${styles.aba} ${categoria === chave ? styles.abaAtiva : ""}`}
            onClick={() => {
              setCategoria(chave);
              setItemSelecionado(null);
            }}
          >
            {rotulo}
          </button>
        ))}
      </div>


      {carregando && <p className={styles.aviso}>Carregando...</p>}
      {erro && <p className={styles.aviso}>Erro: {erro}</p>}

      {!carregando && !erro && (
        <ul className={styles.grade}>
          {itens.map((item) => (
            <li key={item.id} className={styles.card}>
              <img
                className={styles.foto}
                src={item.imagem}
                alt={item.nome}
                loading="lazy"
                onError={(evento) => {
                  const imagem = evento.currentTarget;
                  if (item.imagemFallback && !imagem.dataset.fallbackAplicado) {
                    imagem.dataset.fallbackAplicado = "true";
                    imagem.src = item.imagemFallback;
                    return;
                  }
                  imagem.style.display = "none";
                }}
              />
              <h3 className={styles.nome}>{item.nome}</h3>

              <dl className={styles.detalhes}>
                {item.detalhes.map((d) => (
                  <div key={d.rotulo}>
                    <dt>{d.rotulo}</dt>
                    <dd>{d.valor}</dd>
                  </div>
                ))}
              </dl>
              <button
                type="button"
                className={styles.botaoDetalhes}
                onClick={() => setItemSelecionado(item)}
                aria-label={`Ver detalhes de ${item.nome}`}
              >
                Detalhes
              </button>
            </li>
          ))}
        </ul>
      )}

      {itemSelecionado && (
        <div
          className={styles.fundoModal}
          onClick={() => setItemSelecionado(null)}
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal"
            onClick={(evento) => evento.stopPropagation()}
          >
            <button
              type="button"
              className={styles.fecharModal}
              onClick={() => setItemSelecionado(null)}
              aria-label="Fechar detalhes"
            >
              ×
            </button>
            <h2 id="titulo-modal" className={styles.tituloModal}>
              {itemSelecionado.nome}
            </h2>
            <dl className={styles.detalhesModal}>
              {itemSelecionado.detalhesModal.map((detalhe) => (
                <div key={detalhe.rotulo}>
                  <dt>{detalhe.rotulo}</dt>
                  <dd>{detalhe.valor}</dd>
                </div>
              ))}
            </dl>

            {itemSelecionado.eventos && (
              <section className={styles.secaoExtra}>
                <h3>Eventos notáveis</h3>
                {itemSelecionado.eventos.length ? (
                  <ul>
                    {itemSelecionado.eventos.map((evento) => (
                      <li key={evento}>{evento}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Nenhum evento cadastrado.</p>
                )}
              </section>
            )}

            {itemSelecionado.personagensNotaveis && (
              <section className={styles.secaoExtra}>
                <h3>Personagens notáveis</h3>
                {itemSelecionado.personagensNotaveis.length ? (
                  <ul>
                    {itemSelecionado.personagensNotaveis.map((personagem) => (
                      <li key={personagem.nome ?? personagem}>
                        {personagem.url ? (
                          <a
                            href={personagem.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {personagem.nome}
                          </a>
                        ) : (
                          personagem
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Nenhum personagem cadastrado.</p>
                )}
              </section>
            )}
          </section>
        </div>
      )}

    </section>
  );
}