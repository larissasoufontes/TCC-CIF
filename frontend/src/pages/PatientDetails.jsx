import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import ClassificationForm from '../components/ClassificationForm'

function PatientDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [paciente, setPaciente] = useState(null)

  const [nome, setNome] = useState('')
  const [idade, setIdade] = useState('')

  const [classificacoes, setClassificacoes] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregarDados() {
      try {
        const respostaPaciente = await fetch(
          `http://127.0.0.1:8000/pacientes/${id}`
        )

        if (!respostaPaciente.ok) {
          throw new Error('Paciente não encontrado.')
        }

        const dadosPaciente = await respostaPaciente.json()

        setPaciente(dadosPaciente)
        setNome(dadosPaciente.nome)
        setIdade(dadosPaciente.idade)

        const respostaClassificacoes = await fetch(
          `http://127.0.0.1:8000/pacientes/${id}/classificacoes`
        )

        if (!respostaClassificacoes.ok) {
          throw new Error('Não foi possível carregar o histórico CIF.')
        }

        const dadosClassificacoes =
          await respostaClassificacoes.json()

        setClassificacoes(dadosClassificacoes)
      } catch (erro) {
        setErro(erro.message)
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [id])

  async function buscarClassificacoes() {
    const resposta = await fetch(
      `http://127.0.0.1:8000/pacientes/${id}/classificacoes`
    )

    const dados = await resposta.json()

    setClassificacoes(dados)
  }

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

  async function classificacaoCriada() {
    await buscarClassificacoes()
    setMostrarFormulario(false)
  }

  function exportarCSV() {
    if (classificacoes.length === 0) {
      return
    }

    const cabecalho = [
      'Código CIF',
      'Qualificador',
      'Data',
      'Observação',
    ]

    const linhas = classificacoes.map((classificacao) => [
      classificacao.codigo_cif,
      classificacao.qualificador,
      classificacao.data,
      classificacao.observacao || '',
    ])

    const dadosCSV = [
      cabecalho,
      ...linhas,
    ]

    const csv = dadosCSV
      .map((linha) =>
        linha
          .map((valor) => {
            const texto = String(valor).replace(/"/g, '""')
            return `"${texto}"`
          })
          .join(';')
      )
      .join('\n')

    const blob = new Blob(
      ['\uFEFF' + csv],
      {
        type: 'text/csv;charset=utf-8;',
      }
    )

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')

    const nomeArquivo = paciente.nome
      .toLowerCase()
      .replace(/\s+/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    link.href = url
    link.download = `historico_cif_${nomeArquivo}.csv`

    document.body.appendChild(link)

    link.click()

    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
        <Link
          to="/sistema/pacientes"
          className="back-link"
        >
          ← Voltar para pacientes
        </Link>

        <div className="patient-card">
          <h1>Não foi possível carregar o paciente</h1>
          <p>{erro}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="patient-details-page">
      <Link
        to="/sistema/pacientes"
        className="back-link"
      >
        ← Voltar para pacientes
      </Link>

      <section className="patient-profile-header">
        <div>
          <span className="page-tag">
            Perfil do paciente
          </span>

          <h1>{paciente.nome}</h1>

          <p>
            Consulte os dados do paciente e acompanhe suas
            classificações CIF.
          </p>
        </div>
      </section>

      <section className="patient-details-grid">
        <article className="patient-card">
          <div className="card-heading">
            <span className="card-eyebrow">
              Informações pessoais
            </span>

            <h2>Dados do paciente</h2>

            <p>
              Atualize as informações cadastrais quando necessário.
            </p>
          </div>

          <div className="patient-form">
            <div className="form-group">
              <label htmlFor="nome-paciente">
                Nome completo
              </label>

              <input
                id="nome-paciente"
                type="text"
                value={nome}
                onChange={(evento) =>
                  setNome(evento.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="idade-paciente">
                Idade
              </label>

              <input
                id="idade-paciente"
                type="number"
                min="0"
                value={idade}
                onChange={(evento) =>
                  setIdade(evento.target.value)
                }
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
          <div className="history-header">
            <div className="card-heading">
              <span className="card-eyebrow">
                Acompanhamento
              </span>

              <h2>Histórico CIF</h2>

              <p>
                Classificações registradas para este paciente
                ao longo do tempo.
              </p>
            </div>

            <div className="history-actions">
              <button
                type="button"
                className="secondary-action-button"
                onClick={exportarCSV}
                disabled={classificacoes.length === 0}
              >
                Exportar CSV
              </button>

              <button
                type="button"
                className="primary-action-button"
                onClick={() =>
                  setMostrarFormulario(!mostrarFormulario)
                }
              >
                {mostrarFormulario
                  ? 'Cancelar'
                  : '+ Nova classificação CIF'}
              </button>
            </div>
          </div>

          {mostrarFormulario && (
            <ClassificationForm
              pacienteId={id}
              onClassificacaoCriada={classificacaoCriada}
            />
          )}

          {classificacoes.length === 0 ? (
            <div className="empty-history">
              <div className="empty-history-icon">
                CIF
              </div>

              <h3>
                Nenhuma classificação registrada
              </h3>

              <p>
                As classificações CIF deste paciente aparecerão
                aqui quando forem cadastradas.
              </p>
            </div>
          ) : (
            <div className="classification-history">
              {classificacoes.map((classificacao) => (
                <article
                  key={classificacao.id}
                  className="classification-item"
                >
                  <div className="classification-top">
                    <div>
                      <span className="classification-code">
                        {classificacao.codigo_cif}
                      </span>

                      <h3>
                        Classificação CIF
                      </h3>
                    </div>

                    <span className="qualifier-badge">
                      Qualificador {classificacao.qualificador}
                    </span>
                  </div>

                  <div className="classification-details">
                    <div>
                      <span>Data</span>

                      <strong>
                        {classificacao.data}
                      </strong>
                    </div>

                    <div>
                      <span>Observação</span>

                      <strong>
                        {classificacao.observacao ||
                          'Sem observação'}
                      </strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  )
}

export default PatientDetails