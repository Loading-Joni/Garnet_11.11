#!/usr/bin/env python3
"""Собирает отзывы о клинике с Яндекс Карт в reviews.json для виджета на лендинге.

Запуск:  python3 tools/fetch_reviews.py [путь к reviews.json]
Если путь не указан, JSON печатается в stdout.
"""
import datetime
import html
import json
import re
import sys
import urllib.request

ORG_URL = "https://yandex.ru/maps/org/stomatologiya_garnet/241390063627/reviews/"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня",
          "июля", "августа", "сентября", "октября", "ноября", "декабря"]


def fetch(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "ru-RU,ru;q=0.9",
    })
    with urllib.request.urlopen(req, timeout=45) as resp:
        return resp.read().decode("utf-8", "replace")


def state_of(page):
    best = None
    for raw in re.findall(r'<script type="application/json"[^>]*>(.*?)</script>', page, re.S):
        for candidate in (raw, html.unescape(raw)):
            try:
                data = json.loads(candidate)
            except Exception:
                continue
            if isinstance(data, dict) and isinstance(data.get("stack"), list):
                if best is None or len(raw) > len(best[1]):
                    best = (data, raw)
            break
    return best[0] if best else None


def items_of(state):
    for layer in state.get("stack") or []:
        if not isinstance(layer, dict):
            continue
        res = layer.get("results")
        if isinstance(res, dict):
            res = res.get("items")
        if not isinstance(res, list):
            continue
        for item in res:
            if isinstance(item, dict):
                yield item


def ru_date(ts):
    try:
        d = datetime.datetime.strptime(ts[:10], "%Y-%m-%d")
        return "%d %s %d" % (d.day, MONTHS[d.month - 1], d.year)
    except Exception:
        return ""


def collect():
    seen = {}
    rating = None
    for page in range(1, 4):
        url = ORG_URL if page == 1 else ORG_URL + "?page=%d" % page
        state = state_of(fetch(url))
        if not state:
            break
        for item in items_of(state):
            if rating is None and isinstance(item.get("ratingData"), dict):
                rating = item["ratingData"]
            rr = item.get("reviewResults")
            if not isinstance(rr, dict):
                continue
            for rv in rr.get("reviews") or []:
                rid = rv.get("reviewId")
                if rid and rid not in seen:
                    seen[rid] = rv
            if not (rr.get("params") or {}).get("reviewsRemained"):
                break
        else:
            continue
        break

    reviews = []
    for rv in seen.values():
        text = (rv.get("text") or "").strip()
        if not text:
            continue
        author = rv.get("author") or {}
        reviews.append({
            "n": author.get("name") or "Пациент",
            "a": (author.get("avatarUrl") or "").replace("{size}", "islands-68"),
            "l": author.get("professionLevel") or "",
            "r": rv.get("rating") or 0,
            "d": ru_date(rv.get("updatedTime") or ""),
            "t": text,
            "_ts": rv.get("updatedTime") or "",
        })
    reviews.sort(key=lambda r: r["_ts"], reverse=True)
    for rv in reviews:
        rv.pop("_ts", None)

    payload = {
        "org": {
            "name": "Стоматология «Гарнет»",
            "oid": "241390063627",
            "url": "https://yandex.ru/maps/org/stomatologiya_garnet/241390063627/reviews/",
        },
        "rating": {
            "value": (rating or {}).get("ratingValue"),
            "count": (rating or {}).get("ratingCount"),
            "reviews": (rating or {}).get("reviewCount") or len(reviews),
        },
        "reviews": reviews,
    }
    return payload


def main():
    payload = collect()
    if not payload["reviews"]:
        sys.stderr.write("Отзывы не получены: пустой ответ Яндекс Карт.\n")
        return 1
    text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    if len(sys.argv) > 1:
        with open(sys.argv[1], "w", encoding="utf-8") as fh:
            fh.write(text)
        sys.stderr.write("Отзывов: %d, файл: %s\n" % (len(payload["reviews"]), sys.argv[1]))
    else:
        sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
