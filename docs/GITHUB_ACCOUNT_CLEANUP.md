# GitHub account cleanup — Ovcharovbohdan43

Пошаговая инструкция: оставить только репозитории **payer** и **desboard**, привести в порядок описание профиля и остальные настройки.

---

## Через консоль (GitHub CLI)

Всё можно сделать из терминала с помощью **GitHub CLI** (`gh`).

### 1. Установка GitHub CLI

- **Windows:** скачайте установщик с https://cli.github.com/ или, если есть winget: `winget install GitHub.cli`
- После установки перезапустите терминал.

### 2. Вход в аккаунт

```bash
gh auth login
```

Выберите GitHub.com → HTTPS → Yes (authenticate Git) → браузер или токен. Войдите под **Ovcharovbohdan43**.

### 3. Удаление репозиториев

Из корня проекта (или из любой папки) выполните:

```bash
gh repo delete Ovcharovbohdan43/consoleJsProject --yes
gh repo delete Ovcharovbohdan43/exgo --yes
gh repo delete Ovcharovbohdan43/hush_v2 --yes
gh repo delete Ovcharovbohdan43/ovcharovbohdan43.github.io --yes
```

Флаг `--yes` убирает запрос подтверждения. Без него `gh` спросит перед удалением.

### 4. Обновление профиля (описание, компания, сайт)

Одной командой:

```bash
gh api -X PATCH /user -f bio="WEB - developer, founder of Puyer" -f company="Puyer Ltd." -f location="Wales" -f blog="https://www.puyer.org/"
```

Или по отдельности (при необходимости измените значения):

```bash
gh api -X PATCH /user -f bio="WEB - developer, founder of Puyer"
gh api -X PATCH /user -f company="Puyer Ltd."
gh api -X PATCH /user -f location="Wales"
gh api -X PATCH /user -f blog="https://www.puyer.org/"
```

Имя профиля (Name):

```bash
gh api -X PATCH /user -f name="Bohdan Ovcharov"
```

### 5. Готовый скрипт

В репозитории есть скрипт `scripts/github-cleanup.ps1`. Запуск (из корня проекта):

```powershell
.\scripts\github-cleanup.ps1
```

Сначала выполните `gh auth login`, затем запустите скрипт.

---

## 1. Удаление лишних репозиториев (через браузер)

Оставить только:
- **payer**
- **desboard**

Удалить (на момент 2025-03-15):
- **consoleJsProject**
- **exgo**
- **hush_v2**
- **ovcharovbohdan43.github.io**

### Как удалить репозиторий

1. Откройте https://github.com/Ovcharovbohdan43 и войдите в аккаунт.
2. Перейдите в **Repositories** (или по прямой ссылке на репо, например `https://github.com/Ovcharovbohdan43/consoleJsProject`).
3. Откройте репозиторий → вкладка **Settings** (вверху справа).
4. Прокрутите вниз до блока **Danger Zone**.
5. Нажмите **Delete this repository**.
6. Введите полное имя репозитория (например `Ovcharovbohdan43/consoleJsProject`) и подтвердите удаление.

Повторите для каждого репо из списка на удаление.

---

## 2. Профиль и описание аккаунта

Текущие данные (уже заполнены):
- **Bio:** WEB - developer, founder of Puyer  
- **Company:** Puyer Ltd.  
- **Location:** Wales  
- **Website:** https://www.puyer.org/

### Редактирование профиля

1. https://github.com/Ovcharovbohdan43 → нажмите на свой аватар или **Edit profile** (справа).
2. Либо: https://github.com/settings/profile .

Заполните при необходимости:
- **Profile picture** — фото или логотип.
- **Name** — имя (например Bohdan Ovcharov).
- **Bio** — краткое описание (до 160 символов). Можно оставить текущее или изменить.
- **URL** — личный сайт или блог (если отличается от Puyer).
- **Company** — Puyer Ltd. (уже есть).
- **Location** — Wales (уже есть).
- **Website** — https://www.puyer.org/ (уже есть).
- **X (Twitter)** — при желании.
- **LinkedIn** — при желании.
- **YouTube** — при желании.

Сохраните изменения (**Save** внизу).

---

## 3. Дополнительные настройки (по желанию)

- **Profile README:** создать репо с именем **Ovcharovbohdan43** (совпадает с логином) и файлом `README.md` в корне — его содержимое будет отображаться на главной странице профиля. Можно добавить краткое приветствие, ссылки на Puyer и desboard.
- **Repositories:** для **payer** и **desboard** в Settings → General можно задать **Description** и **Website** (например, puyer.org для payer), чтобы репо выглядели аккуратно в списке.
- **Pinned repositories:** на странице профиля можно закрепить 6 репо — после удаления лишних закрепите payer и desboard (кнопка **Customize your pins**).

---

## 4. Краткий чеклист

- [ ] Удалён **consoleJsProject**
- [ ] Удалён **exgo**
- [ ] Удалён **hush_v2**
- [ ] Удалён **ovcharovbohdan43.github.io**
- [ ] Оставлены только **payer** и **desboard**
- [ ] Проверены/обновлены Bio, Company, Location, Website в профиле
- [ ] (Опционально) Добавлены описания и сайты для payer и desboard
- [ ] (Опционально) Закреплены репо на профиле

---

*Документ создан 2025-03-15. После выполнения очистки этот файл можно оставить в проекте как справку или удалить.*
