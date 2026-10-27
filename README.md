# gjanas.com

Strona osobista na [Hugo](https://gohugo.io/) z motywem [Beautiful Hugo](https://github.com/halogenica/beautifulhugo) (git submodule w `themes/beautifulhugo`). Deploy: GitHub Actions → GitHub Pages, przy każdym pushu na `master` (`.github/workflows/deploy.yml`).

Hugo działa wyłącznie w Dockerze — ten sam obraz lokalnie i w CI:

```
ghcr.io/gohugoio/hugo:v0.168.0@sha256:1fb8fe7f417abd5802d86747d297728aa48078d763159e7dff6559fe3f8bb8e7
```

`hugo-docker-entrypoint.sh` jest uruchamiany przez obraz automatycznie (ustawia `safe.directory` dla gita).

## Pierwsze uruchomienie

```bash
git clone --recurse-submodules git@github.com:gjanas/gjanas.com.git
```

Istniejący klon bez motywu:

```bash
git submodule update --init
```

## Podgląd na żywo

```bash
docker run --rm -it -p 1313:1313 -v "$PWD":/project -w /project -v hugo_cache:/cache -e HUGO_CACHEDIR=/cache ghcr.io/gohugoio/hugo:v0.168.0@sha256:1fb8fe7f417abd5802d86747d297728aa48078d763159e7dff6559fe3f8bb8e7 server --bind 0.0.0.0 --buildDrafts
```

Strona: <http://localhost:1313/> (PL: <http://localhost:1313/pl/>). RSS: `/feed.xml` i `/pl/feed.xml`. Przeglądarka z językiem polskim jest automatycznie przenoszona na `/pl/`, dopóki nie wybierzesz języka przełącznikiem w menu.

## Build (jak w CI)

```bash
docker run --rm -v "$PWD":/project -w /project -v hugo_cache:/cache -e HUGO_CACHEDIR=/cache ghcr.io/gohugoio/hugo:v0.168.0@sha256:1fb8fe7f417abd5802d86747d297728aa48078d763159e7dff6559fe3f8bb8e7 build --panicOnWarning --minify --cleanDestinationDir
```

Wynik w `public/` (ignorowany przez git). `--panicOnWarning` przerywa build na każdym ostrzeżeniu, np. o deprecacji.

## Nowy wpis

Wpis to katalog (page bundle) — zdjęcia leżą obok tekstu. Wersja angielska to `index.md`, polska `index.pl.md`; wspólny katalog = wspólny URL (`/blog/<slug>/` i `/pl/blog/<slug>/`).

```bash
docker run --rm -v "$PWD":/project -w /project ghcr.io/gohugoio/hugo:v0.168.0@sha256:1fb8fe7f417abd5802d86747d297728aa48078d763159e7dff6559fe3f8bb8e7 new content blog/moj-wpis/index.md
```

```bash
docker run --rm -v "$PWD":/project -w /project ghcr.io/gohugoio/hugo:v0.168.0@sha256:1fb8fe7f417abd5802d86747d297728aa48078d763159e7dff6559fe3f8bb8e7 new content blog/moj-wpis/index.pl.md
```

Nowy wpis ma `draft: true` — usuń tę linię przed publikacją. Zdjęcie wstawiasz Markdownem (`![opis](zdjecie.jpg)`); przy buildzie powstają warianty WebP 480/800/1200/1600 px z `srcset`, `width`/`height` i `loading="lazy"`. Wpis tylko w jednym języku pojawia się tylko na liście tego języka.

Oryginały zdjęć z wpisów **nie są publikowane** (`build.publishResources = false` dla `/blog/**`), więc EXIF/GPS z telefonu nie trafia na stronę — publikowane są tylko wersje WebP z render hooka. Pole `cover:` we front matter wskazuje zdjęcie z katalogu wpisu, z którego powstaje obrazek podglądu linku 1200×630 (og:image); bez niego używany jest `static/img/og-default.jpg`.

## Linki

Strona `/links/` (`/pl/links/`) renderuje `data/links.yaml` (pola `*_pl` opcjonalne).

## Aplikacje

`static/ptaki/`, `static/trening/`, `static/peppa/` są kopiowane bez zmian pod `/ptaki/`, `/trening/`, `/peppa/` — edytuj je tam. `static/ptaki/CLAUDE.md` jest wykluczony z publikacji (`[[module.mounts]]` w `hugo.toml`).

`static/assets/` zawiera pliki poprzedniej wersji (Jekyll) trzymane tylko po to, żeby stare URL-e nie zwracały 404.

## Aktualizacja motywu

```bash
git submodule update --remote themes/beautifulhugo
```

Potem build z `--panicOnWarning`, przejrzenie strony i commit nowego wskaźnika submodułu. Nadpisania motywu są w `layouts/` (`_partials/head_custom.html` — kolory, hreflang, auto-przekierowanie PL; `_partials/func/image-srcset.html` — WebP; `_partials/func/language-name.html` i `_partials/translation_link.html` — zgodność z Hugo ≥ 0.158).

## Aktualizacja Hugo

Zmień tag i digest obrazu w `.github/workflows/deploy.yml` (`HUGO_IMAGE`) i w tym README. Digest:

```bash
docker buildx imagetools inspect ghcr.io/gohugoio/hugo:vX.Y.Z --format '{{json .Manifest.Digest}}'
```

## Archiwum

Wersja na Jekyllu (beautiful-jekyll): gałąź `archive/jekyll`, tag `jekyll-final`.
