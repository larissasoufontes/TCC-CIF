import { useState } from 'react'
import PatientForm from '../components/PatientForm'
import PatientList from '../components/PatientList'

function Patients() {
  const [atualizarLista, setAtualizarLista] = useState(0)

  function pacienteCadastrado() {
    setAtualizarLista(atualizarLista + 1)
  }

  return (
    <main className="patients-page">
      <section className="page-heading">
        <span className="page-tag">Gestão de pacientes</span>
        <h1>Pacientes</h1>
        <p>
          Cadastre, consulte e atualize as informações dos pacientes vinculados
          ao sistema.
        </p>
      </section>

      <section className="patients-grid">
        <PatientList atualizarLista={atualizarLista} />
        <PatientForm onPacienteCadastrado={pacienteCadastrado} />
      </section>
    </main>
  )
}

export default Patients