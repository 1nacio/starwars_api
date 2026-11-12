import { useState } from 'react'  
import Jogo from './components/Jogo'
import NavBar from './components/NavBar'
import Galeria from './components/Galeria'
import Agradecimentos from './components/Agradecimentos'


function App() {

  return (
    <>
    <NavBar></NavBar>
    <Jogo></Jogo>
    <Galeria></Galeria>
    <Agradecimentos></Agradecimentos>
    </>
  )
}

export default App
