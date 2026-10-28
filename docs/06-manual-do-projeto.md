# Manual simples do Agenda Fácil

## 1. Para que serve

O Agenda Fácil é um sistema local para uma barbearia com um profissional. O barbeiro pode cadastrar clientes e serviços, marcar atendimentos, consultar a agenda por dia, cancelar um horário ou registrar que foi concluído. O cliente cria uma conta e consulta os próprios horários. Use dados fictícios para demonstração.

## 2. Como abrir o sistema

1. Instale Node.js 22.13 ou mais recente (Node.js 24 é recomendado).
2. Abra um terminal nesta pasta.
3. Rode `npm install` uma vez para instalar o compilador TypeScript.
4. Rode `npm run dev` para compilar e iniciar o sistema.
5. Abra `http://localhost:3000` no navegador.
6. Para parar, volte ao terminal e pressione `Ctrl+C`.

Para apresentar o sistema, use `/login` para a tela de autenticação. `/cliente` e `/barbeiro` são as páginas protegidas de cada perfil; sem sessão, redirecionam para `/login` com o perfil correspondente selecionado. Depois do login, o cliente segue para `/cliente` e o barbeiro para `/barbeiro`. As rotas podem ser abertas diretamente ou coladas na barra do navegador.

Na primeira vez, escolha **Sou barbeiro** e crie a conta principal com e-mail e senha de pelo menos 5 caracteres. Depois, use o formulário de cima para entrar. O cliente usa **Sou cliente** para entrar ou criar a própria conta com senha de pelo menos 5 caracteres.

Ao iniciar, o Node cria `database/agenda-facil.sqlite`. O banco mantém os dados entre reinicializações e é ignorado pelo Git.

## 3. Como a arquitetura funciona

O navegador mostra a página HTML e o visual CSS. `frontend/client.ts` responde aos cliques e formulários e envia pedidos à API. O Node recebe esses pedidos, valida os dados, aplica as regras e lê ou grava no SQLite.

```text
Navegador
  ├─ frontend/index.html       estrutura da página
  ├─ frontend/styles.css       visual e adaptação para celular
  └─ frontend/client.ts        formulários e chamadas à API
             │ HTTP / JSON
             ▼
Node.js
  ├─ backend/server.ts         rotas HTTP
  ├─ backend/validators.ts     validação dos dados
  ├─ backend/agenda-service.ts regras e operações
  ├─ backend/database.ts       tabelas SQLite
  └─ backend/types.ts          formatos dos dados em TypeScript
             │
             ▼
         SQLite local
```

O projeto usa módulos nativos `node:http` e `node:sqlite`, para manter a estrutura enxuta. O compilador transforma TypeScript em JavaScript dentro de `dist/` antes de o servidor iniciar.

O campo de telefone aceita números brasileiros com DDD e mostra a formatação enquanto você digita. O valor do serviço é informado em centavos: digitar `5` mostra `R$ 0,05`; `35` mostra `R$ 0,35`; `3500` mostra `R$ 35,00`.

## 4. Arquivos importantes

- `frontend/index.html`: campos, títulos, listas e regiões da tela.
- `frontend/styles.css`: cores, espaçamento e regras para telas pequenas.
- `frontend/client.ts`: carrega e envia dados, atualiza a interface e mostra mensagens.
- `backend/server.ts`: recebe rotas como `/api/clients` e responde em JSON.
- `backend/validators.ts`: verifica nome, telefone, preço, duração e data.
- `backend/agenda-service.ts`: consultas, gravações e regra de conflito.
- `backend/database.ts`: cria tabelas e índices quando o servidor inicia.
- `backend/types.ts`: descreve os formatos de Cliente, Serviço e Agendamento.
- `backend/auth-service.ts`: cria contas, verifica senha e controla as sessões.
- `docs/02-backlog.md`: histórias e tarefas para o Jira.

## 5. Um pouco da sintaxe TypeScript

### Tipos para descrever dados

`interface` lista os campos esperados em um objeto:

```ts
interface Client {
  id: number;
  name: string;
  phone: string;
}
```

`number` é número, `string` é texto e `boolean` é verdadeiro ou falso. Os tipos ajudam o editor e o compilador a encontrar alguns erros antes de executar o programa.

### Funções e módulos

```ts
export function listClients() {
  return database.prepare("SELECT id, name, phone FROM clients").all();
}
```

`export` permite que outro arquivo use a função. `import` traz uma função ou tipo de outro arquivo. Isso divide o código em partes menores.

