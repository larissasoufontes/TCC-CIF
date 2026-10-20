import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { authFetch } from '../auth'

const API_BASE = import.meta.env.VITE_API_BASE || ''

function PatientList({ atualizarLista }) {
  const [pacientes, setPacientes] = useState([])
  const [termoBusca, setTermoBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const controlador = new AbortController()

    async function buscarPacientes() {
      setCarregando(true)
      setErro('')
      try {
        const resposta = await authFetch(`${API_BASE}/pacientes`, {
          signal: controlador.signal,
        })
        if (!resposta.ok) throw new Error('Não foi possível carregar os pacientes.')
        const dados = await resposta.json()
        setPacientes(dados)
      } catch (erroBusca) {
        if (erroBusca.name !== 'AbortError') {
          setErro(erroBusca.message || 'Não foi possível conectar à API.')
        }
      } finally {
        if (!controlador.signal.aborted) setCarregando(false)
      }
    }

    buscarPacientes()

    return () => controlador.abort()
  }, [atualizarLista])

  const pacientesFiltrados = pacientes.filter((paciente) =>
    paciente.nome.toLocaleLowerCase('pt-BR').includes(
      termoBusca.trim().toLocaleLowerCase('pt-BR'),
    ),
  )

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

      <div className="patient-search">
        <label htmlFor="busca-paciente">Buscar paciente</label>
        <input
          id="busca-paciente"
          type="search"
          value={termoBusca}
          placeholder="Digite o nome"
          onChange={(evento) => setTermoBusca(evento.target.value)}
        />
      </div>

      <div className="patient-list">
        {carregando && <p className="search-status">Carregando pacientes...</p>}
        {erro && <p className="form-error" role="alert">{erro}</p>}
        {!carregando && !erro && pacientes.length === 0 && (
          <div className="empty-state">
            Nenhum paciente cadastrado.
          </div>
        )}
        {!carregando && !erro && pacientes.length > 0 && pacientesFiltrados.length === 0 && (
          <div className="empty-state">Nenhum paciente corresponde à busca.</div>
        )}

        {pacientesFiltrados.map((paciente) => (
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