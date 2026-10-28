# Arquitetura proposta

Esta arquitetura foi implementada como primeira versão. Confirmar as escolhas com a equipe e com o conteúdo da disciplina antes de ampliar o escopo.

## Tecnologias em avaliação

- **Frontend:** HTML, CSS e TypeScript.
- **Backend:** Node.js com os módulos nativos `node:http` e TypeScript.
- **Banco de dados:** SQLite pelo módulo nativo `node:sqlite` (Node.js 22.13+).
- **Protótipo:** Figma ou ferramenta similar.
- **Versionamento e colaboração:** Git e GitHub; Jira ou alternativa para o quadro.

## Componentes previstos

- `frontend/`: página HTML, estilos CSS e código TypeScript do navegador.
- `backend/server.ts`: rotas HTTP e entrega dos arquivos da interface.
- `backend/agenda-service.ts`: operações de dados e regras de agendamento.
- `backend/validators.ts`: validação dos dados da API.
- `backend/database.ts`: criação das tabelas e acesso ao SQLite.
- `backend/types.ts`: formatos de dados em TypeScript.
- `database/`: arquivo SQLite local, criado ao iniciar.
- `dist/`: JavaScript compilado, ignorado pelo Git.

## Entidades previstas

- **Usuários:** contas de barbeiro e cliente, e-mail único, senha protegida com hash scrypt e sessão persistida como token hash.
- **Clientes:** nome e telefone.
- **Serviços:** nome, preço em centavos e duração inteira em minutos.
- **Agendamentos:** cliente, serviço, início, fim calculado, status e cópias do preço e da duração no momento da reserva.

## Regra de conflito

O sistema oferece horários em passos de 10 minutos entre 08:00 e 18:00, considerando a duração do serviço e reservando 10 minutos de intervalo entre atendimentos ativos. O atendimento precisa terminar até 18:00. A API verifica a disponibilidade e repete a validação dentro da transação de gravação. Cancelamentos liberam o horário; conclusões permanecem no histórico.

## Segurança e configuração

Validar entradas no servidor, usar consultas parametrizadas e não versionar dados do banco. A sessão usa cookie HttpOnly e SameSite; o cliente só consulta reservas do próprio cadastro. O servidor escuta no endereço local. O cadastro não verifica a posse do e-mail por mensagem, então esta versão é para demonstração local e não deve ser publicada. Usar dados fictícios.

## Decisões pendentes

Dias de funcionamento, fuso do estabelecimento, verificação de e-mail, recuperação de senha, estratégia de migração e tecnologias finais. O expediente da demonstração está definido das 08:00 às 18:00.
