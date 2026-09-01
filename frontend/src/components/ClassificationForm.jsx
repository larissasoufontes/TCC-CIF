import { useState } from 'react'

function ClassificationForm({ pacienteId, onClassificacaoCriada }) {
  const [codigoCif, setCodigoCif] = useState('')
  const [qualificador, setQualificador] = useState('')
  const [data, setData] = useState('')
  const [observacao, setObservacao] = useState('')
  const [erro, setErro] = useState('')

  async function salvarClassificacao(evento) {
    evento.preventDefault()

    setErro('')

    const resposta = await fetch(
      `http://127.0.0.1:8000/pacientes/${pacienteId}/classificacoes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigo_cif: codigoCif,
          qualificador: Number(qualificador),
          data: data,
          observacao: observacao,
        }),
      }
    )

    if (!resposta.ok) {
      setErro('Não foi possível salvar a classificação CIF.')
      return
    }

    setCodigoCif('')
    setQualificador('')
    setData('')
    setObservacao('')

    onClassificacaoCriada()
  }

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
          <label htmlFor="codigo-cif">Código CIF</label>

          <input
            id="codigo-cif"
            type="text"
            value={codigoCif}
            placeholder="Ex.: d450"
            onChange={(evento) => setCodigoCif(evento.target.value)}
            required
          />
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

        <div className="form-group">
          <label htmlFor="data-classificacao">Data</label>

          <input
            id="data-classificacao"
            type="date"
            value={data}
            onChange={(evento) => setData(evento.target.value)}
            required
          />
        </div>

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

        <button
          type="submit"
          className="primary-action-button"
        >
          Salvar classificação
        </button>
      </form>
    </section>
  )
}

export default ClassificationForm