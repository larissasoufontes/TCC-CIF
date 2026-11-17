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
  const [estatisticasLocalidade, setEstatisticasLocalidade] = useState([])
  const [carregandoEstatisticas, setCarregandoEstatisticas] = useState(true)
  const [erroEstatisticas, setErroEstatisticas] = useState('')

  const [chaveSelecionada, setChaveSelecionada] = useState('')
  const [classificacoes, setClassificacoes] = useState([])
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)
  const [erroHistorico, setErroHistorico] = useState('')
  const [componente, setComponente] = useState('')
  const [codigoPrefixo, setCodigoPrefixo] = useState('')
  const [exportando, setExportando] = useState(false)
  const [erroExportacao, setErroExportacao] = useState('')
  const [sucessoExportacao, setSucessoExportacao] = useState('')

  const codigoFiltrado = codigoPrefixo.trim().toLowerCase()
  const classificacoesFiltradas = classificacoes.filter((classificacao) => {
    const componenteCorresponde =
      !componente || classificacao.codigo_cif.startsWith(componente)
    const codigoCorresponde =
      !codigoFiltrado || classificacao.codigo_cif.startsWith(codigoFiltrado)
    return componenteCorresponde && codigoCorresponde
  })

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

    async function carregarEstatisticasLocalidade() {
      try {
        const resposta = await authFetch(
          `${API_BASE}/pesquisa/estatisticas/localidade`,
        )
        if (!resposta.ok) {
          throw new Error('Não foi possível carregar as estatísticas geográficas.')
        }
        setEstatisticasLocalidade(await resposta.json())
      } catch (erroCarga) {
        setErroEstatisticas(
          erroCarga.message || 'Não foi possível conectar à API.',
        )
      } finally {
        setCarregandoEstatisticas(false)
      }
    }

    carregar()
    carregarEstatisticasLocalidade()
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

  async function exportarCSV() {
    setErroExportacao('')
    setSucessoExportacao('')
    if (codigoFiltrado && !/^[bsde][0-9]{0,5}$/.test(codigoFiltrado)) {
      setErroExportacao('Informe um prefixo CIF válido, como d4 ou d450.')
      return
    }
    setExportando(true)

    try {
      const parametros = new URLSearchParams()
      if (componente) parametros.set('componente', componente)
      if (codigoFiltrado) parametros.set('codigo', codigoFiltrado)
      const query = parametros.size ? `?${parametros}` : ''
      const resposta = await authFetch(
        `${API_BASE}/pesquisa/classificacoes/exportacao${query}`,
      )

      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({}))
        throw new Error(dados.detail || 'Não foi possível exportar os dados.')
      }

      const registros = await resposta.json()
      if (registros.length === 0) {
        setErroExportacao('Nenhuma classificação corresponde aos filtros.')
        return
      }

      const linhas = [
        [
          'Chave do paciente',
          'Faixa etária',
          'Código CIF',
          'Descrição CIF',
          'Qualificador',
          'Data',
          'Relações históricas',
        ],
        ...registros.map((registro) => [
          registro.chave,
          registro.faixa_etaria,
          registro.codigo_cif,
          registro.descricao_pt || '',
          registro.qualificador,
          registro.data,
          registro.relacoes,
        ]),
      ]
      const csv = linhas
        .map((linha) =>
          linha
            .map((valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`)
            .join(';'),
        )
        .join('\r\n')
      const arquivo = new Blob(['\uFEFF', csv], {
        type: 'text/csv;charset=utf-8;',
      })
      const url = URL.createObjectURL(arquivo)
      const link = document.createElement('a')
      link.href = url
      link.download = 'classificacoes_cif_anonimizadas.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setSucessoExportacao('CSV anonimizado exportado.')
    } catch (erro) {
      setErroExportacao(erro.message || 'Não foi possível conectar à API.')
    } finally {
      setExportando(false)
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

      <section className="patient-card research-statistics">
        <div className="card-heading">
          <span className="card-eyebrow">Distribuição geográfica</span>
          <h2>Pacientes e classificações por localidade</h2>
          <p>
            Dados apresentados somente em grupos agregados; município e UF não
            são associados às chaves individuais.
          </p>
        </div>

        {carregandoEstatisticas && (
          <p className="search-status">Carregando estatísticas...</p>
        )}
        {erroEstatisticas && (
          <p className="form-error" role="alert">{erroEstatisticas}</p>
        )}
        {!carregandoEstatisticas && !erroEstatisticas &&
          estatisticasLocalidade.length === 0 && (
            <div className="empty-state">
              Nenhuma localidade atingiu o mínimo de 5 pacientes para exibição.
            </div>
          )}
        {!carregandoEstatisticas && !erroEstatisticas &&
          estatisticasLocalidade.length > 0 && (
            <div className="research-table-wrap">
              <table className="research-table">
                <thead>
                  <tr>
                    <th scope="col">Estado</th>
                    <th scope="col">Município</th>
                    <th scope="col">Pacientes</th>
                    <th scope="col">Classificações</th>
                  </tr>
                </thead>
                <tbody>
                  {estatisticasLocalidade.map((linha) => (
                    <tr key={`${linha.estado}-${linha.municipio}`}>
                      <td>{linha.estado}</td>
                      <td>{linha.municipio}</td>
                      <td>{linha.pacientes}</td>
                      <td>{linha.classificacoes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        <p className="research-privacy-note">
          Localidades com menos de 5 pacientes são omitidas para reduzir risco
          de identificação em grupos pequenos.
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

          <div className="patient-form">
            <div className="form-group">
              <label htmlFor="filtro-componente">Componente CIF</label>
              <select
                id="filtro-componente"
                value={componente}
                onChange={(evento) => setComponente(evento.target.value)}
              >
                <option value="">Todos os componentes</option>
                <option value="b">Funções do corpo (b)</option>
                <option value="s">Estruturas do corpo (s)</option>
                <option value="d">Atividades e participação (d)</option>
                <option value="e">Fatores ambientais (e)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="filtro-codigo-cif">Código ou nível CIF</label>
              <input
                id="filtro-codigo-cif"
                type="search"
                value={codigoPrefixo}
                maxLength={6}
                placeholder="Ex.: d4 ou d450"
                onChange={(evento) =>
                  setCodigoPrefixo(evento.target.value.toLowerCase())
                }
              />
            </div>
            <div className="patient-actions">
              <button
                type="button"
                className="secondary-action-button"
                onClick={exportarCSV}
                disabled={exportando}
              >
                {exportando ? 'Exportando...' : 'Exportar CSV geral'}
              </button>
            </div>
            <p className="search-status">
              O prefixo inclui o nível e seus subníveis; por exemplo, d4 encontra d450.
            </p>
            {erroExportacao && (
              <p className="form-error" role="alert">{erroExportacao}</p>
            )}
            {sucessoExportacao && (
              <p className="form-success" role="status">{sucessoExportacao}</p>
            )}
          </div>

          {!chaveSelecionada && (
            <div className="empty-state">
              Escolha uma chave na lista para consultar as classificações.
            </div>
          )}
          {carregandoHistorico && <p className="search-status">Carregando histórico...</p>}
          {erroHistorico && <p className="form-error" role="alert">{erroHistorico}</p>}
          {chaveSelecionada && !carregandoHistorico && !erroHistorico &&
            classificacoesFiltradas.length === 0 && (
              <div className="empty-state">
                {classificacoes.length === 0
                  ? 'Sem classificações registradas.'
                  : 'Nenhuma classificação corresponde aos filtros.'}
              </div>
            )}

          <div className="classification-history">
            {classificacoesFiltradas.map((classificacao) => (
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
