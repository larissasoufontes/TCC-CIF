import { useState } from 'react'

function PatientForm({ onPacienteCadastrado }) {
  const [nome, setNome] = useState('')
  const [idade, setIdade] = useState('')

  async function cadastrarPaciente(evento) {
    evento.preventDefault()

    const resposta = await fetch('http://127.0.0.1:8000/pacientes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome: nome,
        idade: Number(idade),
      }),
    })

    const dados = await resposta.json()
    console.log(dados)

    onPacienteCadastrado()

    setNome('')
    setIdade('')
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
            onChange={(evento) => setIdade(evento.target.value)}
            required
          />
        </div>

        <button className="primary-action-button" type="submit">
          Cadastrar paciente
        </button>
      </form>
    </section>
  )
}

export default PatientForm