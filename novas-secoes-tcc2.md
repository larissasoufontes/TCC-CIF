# Novas seções — atualização para o TCC2

> Texto pronto pra colar na monografia (`relatorio3.docx`), escrito no mesmo
> tom e nas mesmas convenções do documento que você mandou (citação
> autor-data, "Fonte: elaboração própria" nas figuras, tempo verbal no
> passado só para o que já foi feito). Numerei as seções continuando a
> numeração do Relatório 3 (6.2 em diante) — ajuste os números se a
> estrutura final do TCC2 for diferente.
>
> Duas decisões que ficaram só minhas e que vale confirmar com o Prof. Pai
> antes de finalizar: (1) como enquadrar a redução de 7 para 4 tabelas
> implementadas — deixei como "priorização deliberada", mas se o
> orientador preferir enquadrar como "ajuste de escopo após início da
> implementação" o texto muda pouco; (2) se a seção de hospedagem (5.3.2)
> deve ser reescrita agora ou só quando a decisão permanente for tomada —
> por ora só acrescentei uma nota de rodapé factual sobre o teste via
> Cloudflare Tunnel, sem reabrir a comparação de opções.

---

## 6.2. Interface conectada ao banco de dados

*(substitui a antiga seção "6.2. Protótipo da interface" — o protótipo
estático em HTML/CSS deu lugar a uma aplicação funcional, com front-end,
back-end e banco de dados operando de ponta a ponta.)*

A partir do protótipo visual apresentado na Mostra de Pôsteres da
disciplina PMR3500 (Figuras 2 e 3), foi desenvolvida uma interface
funcional, conectada a um banco de dados PostgreSQL real. A arquitetura
resultante segue o padrão cliente-servidor: um front-end em React,
construído com a ferramenta de build Vite, consome uma API REST
desenvolvida em FastAPI (Python), que por sua vez executa as operações
de leitura e escrita no PostgreSQL.

O fluxo central do sistema — cadastro de paciente e registro de
classificação CIF — foi implementado e verificado funcionalmente de
ponta a ponta. Ao registrar uma nova classificação, o profissional
preenche o código CIF, o qualificador genérico (0 a 4), a data da
avaliação e uma observação clínica opcional; o backend valida no
servidor se o código informado existe na tabela `cif_codigo` antes de
gravar o registro, retornando erro HTTP 400 para códigos inexistentes e
HTTP 201 para o registro criado com sucesso. Essa validação server-side
— e não apenas no front-end — garante que nenhuma classificação
referencie um código CIF inválido, independentemente do cliente que
originou a requisição.

A implementação atual cobre quatro das sete tabelas do modelo relacional
descrito na Seção 6.1 (`profissional`, `paciente`, `cif_codigo` e
`classificacao_cif`). As tabelas `instituicao`, `profissional_instituicao`
e `exportacao` permanecem no modelo de dados, mas ainda não possuem
telas correspondentes: a prioridade desta etapa foi validar o fluxo
central de registro e consulta de classificações antes de estender a
interface aos fluxos periféricos de gestão institucional e exportação.
Nesse mesmo sentido, as telas de login e de exportação existem na
navegação do sistema como estrutura visual (scaffolding), mas ainda sem
lógica de autenticação ou geração de arquivo implementada — a
autenticação atual é provisória, adequada apenas ao ambiente de
desenvolvimento, e a exportação em CSV e PDF prevista no requisito
funcional correspondente (Seção 5.1.1) permanece como próxima etapa.

O código do backend, do frontend e do esquema do banco de dados está
versionado no repositório público do projeto
(github.com/larissasoufontes/TCC-CIF), que passou a reunir, além dos
artefatos de modelagem já mencionados na Seção 6.1, a implementação
completa da aplicação.

## 6.3. Importação oficial dos códigos CIF: da CID à CIF

Na primeira tentativa de importação dos códigos, a fonte de dados
utilizada foi a API de busca da CID-11 da OMS
(`id.who.int/icd/release/11/2026-01/mms/search`). A escolha decorreu da
proximidade de nomenclatura entre as famílias de classificação mantidas
pela OMS: a CID (CID-11, em inglês *ICD-11*) descreve doenças e
condições de saúde, enquanto a CIF (em inglês *ICF*), objeto deste
trabalho, descreve o impacto funcional dessas condições — duas
classificações distintas, publicadas pela mesma organização e acessíveis
por endpoints semelhantes da mesma API. Essa importação inicial trouxe
111 registros pertencentes à CID (diagnósticos como diabetes e câncer),
incompatíveis com o propósito do sistema.

O equívoco foi identificado durante a revisão dos dados importados, ao
notar que os registros descreviam diagnósticos, e não categorias de
funcionalidade. A fonte correta foi localizada por meio da inspeção do
tráfego de rede da ferramenta oficial de codificação da CIF disponibilizada
pela OMS (icd.who.int/ct/icf/pt/2026-01), o que permitiu identificar o
endpoint específico da linearização CIF —
`id.who.int/icd/release/11/2026-01/icf/codeinfo/<código>` — distinto do
endpoint da CID utilizado inicialmente. Os 111 registros incorretos
foram removidos da tabela `cif_codigo`.

