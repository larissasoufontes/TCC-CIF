import { useState } from 'react'

import { authFetch } from '../auth'

const API_BASE = import.meta.env.VITE_API_BASE || ''

function PatientForm({ onPacienteCadastrado }) {
  const [nome, setNome] = useState('')
  const [idade, setIdade] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function cadastrarPaciente(evento) {
    evento.preventDefault()
    setErro('')
    setSucesso('')
    setSalvando(true)

    try {
      const resposta = await authFetch(`${API_BASE}/pacientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), idade: Number(idade) }),
      })

      const dados = await resposta.json()
      if (!resposta.ok) {
        throw new Error(dados.detail || dados.erro || 'Não foi possível cadastrar o paciente.')
      }

      setNome('')
      setIdade('')
      setSucesso('Paciente cadastrado com sucesso.')
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
          <label htmlFor="idade">Idade</label>

          <input
            id="idade"
            type="number"
            value={idade}
            placeholder="Ex.: 45"
            min="0"
            max="130"
            step="1"
            onChange={(evento) => setIdade(evento.target.value)}
            required
          />
        </div>

        {erro && <p className="form-error" role="alert">{erro}</p>}
        {sucesso && <p className="form-success" role="status">{sucesso}</p>}

        <button className="primary-action-button" type="submit" disabled={salvando}>
          {salvando ? 'Cadastrando...' : 'Cadastrar paciente'}
        </button>
      </form>
    </section>
  )
}

export default PatientForm