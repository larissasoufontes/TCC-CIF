import { Navigate } from 'react-router-dom'

import { obterSessao, PERFIS } from '../auth'

function RotaProtegida({ perfil, children }) {
  const sessao = obterSessao()

  if (!sessao) {
    return <Navigate to="/login" replace />
  }

  if (sessao.perfil !== perfil) {
    return <Navigate to={PERFIS[sessao.perfil].inicio} replace />
  }

  return children
}

export default RotaProtegida
