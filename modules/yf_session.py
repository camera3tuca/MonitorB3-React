"""Sessão compartilhada e downloads resilientes para o yfinance.

Centraliza, num único lugar, a estratégia para evitar o erro
``YFRateLimitError: Too Many Requests`` do Yahoo Finance:

  * Uma sessão HTTP única com impersonação de navegador via ``curl_cffi``
    (forma recomendada pelo yfinance para não ser bloqueado), reaproveitada
    por todos os módulos.
  * Um wrapper ``baixar()`` em volta de ``yf.download`` com retry e backoff
    exponencial + jitter especificamente nos erros de rate limit.

Tudo com degradação graciosa: se ``curl_cffi`` não existir, ou se a versão do
yfinance não aceitar o parâmetro ``session=``, o código cai de volta no
comportamento padrão sem quebrar.
"""

import time
import random

import yfinance as yf

# Sentinela: None = ainda não inicializado; False = sem sessão custom disponível.
_session = None


def get_session():
    """Retorna (e memoiza) uma sessão curl_cffi com impersonação de navegador.

    Retorna ``False`` se ``curl_cffi`` não estiver disponível, sinalizando que
    os downloads devem usar o comportamento padrão do yfinance.
    """
    global _session
    if _session is not None:
        return _session
    try:
        from curl_cffi import requests as cffi_requests
        _session = cffi_requests.Session(impersonate="chrome")
    except Exception:
        _session = False
    return _session


def criar_ticker(symbol):
    """Retorna um ``yf.Ticker`` usando a sessão com impersonação quando possível."""
    sess = get_session()
    if sess:
        try:
            return yf.Ticker(symbol, session=sess)
        except TypeError:
            return yf.Ticker(symbol)
    return yf.Ticker(symbol)


def _eh_rate_limit(exc):
    """Heurística para detectar erro de rate limit independente da versão do yfinance."""
    nome = type(exc).__name__.lower()
    msg = str(exc).lower()
    return (
        "ratelimit" in nome
        or "too many requests" in msg
        or "rate limit" in msg
        or "429" in msg
    )


def _download_once(tickers, **kwargs):
    """Chama yf.download usando a sessão custom quando possível."""
    sess = get_session()
    if sess:
        try:
            return yf.download(tickers, session=sess, **kwargs)
        except TypeError:
            # Versão do yfinance que não aceita `session=` (usa curl_cffi interno).
            return yf.download(tickers, **kwargs)
    return yf.download(tickers, **kwargs)


def baixar(tickers, *, max_tentativas=4, base_sleep=2.0, **kwargs):
    """yf.download resiliente: retry com backoff exponencial em rate limit.

    Aceita os mesmos kwargs de ``yf.download`` (period, interval, auto_adjust,
    progress, timeout, threads, ...). Retorna o DataFrame baixado, ou um
    DataFrame vazio se todas as tentativas falharem.

    Apenas erros de rate limit são repetidos; demais exceções sobem para o
    chamador tratar (ex.: ticker delisted).
    """
    import pandas as pd

    ultima_exc = None
    for tentativa in range(max_tentativas):
        try:
            return _download_once(tickers, **kwargs)
        except Exception as exc:  # noqa: BLE001
            ultima_exc = exc
            if not _eh_rate_limit(exc) or tentativa == max_tentativas - 1:
                if _eh_rate_limit(exc):
                    return pd.DataFrame()
                raise
            # Backoff exponencial com jitter: 2s, 4s, 8s (+/- aleatório).
            espera = base_sleep * (2 ** tentativa) + random.uniform(0, 1)
            time.sleep(espera)
    if ultima_exc is not None and _eh_rate_limit(ultima_exc):
        return pd.DataFrame()
    return pd.DataFrame()
