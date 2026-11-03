# Garantias e Compras

Biblioteca em **JavaScript (Node.js 20+)** para consultar prazos de garantia e identificar compras próximas do vencimento.

## Funcionalidades

- `daysUntilWarrantyExpires(purchaseDate, warrantyDays, today)` devolve a data de expiração, dias restantes e indicador de garantia vencida.
- `upcomingWarrantyExpirations(purchases, today, withinDays = 30)` retorna apenas compras com garantia vencendo entre hoje e os próximos `withinDays` dias, ordenadas por proximidade e ID.
- Usa a **data de calendário em UTC** para definir os dias restantes, evitando que algumas horas de diferença sejam contadas como um dia inteiro. O intervalo máximo da garantia e da consulta é 3.650 dias.
- Valida entradas, relógio, IDs duplicados, datas inválidas e tamanho da coleção (até 10 mil compras).

## Exemplo

```js
import { upcomingWarrantyExpirations } from './src/warranty.js';

const today = new Date('2026-11-03T12:00:00Z');
const purchases = [
  { id: 'notebook-1', purchaseDate: '2026-10-04', warrantyDays: 30 },
  { id: 'monitor-1', purchaseDate: '2026-10-20', warrantyDays: 90 },
];
const due = upcomingWarrantyExpirations(purchases, today, 7);
console.log(due.map(({ id, remainingDays }) => ({ id, remainingDays })));
// [{ id: 'notebook-1', remainingDays: 0 }]
```

## Testes

```bash
npm test
```

O GitHub Actions executa os testes de ordenação, limites, entradas inválidas e datas de calendário em pushes e pull requests.

## Limitações

É um **núcleo de domínio**, sem cadastro persistente, upload de notas fiscais, notificações, bancos de dados ou regras legais específicas. As datas são comparadas por dia **UTC**; aplicativos voltados a consumidores no Brasil deverão escolher conscientemente o fuso de calendário e as regras contratuais de vencimento. As compras usadas nos exemplos são fictícias. Não versionar comprovantes ou dados pessoais.

Licença: ainda não definida.
