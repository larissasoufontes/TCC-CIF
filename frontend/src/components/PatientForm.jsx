import { useState } from 'react'

import { authFetch } from '../auth'
import { ESTADOS_BRASILEIROS } from '../data/estados'
import { useToast } from './toastContext'

const API_BASE = import.meta.env.VITE_API_BASE || ''

function PatientForm({ onPacienteCadastrado }) {
  const [nome, setNome] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [sexo, setSexo] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [estado, setEstado] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const mostrarToast = useToast()
  const hoje = new Date().toISOString().slice(0, 10)

  async function cadastrarPaciente(evento) {
    evento.preventDefault()
    setErro('')
    setSalvando(true)

    try {
      const resposta = await authFetch(`${API_BASE}/pacientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          data_nascimento: dataNascimento,
          sexo,
          municipio: municipio.trim(),
          estado,
        }),
      })

      const dados = await resposta.json()
      if (!resposta.ok) {
        throw new Error(dados.detail || dados.erro || 'Não foi possível cadastrar o paciente.')
      }

      setNome('')
      setDataNascimento('')
      setSexo('')
      setMunicipio('')
      setEstado('')
      mostrarToast()
      onPacienteCadastrado()
    } catch (erroCadastro) {
      setErro(erroCadastro.message || 'Não foi possível conectar à API.')
    } finally {
      setSalvando(false)
    }

  }

  return (
    <section className="patient-card patient-form-card">
      <div className="card-heading">
        <span className="card-eyebrow">Novo cadastro</span>
        <h2>Cadastrar paciente</h2>
        <p>
          Preencha as informações abaixo para adicionar um novo paciente ao
          sistema.
        </p>
      </div>

      <form className="patient-form" onSubmit={cadastrarPaciente}>
        <div className="form-group">
          <label htmlFor="nome">Nome completo</label>

          <input
            id="nome"
            type="text"
            value={nome}
            placeholder="Digite o nome do paciente"
            maxLength="200"
            onChange={(evento) => setNome(evento.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="data-nascimento-paciente">Data de nascimento</label>

          <input
            id="data-nascimento-paciente"
            type="date"
            value={dataNascimento}
            max={hoje}
            onChange={(evento) => setDataNascimento(evento.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="sexo-paciente">Sexo</label>
          <select
            id="sexo-paciente"
            value={sexo}
            onChange={(evento) => setSexo(evento.target.value)}
            required
          >
            <option value="">Selecione</option>
            <option value="F">Feminino</option>
            <option value="M">Masculino</option>
            <option value="O">Outro</option>
            <option value="N">Não informado</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="municipio-paciente">Município</label>
          <input
            id="municipio-paciente"
            type="text"
            value={municipio}
            maxLength="120"
            placeholder="Digite o município ou Não informado"
            onChange={(evento) => setMunicipio(evento.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="estado-paciente">Estado (UF)</label>
          <select
            id="estado-paciente"
            value={estado}
            onChange={(evento) => setEstado(evento.target.value)}
            required
          >
            <option value="">Selecione</option>
            {ESTADOS_BRASILEIROS.map((uf) => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
            <option value="Não informado">Não informado</option>
          </select>
        </div>

        {erro && <p className="form-error" role="alert">{erro}</p>}
        <button className="primary-action-button" type="submit" disabled={salvando}>
          {salvando ? 'Cadastrando...' : 'Cadastrar paciente'}
        </button>
      </form>
    </section>
  )
}

export default PatientForm