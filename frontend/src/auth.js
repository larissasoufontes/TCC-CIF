const CHAVE_SESSAO = 'cif_sessao'

export const PERFIS = {
  profissional: { rotulo: 'Profissional de saúde', inicio: '/sistema' },
  pesquisador: { rotulo: 'Pesquisador', inicio: '/pesquisa' },
  administrador: { rotulo: 'Administrador', inicio: '/admin' },
}

export function obterSessao() {
  try {
    return JSON.parse(sessionStorage.getItem(CHAVE_SESSAO))
  } catch {
    return null
  }
}

export function salvarSessao(sessao) {
  sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao))
}

export function limparSessao() {
  sessionStorage.removeItem(CHAVE_SESSAO)
}

export async function authFetch(url, opcoes = {}) {
  const sessao = obterSessao()
  const resposta = await fetch(url, {
    ...opcoes,
    headers: {
      ...opcoes.headers,
      ...(sessao && { Authorization: `Bearer ${sessao.access_token}` }),
    },
  })

  if (resposta.status === 401) {
    limparSessao()
    window.location.assign('/login')
  }

  return resposta
}