A partir dessa correção, foi desenvolvido um novo script de importação
(`import_who_icf.py`), que autentica-se na API da OMS via OAuth2 (fluxo
*client credentials*), consulta o endpoint correto da CIF para cada
código informado e grava código, componente, categoria e descrição em
português na tabela `cif_codigo`, com atualização idempotente para
códigos já existentes. As credenciais de acesso à API (`client_id` e
`client_secret`) são informadas exclusivamente por variável de ambiente,
não sendo versionadas no repositório. Até o momento, o banco contém três
códigos CIF reais importados pela fonte correta, a título de prova de
conceito (`d450` — Andar; `b1301`; `e1101`); a extensão para o conjunto
completo de mais de 1.400 itens previsto no requisito funcional de busca
(Seção 5.1.1) é uma das próximas etapas do projeto.

Esse episódio reforçou, na prática, um risco já mencionado na literatura
sobre integração da CIF a sistemas de informação em saúde: a ausência de
padronização e a proximidade entre classificações distintas da OMS
exigem verificação cuidadosa da fonte de dados antes da integração
(Wiegand et al., 2012).

## Nota sobre hospedagem (atualização da Seção 5.3.2)

Para viabilizar testes com a dupla e com o orientador, o sistema foi
publicado temporariamente por meio de um túnel Cloudflare (*Cloudflare
Tunnel*), que expõe publicamente um endereço `trycloudflare.com`
apontando para o backend e o frontend em execução no computador de uma
das autoras — o Cloudflare atua apenas como ponte de rede; o
processamento e o armazenamento continuam ocorrendo localmente. Essa
publicação é temporária por natureza: o endereço muda a cada reinício do
túnel e deixa de responder quando os processos locais são encerrados. A
decisão sobre a plataforma de hospedagem permanente — entre as opções
comparadas na Tabela 2 (servidor próprio, Supabase ou Neon) — permanece
em aberto e será tomada antes da publicação definitiva do sistema.

---

## RELATÓRIO DE PROGRESSO — TCC2

*(seguindo o mesmo formato do "Relatório de Progresso" ao final do
Relatório 3 — ajuste o título para o número de relatório correto do
TCC2.)*

**Evolução desde o Relatório 3**

Desde a última entrega, o projeto avançou da fase de modelagem e
protótipo visual para uma aplicação funcional conectada a um banco de
dados real. Os principais avanços foram:

- Desenvolvimento do backend da aplicação em FastAPI, com validação
  server-side dos dados de entrada e verificação de existência do código
  CIF antes do registro de uma classificação.
- Desenvolvimento do frontend em React/Vite, substituindo o protótipo
  estático em HTML/CSS por uma interface funcional que se comunica com a
  API por requisições HTTP.
- Implementação de quatro das sete tabelas do modelo relacional
  (`profissional`, `paciente`, `cif_codigo`, `classificacao_cif`),
  priorizando o fluxo central de registro e consulta de classificações
  CIF.
- Identificação e correção de um erro metodológico na importação dos
  códigos CIF: a fonte inicial utilizada era, na verdade, a API da CID-11
  (doenças), não da CIF (funcionalidade). O erro foi corrigido a partir
  da fonte oficial correta, e um novo importador foi desenvolvido
  (`import_who_icf.py`), autenticado via OAuth2.
- Verificação funcional do fluxo de ponta a ponta: cadastro de paciente,
  registro de classificação CIF com validação (código inexistente
  rejeitado com HTTP 400; código válido registrado com HTTP 201).
- Publicação temporária do sistema via Cloudflare Tunnel, para testes
  pela dupla e pelo orientador.
- Continuidade do versionamento no repositório público
  (github.com/larissasoufontes/TCC-CIF), agora incluindo a implementação
  completa, além dos artefatos de modelagem já publicados.

**Limitações conhecidas desta etapa**

- A cobertura de códigos CIF importados pela fonte oficial ainda é
  reduzida (três códigos, a título de prova de conceito), frente ao
  requisito de busca sobre o conjunto completo da classificação.
- Autenticação de usuários e exportação de dados (CSV/PDF) têm estrutura
  de navegação implementada, mas sem lógica funcional ainda.
- As tabelas `instituicao`, `profissional_instituicao` e `exportacao` do
  modelo relacional ainda não têm interface correspondente.
- A hospedagem atual é temporária (túnel apontando para computador
  pessoal); a plataforma de hospedagem permanente ainda não foi definida.

**Próximas etapas**

- Ampliar a importação de códigos CIF para o conjunto completo previsto
  no requisito de busca, e avaliar um recurso de autocomplete/busca de
  código durante o registro de classificação, com exibição da descrição
  oficial antes de salvar.
- Decidir e implementar a plataforma de hospedagem permanente (Seção
  5.3.2), incluindo a rotação das credenciais de acesso à API da OMS
  antes de qualquer publicação pública.
- Implementar as telas de cadastro de instituição e vínculo
  profissional-instituição, e a exportação de dados em CSV/PDF.
- Avaliar a necessidade de autenticação real de usuários, hoje apenas
  simulada para fins de desenvolvimento.
