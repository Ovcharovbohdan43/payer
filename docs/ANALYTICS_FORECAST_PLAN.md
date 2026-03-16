# План: Простая аналитика и прогноз денег (фича 6)

## Цель

Расширить дашборд и Financial overview: **выручка за период**, **ожидаемые поступления** (sent/overdue), **разбивка по клиентам**, опционально **«деньги в пути»** (ожидаемые payouts от Stripe). Использовать существующие графики — добавить к части из них дополнительные серии (например соотношение оплаченных к неоплаченным, несколько полос на одном графике).

---

## Текущая реализация (кратко)

### Главный дашборд (`/dashboard`)

- **KPI-карточки:** Revenue this month, Money owed (unpaid), Overdue, Paid out. Данные из `computeDashboardStats(invoices, currency)` и таблица `payouts` (сумма за всё время в default currency).
- **Ссылки:** ведут на `/dashboard/analytics#revenue`, `#invoices`, `#payouts`.
- **Ниже:** кнопка Create Invoice, блок Recent Invoices и Activity feed.

### Страница Financial overview (`/dashboard/analytics`)

- **Revenue:** три блока (This week, This month, All time) + **RevenueChart** — AreaChart по неделям (последние 8 недель), одна серия `revenue` (оплаченные инвойсы).
- **Invoices:** четыре блока (Paid, Unpaid, Overdue, Payment success %) + два графика:
  - **InvoiceBarChart** — BarChart по статусам: три столбца (Paid, Unpaid, Overdue) по **количеству** инвойсов.
  - **InvoiceDonutChart** — круг Paid vs Unpaid по **суммам**.
- **Business metrics:** Clients, Offers, Accepted/Declined.
- **Payouts:** **PayoutsChart** — AreaChart по неделям (сумма выплат за неделю) + список последних 20 payouts с датой и arrival_date.

### Источники данных

- **lib/dashboard/stats.ts** — `computeDashboardStats(invoices, defaultCurrency)`: unpaidSumCents, unpaidCount, paidThisMonthCents, paidThisMonthCount, overdueCount, overdueSumCents. Только инвойсы в default currency.
- **lib/dashboard/analytics.ts** — `computeAnalytics(invoices, clientCount, offerCount, …, payouts, defaultCurrency)`: выручка по неделям, paid/unpaid/overdue counts и sums, revenueByWeek, payoutsByPeriod. Инвойсы уже содержат `client_name`, `status`, `paid_at`, `due_date`, `amount_cents`, `vat_included`.
- **payouts:** `amount_cents`, `currency`, `created_at`, `arrival_date` (может быть null или в будущем — «ещё не пришло»).

### Графики (Recharts)

- **RevenueChart** — один `Area` по `revenueByWeek` (revenue в единицах валюты).
- **InvoiceBarChart** — один `Bar` dataKey="count", три категории (Paid/Unpaid/Overdue), цвет по категории.
- **InvoiceDonutChart** — два сегмента (Paid, Unpaid) по суммам.
- **PayoutsChart** — один `Area` по payoutsByPeriod (amount).

---

## Требования фичи 6

1. **Выручка за период** — уже есть (неделя/месяц/всё время + график по неделям). При желании добавить выбор периода (например последние 30/90 дней) — опционально.
2. **Ожидаемые поступления** — разбить «Money owed» на:
   - **Expected (sent/viewed)** — неоплаченные со статусом sent или viewed (ожидаемые к поступлению).
   - **Overdue** — уже есть отдельно.
   Или оставить одну карточку «Money owed» и под ней подпись/тултип «в т.ч. overdue …». В плане: явно показывать ожидаемые (sent/viewed) и overdue отдельно на дашборде или в аналитике.
