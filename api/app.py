from flask import Flask, request, jsonify, abort
from datetime import date
import os
from uuid import uuid4
import psycopg2
import psycopg2.extras


def get_conn():
    dsn = os.getenv('DATABASE_URL')
    if not dsn:
        raise RuntimeError('DATABASE_URL environment variable is not set')
    return psycopg2.connect(dsn, cursor_factory=psycopg2.extras.RealDictCursor)


app = Flask(__name__)


@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response


@app.route('/api/cif/codes')
def cif_codes():
    componente = request.args.get('componente')
    categoria = request.args.get('categoria')
    q = request.args.get('q')
    limit = int(request.args.get('limit', 100))
    params = []
    where = []
    if componente:
        where.append('componente = %s')
        params.append(componente)
    if categoria:
        where.append('categoria = %s')
        params.append(categoria)
    if q:
        where.append('(codigo ILIKE %s OR descricao_pt ILIKE %s)')
        params += [f'%{q}%', f'%{q}%']
    sql = 'SELECT codigo, componente, categoria, descricao_pt FROM cif_codigo'
    if where:
        sql += ' WHERE ' + ' AND '.join(where)
    sql += ' ORDER BY codigo LIMIT %s'
    params.append(limit)
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
    return jsonify(rows)


def patient_query():
    return '''
        SELECT id::text AS id, nome,
               EXTRACT(YEAR FROM age(CURRENT_DATE, data_nascimento))::int AS idade
        FROM paciente
    '''


@app.route('/pacientes', methods=['GET'])
def patients_list():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(patient_query() + ' ORDER BY nome')
            return jsonify(cur.fetchall())


@app.route('/pacientes', methods=['POST'])
def patient_create():
    payload = request.get_json(silent=True) or {}
    nome = str(payload.get('nome', '')).strip()
    if not nome:
        return jsonify({'erro': 'nome é obrigatório'}), 400

    try:
        idade = int(payload.get('idade'))
        if idade < 0 or idade > 130:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({'erro': 'idade deve ser um número entre 0 e 130'}), 400

    nascimento = date.today().replace(year=date.today().year - idade)
    paciente_id = str(uuid4())
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                '''
                INSERT INTO paciente (
                    id, nome, data_nascimento, sexo, municipio, estado
                ) VALUES (%s, %s, %s, 'O', 'Não informado', 'SP')
                ''',
                (paciente_id, nome, nascimento),
            )
            cur.execute(patient_query() + ' WHERE id = %s', (paciente_id,))
            row = cur.fetchone()
    return jsonify(row), 201


@app.route('/pacientes/<patient_id>', methods=['GET'])
def patient_get(patient_id):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(patient_query() + ' WHERE id = %s', (patient_id,))
            row = cur.fetchone()
    if not row:
        abort(404)
    return jsonify(row)


@app.route('/pacientes/<patient_id>', methods=['PUT'])
def patient_update(patient_id):
    payload = request.get_json(silent=True) or {}
    nome = str(payload.get('nome', '')).strip()
    if not nome:
        return jsonify({'erro': 'nome é obrigatório'}), 400

    try:
        idade = int(payload.get('idade'))
        if idade < 0 or idade > 130:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({'erro': 'idade deve ser um número entre 0 e 130'}), 400

    nascimento = date.today().replace(year=date.today().year - idade)
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                'UPDATE paciente SET nome = %s, data_nascimento = %s WHERE id = %s',
                (nome, nascimento, patient_id),
            )
            if cur.rowcount == 0:
                abort(404)
            cur.execute(patient_query() + ' WHERE id = %s', (patient_id,))
            row = cur.fetchone()
    return jsonify(row)


@app.route('/pacientes/<patient_id>', methods=['DELETE'])
def patient_delete(patient_id):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute('DELETE FROM paciente WHERE id = %s', (patient_id,))
            if cur.rowcount == 0:
                abort(404)
    return jsonify({'mensagem': 'Paciente deletado com sucesso'})


def classification_query():
    return '''
        SELECT c.id::text AS id, c.paciente_id::text AS paciente_id,
               c.cif_codigo AS codigo_cif,
               c.qualificador_generico AS qualificador,
               c.created_at::date AS data,
               NULL::text AS observacao
        FROM classificacao_cif c
    '''


@app.route('/pacientes/<patient_id>/classificacoes', methods=['GET'])
def patient_classifications(patient_id):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                classification_query()
                + ' WHERE c.paciente_id = %s ORDER BY c.created_at DESC',
                (patient_id,),
            )
            return jsonify(cur.fetchall())


