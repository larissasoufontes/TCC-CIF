import { useEffect, useState } from 'react'

import { authFetch } from '../auth'

const API_BASE = import.meta.env.VITE_API_BASE || ''

function formatarData(data) {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

function Research() {
  const [pacientes, setPacientes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [chaveSelecionada, setChaveSelecionada] = useState('')
  const [classificacoes, setClassificacoes] = useState([])
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)
  const [erroHistorico, setErroHistorico] = useState('')

  useEffect(() => {
    async function carregar() {
      try {
        const resposta = await authFetch(`${API_BASE}/pesquisa/pacientes`)
        if (!resposta.ok) throw new Error('Não foi possível carregar os registros.')
        setPacientes(await resposta.json())
      } catch (erroCarga) {
        setErro(erroCarga.message || 'Não foi possível conectar à API.')
      } finally {
        setCarregando(false)
      }
    }

    carregar()
  }, [])

  async function abrirRegistro(chave) {
    setChaveSelecionada(chave)
    setClassificacoes([])
    setErroHistorico('')
    setCarregandoHistorico(true)

    try {
      const resposta = await authFetch(
        `${API_BASE}/pesquisa/pacientes/${encodeURIComponent(chave)}/classificacoes`,
      )
      if (!resposta.ok) throw new Error('Não foi possível carregar o histórico.')
      setClassificacoes(await resposta.json())
    } catch (erroHist) {
      setErroHistorico(erroHist.message || 'Não foi possível conectar à API.')
    } finally {
      setCarregandoHistorico(false)
    }
  }

  return (
    <main className="patients-page">
      <section className="page-heading">
        <span className="page-tag">Área do pesquisador</span>
        <h1>Pesquisa</h1>
        <p>
          Os pacientes são identificados apenas por uma chave aleatória. Nomes
          e demais dados pessoais não são exibidos nesta área.
        </p>
      </section>

      <section className="patients-grid">
        <section className="patient-card patient-list-card">
          <div className="card-heading">
            <span className="card-eyebrow">Registros</span>
            <h2>Chaves de pacientes</h2>
            <p>Selecione uma chave para ver o histórico de classificações CIF.</p>
          </div>

          <div className="patient-list">
            {carregando && <p className="search-status">Carregando registros...</p>}
            {erro && <p className="form-error" role="alert">{erro}</p>}
            {!carregando && !erro && pacientes.length === 0 && (
              <div className="empty-state">Nenhum registro disponível.</div>
            )}

            {pacientes.map((paciente) => (
              <button
                key={paciente.chave}
                type="button"
                className={
                  paciente.chave === chaveSelecionada
                    ? 'patient-item patient-item-selected'
                    : 'patient-item'
                }
                onClick={() => abrirRegistro(paciente.chave)}
              >
                <div className="patient-avatar">#</div>

                <div className="patient-item-info">
                  <strong>{paciente.chave}</strong>
                  <span>
                    Faixa etária {paciente.faixa_etaria} anos ·{' '}
                    {paciente.total_classificacoes} classificação(ões)
                  </span>
                </div>

                <span className="patient-arrow">›</span>
              </button>
            ))}
          </div>
        </section>

        <section className="patient-card">
          <div className="card-heading">
            <span className="card-eyebrow">Histórico CIF</span>
            <h2>{chaveSelecionada || 'Nenhuma chave selecionada'}</h2>
          </div>

          {!chaveSelecionada && (
            <div className="empty-state">
              Escolha uma chave na lista para consultar as classificações.
            </div>
          )}
          {carregandoHistorico && <p className="search-status">Carregando histórico...</p>}
          {erroHistorico && <p className="form-error" role="alert">{erroHistorico}</p>}
          {chaveSelecionada && !carregandoHistorico && !erroHistorico &&
            classificacoes.length === 0 && (
              <div className="empty-state">Sem classificações registradas.</div>
            )}

          <div className="classification-history">
            {classificacoes.map((classificacao) => (
              <article key={classificacao.id} className="classification-item">
                <div className="classification-top">
                  <div>
                    <span className="classification-code">
                      {classificacao.codigo_cif}
                    </span>
                    <h3>{classificacao.descricao_pt || 'Classificação CIF'}</h3>
                  </div>

                  <span className="qualifier-badge">
                    Qualificador {classificacao.qualificador}
                  </span>
                </div>

                <div className="classification-details">
                  <div>
                    <span>Data</span>
                    <strong>{formatarData(classificacao.data)}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

export default Research
