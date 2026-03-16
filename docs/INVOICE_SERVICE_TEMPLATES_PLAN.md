# План: Шаблоны инвойсов и сервисов (фича 5)

## Цель

Сохранять **услугу** (одну строку) или **набор строк** как шаблон и подставлять в новый инвойс в один клик. Киллер-фича: сильно ускоряет создание счетов для повторяющихся работ.

---

## Текущая реализация (кратко)

### Инвойс и строки

- **Таблица:** `invoice_line_items` — `id`, `invoice_id` (FK → invoices), `description`, `amount_cents`, `sort_order`, `discount_percent`. Одна запись = одна строка счёта.
- **Создание инвойса:** форма `NewInvoiceForm` (`app/invoices/new/new-invoice-form.tsx`) — состояние `lineItems: LineItemInput[]` (id, description, amount, discountPercent). Перед отправкой сериализуется в JSON и передаётся в `createInvoiceAction` как `lineItems`.
- **Валидация:** `lib/validations/index.ts` — `lineItemSchema`: description (1–1000 символов), amount (число), discountPercent (0–100). `invoiceCreateSchema` требует массив `lineItems` минимум из одного элемента.
- **Действие:** `app/invoices/actions.ts` — `createInvoiceAction`: вставка в `invoices`, затем вставка в `invoice_line_items` по одному ряду на элемент (invoice_id, description, amount_cents, discount_percent, sort_order).
- **Редактирование:** `edit-invoice-form.tsx` — те же `LineItemInput`, загрузка из `invoice.line_items`; обновление инвойса перезаписывает `invoice_line_items` (удаление старых, вставка новых по текущему состоянию формы).
- **Офферы:** отдельная таблица `offer_line_items` (та же структура: description, amount_cents, discount_percent, sort_order). Шаблоны в первой итерации только для инвойсов; при желании потом можно расширить на офферы.

### Клиенты как аналогия

- **Список:** `listClients()` в `app/clients/actions.ts`, выборка по `user_id`.
- **UI:** `ClientAutocomplete` — поиск/выбор существующего или «добавить нового». Шаблоны можно показывать аналогично: список сохранённых шаблонов + «Применить» или выбор из выпадающего списка.

### Нет сохранённых наборов строк

- Сейчас нет таблиц/полей для «сохранённых услуг» или «шаблонов инвойса». Каждый новый инвойс начинается с одной пустой строки или ручного ввода/копирования.

---

## Модель данных

### Вариант A (рекомендуемый): один тип — «шаблон инвойса» (набор строк)

- **Таблица `invoice_templates`**
  - `id` uuid PK
  - `user_id` uuid NOT NULL → auth.users (RLS: только свой user_id)
  - `name` text NOT NULL (например «Консультация 1ч», «Пакет: дизайн + вёрстка»)
  - `created_at` timestamptz DEFAULT now()

- **Таблица `invoice_template_items`**
  - `id` uuid PK
  - `template_id` uuid NOT NULL → invoice_templates(id) ON DELETE CASCADE
  - `description` text NOT NULL
  - `amount_cents` bigint NOT NULL CHECK (amount_cents >= 0)
  - `discount_percent` smallint NOT NULL DEFAULT 0 CHECK (0–100)
  - `sort_order` int NOT NULL DEFAULT 0

Одна строка в счёте = шаблон с одним item; несколько строк = шаблон с несколькими items. Один набор таблиц покрывает и «одну услугу», и «целый набор».

### Вариант B: отдельно «одна услуга» и «набор»

- Отдельно `service_templates` (user_id, name, description, amount_cents, discount_percent) и `invoice_templates` + `invoice_template_items`. Усложняет модель и UI (два типа шаблонов). Не рекомендуется в первой итерации.

### RLS и индексы

