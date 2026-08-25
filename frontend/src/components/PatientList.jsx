import { useState } from 'react'

function PatientList() {
  const pacientes = [
    { id: 1, nome: 'Maria da Silva' },
    { id: 2, nome: 'João Santos' },
    { id: 3, nome: 'Ana Oliveira' },
  ]

  const [pacienteSelecionado, setPacienteSelecionado] = useState(null)

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