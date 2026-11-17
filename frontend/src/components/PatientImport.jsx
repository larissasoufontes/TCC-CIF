import { useRef, useState } from 'react'

import { authFetch } from '../auth'
import { useToast } from './toastContext'

const API_BASE = import.meta.env.VITE_API_BASE || ''
const TAMANHO_MAXIMO = 5 * 1024 * 1024

function PatientImport({ onImportado }) {
  const [arquivo, setArquivo] = useState(null)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState(null)
  const [importando, setImportando] = useState(false)
  const campoArquivo = useRef(null)
  const mostrarToast = useToast()

  function baixarModelo() {
    const blob = new Blob(
      [
        '\uFEFFnome;data_nascimento;sexo;municipio;estado\r\n',
        'Maria da Silva;1984-05-12;F;Campinas;SP\r\n',
      ],
      { type: 'text/csv;charset=utf-8;' },
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'modelo-pacientes.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function importar(evento) {
    evento.preventDefault()
    setErro('')
    setResultado(null)
    if (!arquivo) return
    if (arquivo.size > TAMANHO_MAXIMO) {
      setErro('O arquivo deve ter no máximo 5 MB.')
      return
    }

    setImportando(true)
    try {
      const resposta = await authFetch(`${API_BASE}/pacientes/importacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conteudo: await arquivo.text() }),
      })
      const dados = await resposta.json().catch(() => ({}))
      if (!resposta.ok) {
        throw new Error(dados.detail || 'Não foi possível importar o arquivo.')
      }

      setResultado(dados)
      if (dados.importados > 0) {
        const quantidadeImportada = dados.importados
        mostrarToast(
          quantidadeImportada === 1
            ? 'Salvo: 1 paciente importado'
            : `Salvo: ${quantidadeImportada} pacientes importados`,
        )
        onImportado()
      }
      setArquivo(null)
      if (campoArquivo.current) campoArquivo.current.value = ''
    } catch (erroImportacao) {
      setErro(erroImportacao.message || 'Não foi possível conectar à API.')
    } finally {
      setImportando(false)
    }
  }

  return (
    <section className="patient-card patient-import-card">
      <div className="card-heading">
        <span className="card-eyebrow">Importação em lote</span>
        <h2>Importar pacientes de CSV</h2>
        <p>
          Cada linha válida cria um novo cadastro. O arquivo precisa conter
          nome, data de nascimento exata, sexo (M, F, O ou N), município e UF.
          O importador não aceita colunas adicionais: remova identificadores,
          diagnósticos e demais informações clínicas antes de enviar.
        </p>
      </div>

      <form className="patient-form" onSubmit={importar}>
        <div className="form-group">
          <label htmlFor="arquivo-pacientes">Arquivo CSV (máximo 5 MB)</label>
          <input
            id="arquivo-pacientes"
            type="file"
            ref={campoArquivo}
            accept=".csv,text/csv"
            onChange={(evento) => {
              setErro('')
              setResultado(null)
              setArquivo(evento.target.files?.[0] || null)
            }}
            required
          />
          <small>
            Até 500 pacientes. CSV em UTF-8, separado por vírgula ou ponto e
            vírgula. Data em AAAA-MM-DD ou DD/MM/AAAA.
          </small>
        </div>

        <button type="button" className="secondary-action-button" onClick={baixarModelo}>
          Baixar modelo CSV
        </button>

        {erro && <p className="form-error" role="alert">{erro}</p>}
        {resultado && (
          <div className="import-result" role="status">
            <p>
              Importados: {resultado.importados}. Rejeitados: {resultado.rejeitados}.
            </p>
            {resultado.erros.length > 0 && (
              <ul>
                {resultado.erros.map((item) => (
                  <li key={`${item.linha}-${item.motivo}`}>
                    Linha {item.linha}: {item.motivo}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button className="primary-action-button" type="submit" disabled={!arquivo || importando}>
          {importando ? 'Importando...' : 'Importar pacientes'}
        </button>
      </form>
    </section>
  )
}

export default PatientImport