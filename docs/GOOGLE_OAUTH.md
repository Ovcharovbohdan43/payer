# Google OAuth (Sign in with Google)

## Почему на экране согласия Google показывается имя проекта Supabase?

При входе через Google пользователь видит домен Supabase (`*.supabase.co`), потому что запрос к Google идёт через OAuth-клиент Supabase. **Название приложения** на экране согласия задаётся в **Google Cloud Console**, а не в Supabase.

## Как показать имя своего сервиса (например, Puyer)

1. Откройте [Google Cloud Console](https://console.cloud.google.com/) и выберите проект, в котором создан OAuth 2.0 Client ID для Supabase.
2. Перейдите в **APIs & Services** → **OAuth consent screen** (Экран согласия OAuth).
3. В блоке **App information** задайте:
   - **App name** — название вашего сервиса (например, **Puyer**).
   - При необходимости: **User support email**, **App logo**, **Application home page**, **Privacy policy**, **Terms of service**.
4. Сохраните изменения.

После этого на экране «Вход через аккаунт Google» будет отображаться выбранное название приложения. Домен в URL по-прежнему будет supabase.co — это нормально, так как OAuth обрабатывает Supabase.

## Настройка провайдера в Supabase

- **Authentication** → **Providers** → **Google**: включите провайдер и укажите Client ID и Client Secret из Google Cloud (Credentials → OAuth 2.0 Client IDs).
- **Authorized redirect URIs** в Google Cloud для этого клиента должен содержать:  
  `https://<ваш-project-ref>.supabase.co/auth/v1/callback`
