# Engenharia reversa e estudo — Garantias e Compras

## Objetivo e fluxo

Cadastro local de compras e vencimentos de garantias. catalog.js valida as compras e mantém operações de catálogo. warranty.js calcula o prazo, storage.js persiste e export.js gera CSV.

**Tecnologias identificadas** · JavaScript, Node.js.

**Revisão de referência** · `904c07e20392`.

## Mapa do código

| Caminho | Papel de leitura | Símbolos selecionados |
| --- | --- | --- |
| [src/catalog.js](../src/catalog.js) | Implementação | `parseCalendarDate`, `validatePurchase`, `validateCatalog`, `addPurchase`, `updatePurchase`, `removePurchase`, `getWarranty`, `listWarranties`, `summarizeWarranties` |
| [src/cli.js](../src/cli.js) | Ponto de leitura para entrada ou composição | `parseInteger`, `formatMoney`, `display`, `run` |
| [src/export.js](../src/export.js) | Implementação | `csvField`, `exportWarrantiesCsv` |
| [src/storage.js](../src/storage.js) | Implementação | `defaultCatalogPath`, `loadCatalog`, `saveCatalog` |
| [src/warranty.js](../src/warranty.js) | Implementação | `daysUntilWarrantyExpires` |

## Configuração e referências

Ambiente e dependências: [package.json](../package.json).

Referências existentes: [docs/GUIA_DE_VALIDACAO.md](GUIA_DE_VALIDACAO.md).

## Roteiro de estudo e desenvolvimento

1. Comece pelo fluxo descrito acima e localize seus pontos de entrada no mapa. Acompanhe uma entrada válida até a transformação ou a resposta.
2. Abra um teste relacionado ao fluxo e descreva qual regra ele protege. Compare o tratamento esperado para entradas válidas, inválidas e nos limites.
3. Ao adicionar uma regra, determine qual módulo controla o dado e cubra o caso nesse nível. Em seguida, confira o efeito no comando, na API ou na interface de entrada.

**Pergunta de entrevista**

Como deve se comportar um vencimento no próprio dia ao calcular dias restantes?

## Testes versionados

Arquivos para começar a leitura dos cenários de teste: [test/catalog.test.js](../test/catalog.test.js), [test/cli.test.js](../test/cli.test.js), [test/edit-cli.test.js](../test/edit-cli.test.js), [test/export.test.js](../test/export.test.js), [test/storage.test.js](../test/storage.test.js), [test/warranty.test.js](../test/warranty.test.js).

Os comandos e versões de runtime usados no CI ficam em [.github/workflows/ci.yml](../.github/workflows/ci.yml).

[Voltar ao README](../README.md).
