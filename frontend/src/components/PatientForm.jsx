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
    <section>
      <h2>Cadastrar paciente</h2>

      <form onSubmit={cadastrarPaciente}>
        <div>
          <label>Nome:</label>
          <input
            type="text"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
          />
        </div>

        <div>
          <label>Idade:</label>
          <input
            type="number"
            value={idade}
            onChange={(evento) => setIdade(evento.target.value)}
          />
        </div>

        <button type="submit">
          Cadastrar
        </button>
      </form>
    </section>
  )
}

export default PatientForm