### Validar antes de gravar

```ts
if (!Number.isSafeInteger(durationMinutes) || durationMinutes <= 0) {
  throw new AppError("A duração deve ser um inteiro maior que zero.");
}
```

`if` verifica uma condição. `throw` interrompe a operação e devolve um erro compreensível; o servidor transforma esse erro em resposta para a tela.

O navegador usa `fetch` para enviar dados em JSON. O servidor valida o conteúdo e só então grava. Nas consultas SQL, `?` recebe os valores separadamente do comando.

## 6. Regras de negócio implementadas

- Cada agendamento está ligado a um cliente e a um serviço.
- O preço é inteiro em centavos e não pode ser negativo; a duração é inteira em minutos e deve ser maior que zero.
- O horário final é calculado pela duração do serviço.
- O calendário permite escolher o dia; os horários disponíveis são oferecidos em intervalos de 10 minutos, das 08:00 às 18:00. O atendimento deve terminar até as 18:00.
- Nome do serviço, preço, duração e dados do cliente são copiados para o atendimento para manter o histórico.
- O sistema reserva 10 minutos entre atendimentos; a lista de horários exclui conflitos e a API repete a validação antes de gravar.
- A verificação do conflito e a gravação ocorrem na mesma transação SQLite.
- Horários passados não são aceitos.
- Só um agendamento `scheduled` pode ser cancelado ou concluído.
- Cancelar libera o intervalo; concluir mantém o registro histórico.
- Cancelamentos ficam salvos, mas não aparecem como horários ativos na agenda.

### Regras pendentes

Os horários disponíveis estão configurados de 08:00 a 18:00. Os dias de funcionamento da semana e um fuso diferente do computador ainda não foram configurados. Edição de cadastros e testes automatizados também estão pendentes.

## 7. O que você precisa fazer no Jira

O quadro ainda não foi criado. A equipe precisa configurá-lo:

1. Crie um projeto/board **Agenda Fácil**. Um quadro Kanban é suficiente.
2. Crie as colunas **A fazer**, **Em andamento**, **Em revisão** e **Concluído**.
3. Cadastre as histórias **US01 a US07** da tabela em `docs/02-backlog.md`. Copie a descrição e os critérios de aceitação.
4. Marque prioridade alta para login, clientes, serviços, criação de reserva e agenda; prioridade média para cancelar e concluir. A equipe pode revisar a ordem.
5. Adicione tarefas para validar o problema com uma barbearia, definir expediente/fuso, preparar o protótipo e organizar a demonstração.
6. Atribua cada tarefa a alguém da equipe. Os nomes não foram informados; combinem quem assume cada papel.
7. Registre responsável, prazo, critério de conclusão e link do repositório. Quando houver protótipo, inclua o link compartilhável.
8. Compartilhe o quadro com o professor e confira que ele consegue acessar.

Papéis de referência: coordenação, frontend, backend, banco de dados, UX/UI, validação e documentação. Uma pessoa pode assumir mais de um papel. Registre os nomes em `docs/03-cronograma-e-equipe.md`.

## 8. Como funciona o acesso por conta

- O barbeiro configura a conta principal uma única vez nesta instalação e depois entra com e-mail e senha.
- O cliente cria uma conta com nome, telefone, e-mail e senha. Se o barbeiro já cadastrou o mesmo e-mail e telefone, a conta fica ligada àquele cadastro.
- Para que a reserva apareça para o cliente, o barbeiro deve cadastrar o cliente usando o e-mail e telefone informados no cadastro de cliente.
- O cliente só vê os próprios horários; não pode consultar a agenda geral nem alterá-los.
- As senhas são guardadas como hash scrypt; a sessão fica em cookie protegido HttpOnly e SameSite. O token de sessão não é salvo no navegador como texto legível.
- Não há verificação de posse do e-mail nem recuperação de senha. O sistema é para uso local de demonstração e não deve receber dados reais nem ser publicado na internet.

## 9. O que esta versão ainda não faz

- Login do barbeiro e do cliente funciona; recuperação de senha e confirmação de e-mail ainda não existem.
- Não confirma o e-mail do cliente nem recupera senha.
- Não permite editar ou excluir clientes e serviços.
- Não configura dias da semana fechados; os horários são oferecidos todos os dias entre 08:00 e 18:00.
- Não está pronta para publicação pública ou uso com dados reais.
- Não tem testes automatizados.

Transforme esses pontos em tarefas do backlog com responsável e critério de aceitação antes das próximas etapas.
