import styles from "./Agradecimentos.module.css";

export default function Agradecimentos() {
  return (
    <footer className={styles.rodape} aria-labelledby="titulo-agradecimentos">
      <div className={styles.conteudo}>
        <h2 id="titulo-agradecimentos" className={styles.titulo}>
          Agradecimentos
        </h2>
        <p className={styles.texto}>
          À professora Ana Paula Müller Giancoli, pela orientação e dedicação; ao Instituto Federal, pela
          oportunidade de aprendizado; ao presidente Luiz Inácio Lula da Silva,
          pelo apoio à educação pública; e aos colegas, pela parceria durante
          este ano.
        </p>
        <p className={styles.credito}>
           Que a Força esteja com vocês!
        </p>
      </div>
    </footer>
  );
}