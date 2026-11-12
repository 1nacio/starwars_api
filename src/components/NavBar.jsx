import styles from './NavBar.module.css';


export default function NavBar() {
  return (
  <header className={styles.cabecalho}>
    <h1 className="logo">SWAPI</h1>
    <nav className={styles.navbar}>   
      <ul className={styles.nav}>
        <li className={styles.navlink}><a href="#jogo">Jogo</a></li>
        <li className={styles.navlink}><a href="#galeria">Galeria</a></li>
        <li className={styles.navlink}><a href="#">Créditos</a></li>
      </ul>
      <div className="burger">
        <i className="fas fa-bars"></i>
      </div>
    </nav>
  </header>
    

  )

}