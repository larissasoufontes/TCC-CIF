import { useEffect, useState } from 'react'

function PatientList() {
  const [pacientes, setPacientes] = useState([])
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null)

  useEffect(() => {
    async function buscarPacientes() {
      const resposta = await fetch('http://127.0.0.1:8000/pacientes')
      const dados = await resposta.json()

      setPacientes(dados)
    }

    buscarPacientes()
  }, [])

  return (
    <section>
      <h2>Pacientes</h2>

      {pacientes.map((paciente) => (
        <div key={paciente.id}>
          <button onClick={() => setPacienteSelecionado(paciente)}>
            {paciente.nome}
          </button>
        </div>
      ))}

      {pacienteSelecionado && (
        <div>
          <h3>Paciente selecionado</h3>
          <p>{pacienteSelecionado.nome}</p>
        </div>
      )}
    </section>
  )
}

export default PatientList