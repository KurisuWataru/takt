# Experimental Headroom Proxy Usage

[日本語](./headroom-experimental.ja.md)

Headroom is an external proxy / SDK. It is not a builtin TAKT feature, and TAKT does not require Headroom. TAKT can route supported providers to a separately running local Headroom proxy through provider `base_url` settings.

## Run Headroom Separately

Start and operate Headroom outside TAKT. API keys are still required because the proxy forwards requests to upstream providers.

Check the proxy before routing TAKT through it:

```bash
curl http://127.0.0.1:8787/health
curl http://127.0.0.1:8787/stats
```

If you need to opt out of Headroom telemetry, follow Headroom's current guidance, such as:

```bash
export HEADROOM_TELEMETRY=off
headroom proxy --no-telemetry
```

## Route TAKT Providers

For Claude headless and Claude SDK:

```yaml
provider_options:
  claude:
    base_url: http://127.0.0.1:8787
```

TAKT passes this to `claude` and `claude-sdk` as `ANTHROPIC_BASE_URL`.

For Codex:

```yaml
provider_options:
  codex:
    base_url: http://127.0.0.1:8787/v1
```

TAKT passes this to the Codex SDK constructor as `baseUrl`. Provider-native env behavior such as `OPENAI_BASE_URL` remains provider-dependent; prefer TAKT `provider_options.codex.base_url` when you want explicit workflow routing.

Cursor is **not** supported for Headroom `base_url` routing. The `cursor-agent` CLI has no env or CLI flag to override the API endpoint (`--endpoint` / `--base-url` are absent; documented env covers proxy/CA/config paths only). Cursor talks to Cursor's own backend, not an OpenAI/Anthropic-compatible terminal that Headroom can sit in front of. Setting `provider_options.cursor.base_url` has no effect: workflow YAML `provider_options` uses a strict schema and rejects the unknown key, while global/project `config.yaml` `provider_options` strips unknown keys silently (no error, no routing). Do not use `HTTP_PROXY` / `HTTPS_PROXY` as a substitute: those are transport forward proxies and do not replace the API base URL the way Headroom expects.

Workflow and project config `base_url` values are limited to loopback hosts. This fits the intended Headroom setup, where TAKT talks to a local proxy such as `127.0.0.1:8787`. Configure non-loopback proxy endpoints from global config or TAKT env only.

## Limitations

Short prompts and code-heavy prompts may benefit little from compression. Quality can also change, so compare outputs and review loop counts, not only token totals.

## Measure Before and After

Compare TAKT phase usage events with:

```bash
npm run analyze:usage -- .takt/runs/<baseline-run>
npm run analyze:usage -- .takt/runs/<headroom-run>
```

Also compare Headroom `/stats` before and after a run. Keep the proxy only if it lowers total cost or time without increasing retries or rejected reviews.