3. **Разбивка по клиентам** — новый блок: по каким клиентам сколько выручки и/или сколько задолженности (unpaid/overdue). Таблица или барчарт: клиент → сумма (paid за период или unpaid). Данные: группировка инвойсов по `client_name` (или client_id при наличии).
4. **«Деньги в пути» (опционально)** — сумма payouts, у которых `arrival_date` в будущем или null (отправлены в банк, но ещё не зачислены). Одна карточка или строка «In transit» на странице Payouts.
5. **Расширение графиков** — на одном графике несколько полос/серий:
   - **Revenue по неделям:** добавить вторую серию — например «Expected» (unpaid по дате отправки/долга за эту неделю) или оставить только revenue; либо сделать **stacked bar по неделям**: Paid vs Unpaid (по неделям: сколько оплатили в неделю N и сколько было unpaid на конец недели N — сложнее). Простой вариант: **две серии на RevenueChart** — `revenue` (paid) и `expected` (сумма unpaid инвойсов, у которых sent_at в этой неделе — «ожидаемые из этой недели»). Или проще: один график «Revenue & expected by week» — столбцы: по оси X недели, два столбца на неделю — Paid (revenue) и Unpaid (сумма неоплаченных с sent_at в этой неделе).
   - **Invoices:** уже есть Bar (counts) и Donut (amounts). Можно заменить Bar на **stacked bar** по суммам: один столбец «Paid» (paidSumCents), один «Unpaid» (unpaidSumCents), один «Overdue» (overdueSumCents) — три полосы по сумме вместо трёх по количеству; или оставить два графика и добавить третий — «By week: paid vs unpaid amount» (по неделям две серии). Рекомендация: добавить на тот же BarChart вторую ось или второй набор столбцов — **по суммам** (Paid sum, Unpaid sum, Overdue sum) рядом с количеством, либо сделать один комбинированный график «Invoices by status» с двумя группами баров: count и amount (два Bar с разными dataKey и stackId или group).
   Конкретизация: **график с несколькими полосами** — например один BarChart по неделям: для каждой недели два столбца — «Paid» (выручка за неделю) и «Unpaid» (сумма неоплаченных, созданных или отправленных в эту неделю). Либо на текущем Invoice Bar — три столбца по статусам, но каждый столбец показывает и количество, и сумму (tooltip), а визуально — две полосы в одном столбце (stacked: одна часть — count, вторая — не подходит из-за разных единиц). Проще всего: **новый график «Revenue vs expected by week»** — BarChart, по оси X недели, две серии столбцов: revenue (paid) и expectedUnpaid (сумма unpaid с sent_at в этой неделе). Так «на графике несколько полос» реализуется без ломания текущих карточек.

---

## План работ по шагам

### Фаза 1: Ожидаемые поступления и «деньги в пути»

1. **Разделение ожидаемых и overdue**
   - В `computeDashboardStats` и/или `computeAnalytics`: ввести явно `expectedSumCents` (unpaid со статусом sent или viewed) и оставить `overdueSumCents`. На главном дашборде: либо две карточки «Expected» и «Overdue», либо одна «Money owed» с подписью «Expected … / Overdue …» внутри или под значением.
   - Опционально: в аналитике в блоке Invoices уже есть Paid / Unpaid / Overdue; можно добавить подразбивку Unpaid на Expected (sent+viewed) и отдельно показать Overdue (уже есть). Итого: добавить в данные `expectedSumCents` (sent+viewed, не overdue) и при необходимости отобразить в UI.

2. **«Деньги в пути» (payouts in transit)**
   - В выборке payouts учитывать `arrival_date`. Вычислить сумму payouts в default currency, у которых `arrival_date > today` или `arrival_date is null` (отправлены, но ещё не пришли). Добавить в аналитику поле `payoutsInTransitCents` и вывести на странице Payouts: карточка или строка «In transit» с этой суммой.

### Фаза 2: Разбивка по клиентам

3. **Агрегаты по клиентам**
   - В `computeAnalytics` (или отдельная функция) по списку инвойсов построить:
     - **Revenue by client** — для каждого `client_name` сумма paid инвойсов в default currency (за выбранный период или all time).
     - **Unpaid by client** — для каждого client_name сумма unpaid инвойсов в default currency.
   - Учесть дубликаты имён: группировать по `client_name` (и при наличии по `client_id` для точности). Тип: `{ clientName: string; clientId?: string; paidCents: number; unpaidCents: number }[]`. Сортировка по paid или unpaid по убыванию.

4. **UI: блок «By client»**
   - На странице Financial overview новый блок (секция) «Revenue / Unpaid by client»: таблица или компактный барчарт (горизонтальные бары по клиентам, сумма). Ограничение: топ-10 клиентов по выручке или по задолженности; ссылка «View all» на фильтр по клиенту в списке инвойсов при желании.

### Фаза 3: Графики с несколькими полосами

5. **Revenue по неделям: две серии**
   - Расширить `revenueByWeek`: добавить поле `expectedCents` или `expected` (сумма unpaid инвойсов с `sent_at` в этой неделе, в единицах валюты). В `computeAnalytics` при формировании revenueByWeek для каждой недели считать также сумму неоплаченных с sent_at в этой неделе.
   - **RevenueChart** переделать в BarChart с двумя сериями: `revenue` (Paid) и `expected` (Expected unpaid) по неделям — два столбца на каждую неделю. Либо оставить Area для revenue и добавить вторую линию/область для expected. Цвета: Paid — зелёный/синий, Expected — янтарный.