- RLS на `invoice_templates`: SELECT/INSERT/UPDATE/DELETE только где `user_id = auth.uid()`.
- RLS на `invoice_template_items`: через существование шаблона с тем же user_id (политика через JOIN с invoice_templates).
- Индексы: `invoice_templates(user_id)`, `invoice_template_items(template_id)`.

---

## Сценарии использования

1. **Сохранить текущие строки как шаблон**  
   На странице создания/редактирования инвойса: кнопка «Сохранить как шаблон». Ввод имени → создаётся запись в `invoice_templates` и N записей в `invoice_template_items`. Если одна строка — шаблон из одной услуги; если несколько — шаблон «пакета».

2. **Применить шаблон при создании инвойса**  
   На странице «Новый инвойс»: блок «Или выберите шаблон» — список/селект сохранённых шаблонов. По выбору подставляются строки в форму (заполняется `lineItems`), пользователь может править и отправить.

3. **Управление шаблонами**  
   Список шаблонов (имя + превью строк), удаление (и при необходимости переименование). Место: либо только на странице создания инвойса (выпадающий список + «Управление шаблонами» → модалка/отдельная страница), либо дополнительно раздел в Settings.

---

## План работ по шагам

### Фаза 1: БД и API шаблонов

1. **Миграция**
   - Создать `invoice_templates` и `invoice_template_items`, RLS, индексы, комментарии.
   - Нумерация: следующая после последней миграции (например `20250318000001_invoice_templates.sql`).

2. **Серверные действия (actions)**
   - `listInvoiceTemplates(userId)` — список шаблонов с items для текущего user (для селекта и превью).
   - `getInvoiceTemplate(id, userId)` — один шаблон с items (для применения).
   - `createInvoiceTemplate(userId, name, items[])` — создать шаблон и его items; items: `{ description, amount_cents, discount_percent }[]`.
   - `deleteInvoiceTemplate(id, userId)` — удалить шаблон (cascade удалит items).
   - Опционально: `renameInvoiceTemplate(id, userId, name)` — обновить имя.

3. **Типы**
   - `InvoiceTemplateRow` — id, user_id, name, created_at; при необходимости с полем `items` для выборки «шаблон + строки».
   - `InvoiceTemplateItemRow` — id, template_id, description, amount_cents, discount_percent, sort_order. Формат при применении к форме совпадает с `InvoiceLineItem`/LineItemInput (description, amount в «крупных» единицах для формы, discountPercent).

---

### Фаза 2: UI — сохранение как шаблон

4. **Кнопка «Сохранить как шаблон»**
   - На странице создания инвойса (`new-invoice-form.tsx`): рядом с «Add service» или под блоком Services. Видна, когда есть хотя бы одна заполненная строка (description не пустой, amount задан).
   - По клику: модалка или inline поле «Название шаблона» → вызов `createInvoiceTemplate` с текущими `lineItems` (преобразовать amount в cents). После успеха — toast «Шаблон сохранён», закрыть модалку; при ошибке — показать ошибку.

5. **На странице редактирования инвойса**
   - Аналогичная кнопка «Сохранить строки как шаблон» в `edit-invoice-form.tsx`: из текущего состояния `lineItems` создать шаблон.

---

### Фаза 3: UI — применение шаблона

6. **Блок «Или выберите шаблон» на странице нового инвойса**
   - Над или под блоком Services: заголовок + выпадающий список (или список карточек) сохранённых шаблонов. Загрузка через `listInvoiceTemplates()` на сервере (страница new) и передача в форму как props (или через серверный компонент + клиентский селект).
   - При выборе шаблона: загрузить items (если ещё не в списке) и вызвать в форме `setLineItems(itemsInFormFormat)` — преобразовать amount_cents → amount (строка для инпута), discount_percent → discountPercent. Заменить текущие строки или добавить к существующим (по продукту: обычно «заменить»).

