import { useEffect, useState } from 'react'

import { authFetch } from '../auth'

const API_BASE = import.meta.env.VITE_API_BASE || ''

function ClassificationForm({
  pacienteId,
  classificacoes,
  onClassificacaoCriada,
}) {
  const [codigoCif, setCodigoCif] = useState('')
  const [descricaoCif, setDescricaoCif] = useState('')
  const [modoBusca, setModoBusca] = useState('codigo')
  const [termoBusca, setTermoBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [qualificador, setQualificador] = useState('')
  const [observacao, setObservacao] = useState('')
  const [classificacaoRelacionadaId, setClassificacaoRelacionadaId] = useState('')
  const [tipoRelacao, setTipoRelacao] = useState('evolucao')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    const termo = termoBusca.trim()
    if (!termo) {
      return undefined
    }

    const controlador = new AbortController()
    const temporizador = window.setTimeout(async () => {
      setBuscando(true)
      setErro('')

      try {
        const parametros = new URLSearchParams({
          q: termo,
          campo: modoBusca === 'codigo' ? 'codigo' : 'descricao',
        })
        const resposta = await authFetch(
          `${API_BASE}/cif/codigos?${parametros}`,
          { signal: controlador.signal },
        )

        if (!resposta.ok) {
          throw new Error('Não foi possível pesquisar códigos CIF.')
        }

        setResultados(await resposta.json())
      } catch (erroBusca) {
        if (erroBusca.name !== 'AbortError') {
          setErro(erroBusca.message)
          setResultados([])
        }
      } finally {
        if (!controlador.signal.aborted) setBuscando(false)
      }
    }, 250)

    return () => {
      window.clearTimeout(temporizador)
      controlador.abort()
    }
  }, [modoBusca, termoBusca])

  async function salvarClassificacao(evento) {
    evento.preventDefault()
    setErro('')
    setSucesso('')
    setSalvando(true)

    try {
      const resposta = await authFetch(
        `${API_BASE}/pacientes/${pacienteId}/classificacoes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            codigo_cif: codigoCif,
            qualificador: Number(qualificador),
            observacao,
            ...(classificacaoRelacionadaId && {
              classificacao_relacionada_id: classificacaoRelacionadaId,
              tipo_relacao: tipoRelacao,
            }),
          }),
        },
      )

      const dados = await resposta.json()
      if (!resposta.ok) {
        throw new Error(dados.detail || 'Não foi possível salvar a classificação CIF.')
      }

      setCodigoCif('')
      setDescricaoCif('')
      setTermoBusca('')
      setResultados([])
      setQualificador('')
      setObservacao('')
      setClassificacaoRelacionadaId('')
      setSucesso('Classificação registrada no histórico.')
      onClassificacaoCriada()
    } catch (erroCadastro) {
      setErro(erroCadastro.message)
    } finally {
      setSalvando(false)
    }
  }

  const classificacoesRelacionaveis = classificacoes.filter(
    (item) => item.codigo_cif === codigoCif,
  )

  return (
    <section className="classification-form-area">
      <div className="card-heading">
        <span className="card-eyebrow">Nova classificação</span>

        <h2>Registrar classificação CIF</h2>

        <p>
          Preencha os dados abaixo para adicionar uma classificação ao histórico
          deste paciente.
        </p>
      </div>

      <form
        className="classification-form"
        onSubmit={salvarClassificacao}
      >
        <div className="form-group">
          <label>Pesquisar código CIF</label>
          <div className="segmented-control" role="group" aria-label="Modo de busca CIF">
            <button
              type="button"
              aria-pressed={modoBusca === 'codigo'}
              className={modoBusca === 'codigo' ? 'selected' : ''}
              onClick={() => setModoBusca('codigo')}
            >
              Por código
            </button>
            <button
              type="button"
              aria-pressed={modoBusca === 'palavra'}
              className={modoBusca === 'palavra' ? 'selected' : ''}
              onClick={() => setModoBusca('palavra')}
            >
              Por palavra-chave
            </button>
          </div>
          <input
            id="pesquisa-cif"
            type="search"
            value={termoBusca}
            placeholder={modoBusca === 'codigo' ? 'Ex.: d450' : 'Ex.: caminhar'}
            onChange={(evento) => setTermoBusca(evento.target.value)}
            autoComplete="off"
          />
          {buscando && <p className="search-status">Pesquisando códigos...</p>}
          {!buscando && termoBusca.trim() && resultados.length === 0 && !erro && (
            <p className="search-status">Nenhum código encontrado.</p>
          )}
          {termoBusca.trim() && resultados.length > 0 && (
            <div className="cif-search-results" role="listbox" aria-label="Resultados CIF">
              {resultados.map((item) => (
                <button
                  key={item.codigo}
                  type="button"
                  role="option"
                  aria-selected={codigoCif === item.codigo}
                  className={codigoCif === item.codigo ? 'selected' : ''}
                  onClick={() => {
                    setCodigoCif(item.codigo)
                    setDescricaoCif(item.descricao_pt)
                    setClassificacaoRelacionadaId('')
                  }}
                >
                  <strong>{item.codigo}</strong>
                  <span>{item.descricao_pt}</span>
                </button>
              ))}
            </div>
          )}
          <input type="hidden" value={codigoCif} required />
          {codigoCif && (
            <p className="selected-cif-code">
              Selecionado: <strong>{codigoCif}</strong> · {descricaoCif}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="qualificador">Qualificador</label>

          <select
            id="qualificador"
            value={qualificador}
            onChange={(evento) => setQualificador(evento.target.value)}
            required
          >
            <option value="">Selecione</option>
            <option value="0">0 - Nenhum problema</option>
            <option value="1">1 - Problema leve</option>
            <option value="2">2 - Problema moderado</option>
            <option value="3">3 - Problema grave</option>
            <option value="4">4 - Problema completo</option>
          </select>
        </div>

        {classificacoesRelacionaveis.length > 0 && (
          <div className="form-group">
            <label htmlFor="classificacao-relacionada">
              Relacionar a uma classificação anterior (opcional)
            </label>
            <select
              id="classificacao-relacionada"
              value={classificacaoRelacionadaId}
              onChange={(evento) => setClassificacaoRelacionadaId(evento.target.value)}
            >
              <option value="">Não relacionar</option>
              {classificacoesRelacionaveis.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.data} · Qualificador {item.qualificador}
                </option>
              ))}
            </select>
          </div>
        )}
        {classificacaoRelacionadaId && (
          <div className="form-group">
            <label htmlFor="tipo-relacao">Tipo de relação</label>
            <select
              id="tipo-relacao"
              value={tipoRelacao}
              onChange={(evento) => setTipoRelacao(evento.target.value)}
            >
              <option value="evolucao">Evolução histórica</option>
              <option value="duplicidade">Possível duplicidade ou erro</option>
            </select>
          </div>
        )}
        <p className="system-date-note">
          A data do registro será definida automaticamente pelo sistema.
        </p>

        <div className="form-group">
          <label htmlFor="observacao">Observação clínica</label>

          <textarea
            id="observacao"
            value={observacao}
            placeholder="Digite uma observação sobre a classificação"
            rows="4"
            onChange={(evento) => setObservacao(evento.target.value)}
          />
        </div>

        {erro && (
          <p className="form-error">
            {erro}
          </p>
        )}
        {sucesso && <p className="form-success" role="status">{sucesso}</p>}

        <button
          type="submit"
          className="primary-action-button"
          disabled={salvando || !codigoCif}
        >
          {salvando ? 'Salvando...' : 'Salvar classificação'}
        </button>
      </form>
    </section>
  )
}

export default ClassificationForm