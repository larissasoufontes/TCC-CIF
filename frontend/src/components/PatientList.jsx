import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function PatientList({ atualizarLista }) {
  const [pacientes, setPacientes] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    async function buscarPacientes() {
      const resposta = await fetch('http://127.0.0.1:8000/pacientes')
      const dados = await resposta.json()

      setPacientes(dados)
    }

    buscarPacientes()
  }, [atualizarLista])

  function abrirPaciente(pacienteId) {
    navigate(`/sistema/pacientes/${pacienteId}`)
  }

  return (
    <section className="patient-card patient-list-card">
      <div className="card-heading">
        <span className="card-eyebrow">Pacientes cadastrados</span>

        <h2>Lista de pacientes</h2>

        <p>
          Selecione um paciente para visualizar seus dados e histórico CIF.
        </p>
      </div>

      <div className="patient-list">
        {pacientes.length === 0 && (
          <div className="empty-state">
            Nenhum paciente cadastrado.
          </div>
        )}

        {pacientes.map((paciente) => (
          <button
            key={paciente.id}
            type="button"
            className="patient-item"
            onClick={() => abrirPaciente(paciente.id)}
          >
            <div className="patient-avatar">
              {paciente.nome.charAt(0).toUpperCase()}
            </div>

            <div className="patient-item-info">
              <strong>{paciente.nome}</strong>
              <span>{paciente.idade} anos</span>
            </div>

            <span className="patient-arrow">›</span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default PatientList