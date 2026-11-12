# Desenvolvimento e validação — Garantias de Compras

## Estado implementado

Núcleo JavaScript de controle de garantias de produtos, sem interface final.

## Estrutura relevante

`src/warranty.js`, `test/warranty.test.js`, `package.json`.

## Como reproduzir verificações

`npm test`.

Os exemplos devem usar entradas fictícias. Registrar explicitamente o que foi de fato executado no ambiente e comparar com o CI.

## Regressão prioritária

Cobrir datas inválidas, vencimento em ano bissexto, compra futura, garantia expirada, cobertura de limite e registro duplicado.

## Próximos limites a resolver

Manter cálculo isolado e testado antes de acrescentar avisos automáticos, anexos de nota fiscal e persistência.

## Revisão de contribuição

- [ ] Mudança melhora uma regra, teste ou integração real.
- [ ] Cenários de entrada, saída e erro estão documentados.
- [ ] Nada de dados pessoais, credenciais ou arquivos gerados versionados.
- [ ] PR separado antes de alterar a principal.