@app.route('/pacientes/<patient_id>/classificacoes', methods=['POST'])
def patient_classification_create(patient_id):
    payload = request.get_json(silent=True) or {}
    cif_codigo = str(payload.get('codigo_cif', payload.get('cif_codigo', ''))).strip()
    if not cif_codigo:
        return jsonify({'erro': 'codigo_cif é obrigatório'}), 400

    try:
        qualificador = int(payload.get('qualificador', 0))
        if qualificador < 0 or qualificador > 4:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({'erro': 'qualificador deve ser um número entre 0 e 4'}), 400

    profissional_id = payload.get('profissional_id') or os.getenv('DEFAULT_PROFISSIONAL_ID')
    if not profissional_id:
        return jsonify({'erro': 'profissional_id é obrigatório'}), 400

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT 1 FROM paciente WHERE id = %s', (patient_id,))
            if not cur.fetchone():
                return jsonify({'erro': 'Paciente não encontrado'}), 404

            cur.execute(
                'SELECT 1 FROM cif_codigo WHERE codigo = %s',
                (cif_codigo,),
            )
            if not cur.fetchone():
                return jsonify({
                    'erro': 'Código CIF não encontrado',
                    'cif_codigo': cif_codigo,
                }), 400

            codigo_completo = payload.get('codigo_completo_qualificado')
            if not codigo_completo:
                codigo_completo = f'{cif_codigo}.{qualificador}'

            cur.execute(
                '''
                INSERT INTO classificacao_cif (
                    id, paciente_id, profissional_id, cif_codigo,
                    qualificador_generico, codigo_completo_qualificado
                ) VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id::text AS id, paciente_id::text AS paciente_id,
                          cif_codigo AS codigo_cif,
                          qualificador_generico AS qualificador,
                          created_at::date AS data,
                          NULL::text AS observacao
                ''',
                    (
                        str(uuid4()), patient_id, profissional_id, cif_codigo,
                    qualificador, codigo_completo,
                ),
            )
            row = cur.fetchone()
    return jsonify(row), 201


@app.route('/api/classificacoes')
def classificacoes():
    paciente_id = request.args.get('paciente_id')
    profissional_id = request.args.get('profissional_id')
    cif_codigo = request.args.get('cif_codigo')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    limit = int(request.args.get('limit', 100))
    where = []
    params = []
    if paciente_id:
        where.append('c.paciente_id = %s')
        params.append(paciente_id)
    if profissional_id:
        where.append('c.profissional_id = %s')
        params.append(profissional_id)
    if cif_codigo:
        where.append('c.cif_codigo = %s')
        params.append(cif_codigo)
    if date_from:
        where.append('c.created_at >= %s')
        params.append(date_from)
    if date_to:
        where.append('c.created_at <= %s')
        params.append(date_to)
    sql = '''
    SELECT c.id, c.paciente_id, p.nome as paciente_nome, c.profissional_id, pr.nome as profissional_nome,
           c.cif_codigo, cc.descricao_pt as cif_descricao, c.qualificador_generico, c.qualificador_extensor,
           c.codigo_completo_qualificado, c.created_at
    FROM classificacao_cif c
    LEFT JOIN paciente p ON p.id = c.paciente_id
    LEFT JOIN profissional pr ON pr.id = c.profissional_id
    LEFT JOIN cif_codigo cc ON cc.codigo = c.cif_codigo
    '''
    if where:
        sql += ' WHERE ' + ' AND '.join(where)
    sql += ' ORDER BY c.created_at DESC LIMIT %s'
    params.append(limit)
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
    return jsonify(rows)


@app.route('/api/classificacoes', methods=['POST'])
def classificacao_create():
    payload = request.get_json(silent=True) or {}
    required = ('paciente_id', 'profissional_id', 'cif_codigo')
    missing = [field for field in required if not payload.get(field)]
    if missing:
        return jsonify({
            'erro': 'Campos obrigatórios ausentes',
            'campos': missing,
        }), 400

    cif_codigo = str(payload['cif_codigo']).strip()
    qualificador = payload.get('qualificador_generico', 0)
    qualificador_extensor = payload.get('qualificador_extensor')

    try:
        qualificador = int(qualificador)
    except (TypeError, ValueError):
        return jsonify({'erro': 'qualificador_generico deve ser um inteiro de 0 a 4'}), 400

    if not 0 <= qualificador <= 4:
        return jsonify({'erro': 'qualificador_generico deve estar entre 0 e 4'}), 400

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT codigo, descricao_pt FROM cif_codigo WHERE codigo = %s',
                (cif_codigo,),
            )
            codigo = cur.fetchone()
            if not codigo:
                return jsonify({
                    'erro': 'Código CIF não encontrado',
                    'cif_codigo': cif_codigo,
                }), 400

            codigo_qualificado = payload.get('codigo_completo_qualificado')
            if not codigo_qualificado:
                codigo_qualificado = f'{cif_codigo}.{qualificador}'

            cur.execute(
                '''
                INSERT INTO classificacao_cif (
                    id, paciente_id, profissional_id, cif_codigo,
                    qualificador_generico, qualificador_extensor,
                    codigo_completo_qualificado
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, paciente_id, profissional_id, cif_codigo,
                          qualificador_generico, qualificador_extensor,
                          codigo_completo_qualificado, created_at
                ''',
                (
                    uuid4(),
                    payload['paciente_id'],
                    payload['profissional_id'],
                    cif_codigo,
                    qualificador,
                    qualificador_extensor,
                    codigo_qualificado,
                ),
            )
            row = cur.fetchone()

    return jsonify(row), 201


@app.route('/api/classificacoes/<id>')
def classificacao_get(id):
    sql = '''
    SELECT c.*, p.nome as paciente_nome, pr.nome as profissional_nome, cc.descricao_pt as cif_descricao
    FROM classificacao_cif c
    LEFT JOIN paciente p ON p.id = c.paciente_id
    LEFT JOIN profissional pr ON pr.id = c.profissional_id
    LEFT JOIN cif_codigo cc ON cc.codigo = c.cif_codigo
    WHERE c.id = %s
    '''
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (id,))
            row = cur.fetchone()
            if not row:
                abort(404)
    return jsonify(row)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)), debug=True)
