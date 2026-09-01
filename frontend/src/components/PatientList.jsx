import { useEffect, useState } from 'react'

function PatientList({ atualizarLista }) {
  const [pacientes, setPacientes] = useState([])
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null)

  const [nomeEditado, setNomeEditado] = useState('')
  const [idadeEditada, setIdadeEditada] = useState('')

  useEffect(() => {
    async function buscarPacientes() {
      const resposta = await fetch('http://127.0.0.1:8000/pacientes')
      const dados = await resposta.json()

      setPacientes(dados)
    }

    buscarPacientes()
  }, [atualizarLista])

  async function atualizarPacientes() {
    const resposta = await fetch('http://127.0.0.1:8000/pacientes')
    const dados = await resposta.json()

    setPacientes(dados)
  }

  function selecionarPaciente(paciente) {
    setPacienteSelecionado(paciente)

    setNomeEditado(paciente.nome)
    setIdadeEditada(paciente.idade)
  }

  async function editarPaciente() {
    if (!pacienteSelecionado) {
      return
    }

    await fetch(
      `http://127.0.0.1:8000/pacientes/${pacienteSelecionado.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: nomeEditado,
          idade: Number(idadeEditada),
        }),
      }
    )

    setPacienteSelecionado(null)

    atualizarPacientes()
  }

  async function excluirPaciente() {
    if (!pacienteSelecionado) {
      return
    }

    await fetch(
      `http://127.0.0.1:8000/pacientes/${pacienteSelecionado.id}`,
      {
        method: 'DELETE',
      }
    )

    setPacienteSelecionado(null)

    atualizarPacientes()
  }

  return (
    <section>
      <h2>Pacientes</h2>

      {pacientes.map((paciente) => (
        <div key={paciente.id}>
          <button onClick={() => selecionarPaciente(paciente)}>
            {paciente.nome}
          </button>
        </div>
      ))}

      {pacienteSelecionado && (
        <div>
          <h3>Editar paciente</h3>

          <div>
            <label>Nome:</label>

            <input
              type="text"
              value={nomeEditado}
              onChange={(evento) => setNomeEditado(evento.target.value)}
            />
          </div>

          <div>
            <label>Idade:</label>

            <input
              type="number"
              value={idadeEditada}
              onChange={(evento) => setIdadeEditada(evento.target.value)}
            />
          </div>

          <button onClick={editarPaciente}>
            Salvar alterações
          </button>

          <button onClick={excluirPaciente}>
            Excluir paciente
          </button>
        </div>
      )}
    </section>
  )
}

export default PatientList