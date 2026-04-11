# Selu383.SP26.Api

## External authentication (Google/Facebook)

This API uses ASP.NET Core Identity with cookies. External providers are configured via `appsettings.json` or environment variables.

### Configuration

- **Google**
  - `Authentication__Google__ClientId`
  - `Authentication__Google__ClientSecret`
- **Facebook**
  - `Authentication__Facebook__AppId`
  - `Authentication__Facebook__AppSecret`

### Endpoints

- `GET /api/authentication/external/Google?returnUrl=/`
- `GET /api/authentication/external/Facebook?returnUrl=/`
- `GET /api/authentication/external-callback?returnUrl=/`

After successful login, the API sets the Identity auth cookie and redirects back to `returnUrl` with `?auth=success` (or `?auth=error`).

