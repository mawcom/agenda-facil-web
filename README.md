# Agenda Fácil

Aplicação web acadêmica para organizar a agenda de uma barbearia com um único profissional. O barbeiro administra clientes, serviços e agendamentos. Clientes podem criar uma conta e consultar seus próprios horários.

## Tecnologias

- HTML e CSS responsivos.
- TypeScript no navegador e no servidor.
- Node.js com os módulos nativos `node:http` e `node:sqlite`.
- SQLite para persistência local.

## Requisitos

- Node.js 22.13 ou superior (recomendado: Node.js 24).
- npm.

## Executar no Windows

1. Abra o PowerShell nesta pasta.
2. Execute `npm install` uma vez.
3. Execute `npm run dev`.
4. No próprio computador, acesse http://localhost:3000.

O servidor escuta em todas as interfaces de rede (`0.0.0.0`), sem restringir o acesso a `localhost`. Para abrir em outro dispositivo da mesma rede, use um dos endereços `Acesso na rede local` exibidos no terminal, por exemplo `http://192.168.1.20:3000`. Os dispositivos precisam estar conectados à mesma rede. Se o Firewall do Windows bloquear a conexão, permita o Node.js ou a porta 3000 somente em redes privadas confiáveis.

O comando compila o TypeScript e inicia o servidor. O banco é criado automaticamente em `database/agenda-facil.sqlite`; esse arquivo não deve ser enviado ao Git.

## Arquitetura e manual

Consulte [`docs/06-manual-do-projeto.md`](docs/06-manual-do-projeto.md) para conhecer os módulos, regras de negócio, exemplos de TypeScript e os passos para organizar o quadro Jira.

## Limitações atuais

- O login usa e-mail e senha; o cadastro não envia confirmação por e-mail. Use apenas para demonstração local, não publique na internet.
- Clientes e serviços podem ser cadastrados e consultados, mas ainda não editados/excluídos.
- A agenda permite criar, cancelar e concluir atendimentos, valida conflitos e impede agendamentos no passado.
- O calendário oferece horários das 08:00 às 18:00 em intervalos de 10 minutos, respeitando a duração do serviço e a folga entre atendimentos. Dias de funcionamento e fuso próprio ainda precisam ser definidos.
- Ainda faltam testes automatizados e validação com um estabelecimento real.
- Use apenas dados fictícios.

O quadro Jira, responsáveis, turma e link de protótipo ainda precisam ser definidos pela equipe.
