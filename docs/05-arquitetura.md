# Arquitetura proposta

Esta arquitetura é uma hipótese para o MVP e ainda não foi implementada. Confirmar as escolhas com a equipe e com o conteúdo da disciplina.

## Tecnologias em avaliação

- **Frontend:** HTML, CSS e JavaScript.
- **Backend:** Node.js com Express.
- **Banco de dados:** SQLite.
- **Protótipo:** Figma ou ferramenta similar.
- **Versionamento e colaboração:** Git e GitHub; Jira ou alternativa para o quadro.

## Componentes previstos

- `frontend/`: páginas, formulários e apresentação da agenda.
- `backend/`: API, autenticação, validações e regras de agendamento.
- `database/`: esquema, migrações ou dados fictícios para desenvolvimento.
- `tests/`: verificações automatizadas das regras principais, quando a equipe iniciar a implementação.

## Entidades previstas

- **Usuários:** responsável autorizado, credenciais armazenadas com hash apropriado.
- **Clientes:** nome e telefone.
- **Serviços:** nome, preço em centavos e duração inteira em minutos.
- **Agendamentos:** cliente, serviço, início, fim calculado, status e cópias do preço e da duração no momento da reserva.

## Regra de conflito

Para agendamentos ativos, existe conflito quando `novoInicio < fimExistente` e `novoFim > inicioExistente`. Limites adjacentes são aceitos. A verificação e a gravação devem compartilhar uma transação. Cancelamentos deixam de ocupar o horário; conclusões permanecem no histórico.

## Segurança e configuração

Validar entradas no servidor, usar consultas parametrizadas, proteger sessão e credenciais e não versionar segredos. `.env.example` contém somente valores demonstrativos; ajustar nomes e valores quando a implementação definir sua configuração real. Usar dados fictícios.

## Decisões pendentes

Expediente, dias de funcionamento, fuso do estabelecimento, política de sessão, estratégia de migração e tecnologias finais. Não criar reservas fora do expediente até que o expediente seja definido.
