# Headroom 実験利用ガイド

[English](./headroom-experimental.md)

Headroom は外部 proxy / SDK であり、TAKT builtin feature ではありません。また、TAKT は Headroom を必須としません。TAKT は、別途起動している local Headroom proxy へ、対応 provider の `base_url` 設定で routing できます。

## Headroom を別プロセスで起動する

Headroom の起動と運用は TAKT の外で行います。proxy は upstream provider へ転送するため、API key は引き続き必要です。

TAKT から routing する前に proxy を確認します。

```bash
curl http://127.0.0.1:8787/health
curl http://127.0.0.1:8787/stats
```

Headroom telemetry を opt out する必要がある場合は、Headroom の現在の案内に従います。

```bash
export HEADROOM_TELEMETRY=off
headroom proxy --no-telemetry
```

## TAKT provider を routing する

Claude headless と Claude SDK:

```yaml
provider_options:
  claude:
    base_url: http://127.0.0.1:8787
```

TAKT はこの値を `claude` と `claude-sdk` に `ANTHROPIC_BASE_URL` として渡します。

Codex:

```yaml
provider_options:
  codex:
    base_url: http://127.0.0.1:8787/v1
```

TAKT はこの値を Codex SDK constructor の `baseUrl` として渡します。`OPENAI_BASE_URL` など provider-native env の挙動は provider 依存です。workflow routing を明示したい場合は TAKT の `provider_options.codex.base_url` を優先してください。

Cursor は Headroom の `base_url` routing に**対応していません**。`cursor-agent` CLI には API endpoint を上書きする env / CLI フラグがありません（`--endpoint` / `--base-url` は未提供。公式に記載されている env は proxy / CA / config パス系のみ）。Cursor は Cursor 独自バックエンドと通信するため、Headroom が前段に立てる OpenAI / Anthropic 互換の終端 proxy にはなりません。`provider_options.cursor.base_url` を設定しても効果はありません。workflow YAML の `provider_options` は strict schema のため未知キーとして拒否され、global/project の `config.yaml` の `provider_options` では未知キーはサイレントに strip されます（エラーも routing も起きません）。`HTTP_PROXY` / `HTTPS_PROXY` を代替にしないでください。これらは transport 層のフォワードプロキシであり、Headroom が想定する API base URL の差し替えではありません。

workflow と project config の `base_url` は loopback host に限定されます。これは TAKT が `127.0.0.1:8787` などの local proxy に接続する Headroom 想定に合わせた制限です。非 loopback の proxy endpoint は global config または TAKT env からのみ設定してください。

## 制限

短い prompt や code-heavy な prompt では、圧縮効果が小さい場合があります。品質も変わる可能性があるため、token 総量だけでなく、出力内容と review loop 回数も比較してください。

## 導入前後を計測する

TAKT の phase usage events を比較します。

```bash
npm run analyze:usage -- .takt/runs/<baseline-run>
npm run analyze:usage -- .takt/runs/<headroom-run>
```

run 前後の Headroom `/stats` も比較してください。retry や review reject を増やさずに総コストまたは時間が下がる場合だけ proxy を採用します。