7. **Управление шаблонами**
   - В выпадающем списке или отдельной модалке: для каждого шаблона — имя, краткое превью (первая строка или «N услуг»), кнопка «Удалить». Опционально «Переименовать». Список без пагинации приемлем для старта; при росте — лимит 50–100 и «Показать ещё».

---

### Фаза 4: Документация и краевые случаи

8. **Валидация и лимиты**
   - Имя шаблона: не пустое, разумная длина (например 200 символов). Количество строк в шаблоне: минимум 1, максимум например 50 (защита от злоупотреблений).
   - При применении шаблона форма уже содержит валидный набор строк; при отправке инвойса действует существующий `invoiceCreateSchema`.

9. **Документация**
   - Обновить `docs/DATABASE.md`: новые таблицы, назначение.
   - Краткий раздел в `docs/CHANGELOG.md` или отдельный `docs/INVOICE_TEMPLATES.md`: как сохранять шаблон, как применять, где управлять. При желании — пункт в Help («Как использовать шаблоны инвойсов»).

10. **Часовые пояса и валюта**
    - Шаблон хранит только строки (описание, сумма в центах, скидка). Валюта и прочие параметры инвойса задаются при создании счёта. Один и тот же шаблон можно использовать с любой валютой (суммы интерпретируются в выбранной валюте).

---

## Порядок внедрения (рекомендуемый)

| Шаг | Задача | Зависимости |
|-----|--------|-------------|
| 1 | Миграция: invoice_templates, invoice_template_items, RLS | Нет |
| 2 | listInvoiceTemplates, getInvoiceTemplate, createInvoiceTemplate, deleteInvoiceTemplate | Шаг 1 |
| 3 | Кнопка «Сохранить как шаблон» на new + edit форме | Шаг 2 |
| 4 | Блок выбора шаблона на странице нового инвойса + применение в форму | Шаг 2 |
| 5 | Удаление (и опционально переименование) в UI | Шаг 2 |
| 6 | Документация и лимиты/валидация | После 3–5 |

---

## Риски и ограничения

- **Дублирование кода форм:** new-invoice-form и edit-invoice-form оба работают с `lineItems`. Логику «строки формы ↔ items шаблона» вынести в один хелпер (например `templateItemsToLineInputs`, `lineInputsToTemplateItems`), чтобы не расходиться с полями (discountPercent и т.д.).
- **Конфликт с пустой формой:** при «Применить шаблон» перезаписать текущие строки — явное поведение (подтверждение при наличии введённых данных по желанию продукта).
- **Офферы:** позже можно добавить `offer_templates` по той же схеме или общий «шаблон строк» с типом (invoice/offer), если понадобится единый список шаблонов для обоих потоков.

---

## Версия

- 2025-03-18 — Фаза 4 внедрена: документация (INVOICE_TEMPLATES.md), пункт в Help «How do invoice templates work?», запись в CHANGELOG; валидация и лимиты уже были в createInvoiceTemplate (имя 200 символов, 1–50 строк).
- 2025-03-18 — Фаза 3 внедрена: на странице нового инвойса загрузка шаблонов (listInvoiceTemplates), блок «Use a template» (Select + «Manage templates»); применение шаблона подставляет строки в форму (замена); модалка «Manage templates» — список шаблонов с кнопкой Delete, после удаления router.refresh().
- 2025-03-18 — Фаза 2 внедрена: кнопка «Save as template» на странице создания и редактирования инвойса; модалка с полем «Template name» и вызов createInvoiceTemplate; кнопка видна при наличии хотя бы одной заполненной строки (description + amount).
- 2025-03-18 — Фаза 1 внедрена: миграция invoice_templates + invoice_template_items, RLS; actions listInvoiceTemplates, getInvoiceTemplate, createInvoiceTemplate, deleteInvoiceTemplate, renameInvoiceTemplate в app/invoices/template-actions.ts. DATABASE.md обновлён.
- 2025-03-18 — Первая версия плана после анализа таблиц invoice_line_items, форм new/edit и потока создания инвойса.
