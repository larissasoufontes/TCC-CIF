import { useState } from 'react'
import Header from './components/Header'
import PatientList from './components/PatientList'
import PatientForm from './components/PatientForm'

function App() {
  const [atualizarLista, setAtualizarLista] = useState(0)

  function pacienteCadastrado() {
    setAtualizarLista(atualizarLista + 1)
  }

  return (
    <>
      <Header />

      <PatientForm onPacienteCadastrado={pacienteCadastrado} />

      <PatientList atualizarLista={atualizarLista} />
    </>
  )
}

export default App