6. **Или: комбинированный график Invoices по суммам**
   - Добавить в секцию Invoices барчарт по **суммам** (Paid sum, Unpaid sum, Overdue sum) — три полосы, те же цвета что в Donut. Так на одном графике будут и существующий «Counts by status» (по количеству), и новый «Amounts by status» (по суммам). Либо один BarChart с двумя осями (сложнее), либо два ряда баров: один ряд — count, второй — amount в условных единицах (например amount/1000). Рекомендация: отдельный небольшой BarChart «Amounts by status» (три столбца: Paid, Unpaid, Overdue в валюте) — визуально «несколько полос» (три столбца с разными цветами).

### Фаза 4: Выручка за период (опционально)

7. **Выбор периода**
   - Опционально: селект «Last 7 / 30 / 90 days» для блоков Revenue и, при наличии, для «Revenue by client». По умолчанию оставить текущее поведение (this week / this month / all time). При наличии периода — фильтровать `paid_at` по выбранному диапазону.

---

## Порядок внедрения (рекомендуемый)

| Шаг | Задача | Зависимости |
|-----|--------|-------------|
| 1 | expectedSumCents (sent+viewed) в stats и analytics; отобразить на дашборде/аналитике | Нет |
| 2 | payoutsInTransitCents и блок «In transit» в секции Payouts | Нет |
| 3 | Агрегаты по клиентам (revenue + unpaid by client_name) в analytics | Нет |
| 4 | Блок «By client» на странице аналитики (таблица или барчарт) | Шаг 3 |
| 5 | Revenue по неделям: вторая серия «Expected» или BarChart Paid vs Expected | Шаг 1 |
| 6 | BarChart «Amounts by status» (три полосы по сумме) в секции Invoices | Нет |
| 7 | Опционально: выбор периода для выручки | После 5–6 |

---

## Технические детали

- **Ожидаемые (expected):** инвойсы с `status IN ('sent', 'viewed')`, не void, не paid. Overdue считаем отдельно (`status = 'overdue'` или due_date &lt; today). Тогда expectedSumCents = сумма по неоплаченным sent/viewed в default currency.
- **Payouts in transit:** `arrival_date IS NULL OR arrival_date > CURRENT_DATE`, сумма `amount_cents` в default currency.
- **По клиентам:** группировка по `client_name`; при наличии `client_id` можно группировать по нему для объединения одинаковых имён. InvoiceRow уже содержит client_name.
- **Графики:** Recharts BarChart с несколькими `<Bar dataKey="…" />` даёт несколько полос (grouped или stacked). Tooltip показывать для обеих серий.

---

## Риски и ограничения

- **Мультивалютность:** все суммы в default currency; инвойсы в другой валюте не попадают в агрегаты (как и сейчас).
- **Производительность:** при большом числе инвойсов группировка по клиентам и расчёт по неделям — в памяти; при росте данных можно перенести в RPC или материализованное представление.
- **Имена клиентов:** дубликаты (разные клиенты с одинаковым именем) склеятся при группировке по имени; при наличии client_id группировать по нему.

---

## Версия

- 2025-03-18 — Фаза 4 внедрена: выбор периода (All time / Last 7 / 30 / 90 days) через searchParams; computeAnalytics принимает periodDays, возвращает revenueInPeriodCents и periodDays, фильтрует revenueByWeek и revenueByClient (paid за период); на странице аналитики — переключатель периода и условный блок Revenue + подпись в By client.
- 2025-03-18 — Фаза 3 внедрена: revenueByWeek расширен полем expected (unpaid с sent_at в неделе); RevenueChart переведён на BarChart с двумя сериями (Paid, Expected); добавлен InvoiceAmountsBarChart «Amounts by status» (три столбца по сумме) в секции Invoices.
- 2025-03-18 — Фаза 2 внедрена: агрегаты по клиентам в computeAnalytics (revenueByClient: clientName, paidCents, unpaidCents); секция «Revenue / Unpaid by client» на странице аналитики — таблица топ-10, ссылка «View all clients».
- 2025-03-18 — Фаза 1 внедрена: expectedSumCents/expectedCount (unpaid со статусом sent/viewed) в computeDashboardStats и computeAnalytics; на дашборде карточка «Money owed» заменена на «Expected»; в аналитике добавлен блок Expected в секции Invoices; payoutsInTransitCents и блок «In transit» в секции Payouts (показывается при сумме > 0).
- 2025-03-18 — Первая версия плана после анализа дашборда, analytics и графиков (stats, computeAnalytics, RevenueChart, InvoiceBarChart, InvoiceDonutChart, PayoutsChart).
