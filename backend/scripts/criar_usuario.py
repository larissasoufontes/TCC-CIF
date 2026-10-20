"""Cria um usuário de login. A senha é pedida no terminal e guardada apenas como hash.

Exemplos (a partir da pasta backend):
  python -m scripts.criar_usuario --perfil administrador --login admin
  python -m scripts.criar_usuario --perfil pesquisador --login pesquisador1
  python -m scripts.criar_usuario --perfil profissional --login dra.ana \
      --nome "Ana Souza" --conselho CREFITO --registro 12345-F
  python -m scripts.criar_usuario --perfil profissional --login ana2 \
      --profissional-id <uuid de um profissional já cadastrado>
"""
import argparse
import getpass
import sys

from app.auth import gerar_hash
from app.db import get_conn

TAMANHO_MINIMO_SENHA = 8


def ler_senha() -> str:
    senha = getpass.getpass('Senha: ')
    if len(senha) < TAMANHO_MINIMO_SENHA:
        sys.exit(f'A senha deve ter pelo menos {TAMANHO_MINIMO_SENHA} caracteres.')
    if senha != getpass.getpass('Repita a senha: '):
        sys.exit('As senhas não coincidem.')
    return senha


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    parser.add_argument('--perfil', required=True, choices=['profissional', 'pesquisador', 'administrador'])
    parser.add_argument('--login', required=True)
    parser.add_argument('--nome')
    parser.add_argument('--conselho')
    parser.add_argument('--registro')
    parser.add_argument('--profissional-id')
    args = parser.parse_args()

    if args.perfil == 'profissional' and not args.profissional_id:
        if not (args.nome and args.conselho and args.registro):
            sys.exit('Para profissional informe --profissional-id ou --nome, --conselho e --registro.')

    senha_hash = gerar_hash(ler_senha())

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT 1 FROM usuario WHERE lower(login) = lower(%s)', (args.login,))
            if cur.fetchone():
                sys.exit('Já existe um usuário com esse login.')

            profissional_id = None
            if args.perfil == 'profissional':
                profissional_id = args.profissional_id
                if not profissional_id:
                    cur.execute(
                        '''
                        INSERT INTO profissional (id, nome, conselho_profissional, numero_registro)
                        VALUES (gen_random_uuid(), %s, %s, %s) RETURNING id::text AS id
                        ''',
                        (args.nome, args.conselho, args.registro),
                    )
                    profissional_id = cur.fetchone()['id']

            cur.execute(
                '''
                INSERT INTO usuario (login, senha_hash, perfil, profissional_id)
                VALUES (%s, %s, %s, %s)
                ''',
                (args.login, senha_hash, args.perfil, profissional_id),
            )
    print(f'Usuário "{args.login}" ({args.perfil}) criado.')


if __name__ == '__main__':
    main()
