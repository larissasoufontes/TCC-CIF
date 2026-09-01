import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

function PatientDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [paciente, setPaciente] = useState(null)
  const [nome, setNome] = useState('')
  const [idade, setIdade] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function buscarPaciente() {
      try {
        const resposta = await fetch(
          `http://127.0.0.1:8000/pacientes/${id}`
        )

        if (!resposta.ok) {
          throw new Error('Paciente não encontrado.')
        }

        const dados = await resposta.json()

        setPaciente(dados)
        setNome(dados.nome)
        setIdade(dados.idade)
      } catch (erro) {
        setErro(erro.message)
      } finally {
        setCarregando(false)
      }
    }

    buscarPaciente()
  }, [id])

  async function salvarAlteracoes() {
    const resposta = await fetch(
      `http://127.0.0.1:8000/pacientes/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: nome,
          idade: Number(idade),
        }),
      }
    )

    if (!resposta.ok) {
      setErro('Não foi possível atualizar o paciente.')
      return
    }

    const dados = await resposta.json()

    setPaciente(dados)
  }

  async function excluirPaciente() {
    const confirmar = window.confirm(
      `Deseja realmente excluir ${paciente.nome}?`
    )

    if (!confirmar) return

    const resposta = await fetch(
      `http://127.0.0.1:8000/pacientes/${id}`,
      {
        method: 'DELETE',
      }
    )

    if (!resposta.ok) {
      setErro('Não foi possível excluir o paciente.')
      return
    }

    navigate('/sistema/pacientes')
  }

  if (carregando) {
    return (
      <main className="patient-details-page">
        <p>Carregando paciente...</p>
      </main>
    )
  }

  if (erro || !paciente) {
    return (
      <main className="patient-details-page">
        <Link to="/sistema/pacientes" className="back-link">
          ← Voltar para pacientes
        </Link>

        <div className="patient-card">
          <h1>Paciente não encontrado</h1>
          <p>{erro}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="patient-details-page">
      <Link to="/sistema/pacientes" className="back-link">
        ← Voltar para pacientes
      </Link>

      <section className="patient-profile-header">
        <div>
          <span className="page-tag">Perfil do paciente</span>
          <h1>{paciente.nome}</h1>
          <p>
            Consulte os dados do paciente e acompanhe suas classificações CIF.
          </p>
        </div>
      </section>

      <section className="patient-details-grid">
        <article className="patient-card">
          <div className="card-heading">
            <span className="card-eyebrow">Informações pessoais</span>
            <h2>Dados do paciente</h2>
            <p>
              Atualize as informações cadastrais quando necessário.
            </p>
          </div>

          <div className="patient-form">
            <div className="form-group">
              <label htmlFor="nome-paciente">Nome completo</label>

              <input
                id="nome-paciente"
                type="text"
                value={nome}
                onChange={(evento) => setNome(evento.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="idade-paciente">Idade</label>

              <input
                id="idade-paciente"
                type="number"
                min="0"
                value={idade}
                onChange={(evento) => setIdade(evento.target.value)}
              />
            </div>

            <div className="patient-actions">
              <button
                type="button"
                className="primary-action-button"
                onClick={salvarAlteracoes}
              >
                Salvar alterações
              </button>

              <button
                type="button"
                className="danger-button"
                onClick={excluirPaciente}
              >
                Excluir paciente
              </button>
            </div>
          </div>
        </article>

        <article className="patient-card cif-history-card">
          <div className="card-heading">
            <span className="card-eyebrow">Acompanhamento</span>
            <h2>Histórico CIF</h2>
            <p>
              Classificações registradas para este paciente ao longo do tempo.
            </p>
          </div>

          <div className="empty-history">
            <div className="empty-history-icon">CIF</div>

            <h3>Nenhuma classificação registrada</h3>

            <p>
              As classificações CIF deste paciente aparecerão aqui quando forem
              cadastradas.
            </p>
          </div>

          <button
            type="button"
            className="primary-action-button"
            disabled
          >
            + Nova classificação CIF
          </button>

          <p className="future-feature">
            Funcionalidade será implementada na próxima etapa.
          </p>
        </article>
      </section>
    </main>
  )
}

export default PatientDetails