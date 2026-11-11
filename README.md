# Garantias e Compras

Organizador local em **Node.js 20+**, sem dependências externas, para cadastrar compras e acompanhar prazos de garantia.

## Implementação nesta branch

- Cadastro de compras com ID, nome, loja, data de compra, prazo e valor em centavos.
- Validação de datas reais, incluindo anos bissextos, e rejeição de dados inválidos.
- Listagem ordenada por vencimento com pesquisa por ID, produto ou loja.
- Consulta de garantias vencidas, próximas de vencer e ainda válidas.
- Atualização e remoção por funções puras na biblioteca, com edição de compras pelo terminal.
- Resumo de prazos, valor total e próxima data de vencimento.
- Persistência **local** em JSON versionado, com gravação via arquivo temporário.
- Testes da biblioteca, armazenamento e comandos de terminal.
- Exportação CSV de compras e prazos para planilhas, com proteção contra fórmulas e sem incluir anotações de comprovantes.

**Limitações:** não faz upload de comprovantes, não envia notificações e não possui interface gráfica. O campo `receiptNote` registra somente uma anotação textual; nenhum documento é anexado. Este é um MVP de uso pessoal, não um serviço de nuvem.

## Executar

```bash
npm test
node src/cli.js help
```

Exemplo com **dados fictícios**:

```bash
node src/cli.js add compra-001 "Teclado sem fio" "Loja Exemplo" 2026-11-01 365 15990 "Recibo salvo localmente"
node src/cli.js add compra-002 "Mouse USB" "Loja Exemplo" 2026-10-01 90 4990
node src/cli.js list
node src/cli.js edit compra-001 product "Teclado sem fio compacto"
node src/cli.js edit compra-001 priceCents 14990
node src/cli.js list expiring
node src/cli.js list all Teclado
node src/cli.js expiring 60
node src/cli.js summary
node src/cli.js export-csv > garantias.csv
node src/cli.js remove compra-002
```

O valor `15990` representa **R$ 159,90** (centavos), evitando erros de digitação com vírgula e ponto. Datas seguem `AAAA-MM-DD` e prazos são dias corridos, até dez anos (3650 dias).

## Editar uma compra existente

Use `node src/cli.js edit ID CAMPO VALOR` para corrigir o cadastro sem excluir a compra:

```bash
node src/cli.js edit compra-001 seller "Nova Loja"
node src/cli.js edit compra-001 warrantyDays 730
node src/cli.js edit compra-001 priceCents 14990
```

Campos permitidos: `product`, `seller`, `purchaseDate`, `warrantyDays`, `priceCents` e `receiptNote`. O identificador (`id`) não pode ser alterado. Campos inválidos, números fora do limite, datas inexistentes e identificadores ausentes causam erro **sem gravar alterações** no JSON local. Valores monetários permanecem em centavos.

## Exportar planilha CSV

O comando abaixo escreve **CSV UTF-8** na saída padrão; o redirecionamento cria o arquivo **somente no seu computador**:

```bash
node src/cli.js export-csv > garantias.csv
```

O arquivo inclui ID, produto, vendedor, data da compra, dias de garantia, preço em centavos, vencimento, dias restantes e status. O campo de anotação do comprovante não é exportado. A saída segue a ordem de vencimento, com proteção contra fórmulas em células de texto. Preserve o CSV fora do repositório, pois contém dados comerciais.

## Onde os dados ficam

Por padrão, o catálogo é armazenado em:

```text
~/.gx-garantias/compras.json
```

É possível configurar outro caminho local usando a variável de ambiente `GX_WARRANTY_CATALOG`. O arquivo é criado com permissões restritas em sistemas compatíveis. Não envie catálogos reais ao GitHub; eles podem conter informações pessoais e comerciais.

## API de biblioteca

```js
import {
  addPurchase, listWarranties, summarizeWarranties,
} from './src/catalog.js';

const catalog = addPurchase([], {
  id: 'item-1',
  product: 'Notebook de teste',
  seller: 'Loja Fictícia',
  purchaseDate: '2026-11-01',
  warrantyDays: 365,
  priceCents: 250000,
});
console.log(listWarranties(catalog));
console.log(summarizeWarranties(catalog));
```

Funções de mutação retornam **novos arrays**, sem alterar a lista original. A compatibilidade da função antiga `daysUntilWarrantyExpires` foi mantida.

## Qualidade

```bash
npm test
```

O GitHub Actions executa os testes em pushes e pull requests. A branch principal permanece intacta até revisão e merge autorizado.

## Segurança e privacidade

Armazene recibos e dados reais apenas em ambiente controlado. Não há criptografia em repouso, contas de usuário ou backup automático. Evite sincronizar o JSON com repositórios públicos.

## Licença

Não definida.
