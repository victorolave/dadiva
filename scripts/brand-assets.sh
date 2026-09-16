#!/usr/bin/env bash
# Genera los derivados de marca (WebP para la app, PNG/ICO/JPG para public/)
# a partir de los maestros PNG en design/brand/. Es idempotente: se puede
# ejecutar cuantas veces haga falta y siempre sobrescribe la misma salida.
#
# Requiere: ImageMagick 7 (comando `magick`) y `cwebp`.
#
# Por qué un script y no una transformación en build time: los maestros
# pesan ~500 KB cada uno y no aportan nada corriéndolos en cada `vite build`.
# Se generan una vez, a mano, y la salida SÍ se versiona.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/design/brand"
OUT="$ROOT/src/assets/brand"
PUB="$ROOT/public"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$OUT"

# Paleta usada solo para componer los derivados (favicon, apple-touch-icon,
# og-image). No reemplaza los tokens de theme.css: son valores literales
# porque este script corre fuera del pipeline de Tailwind.
BLUSH='#f6c3d9'
PAPER='#fbf8f1'
GRID='#e0d8c8'
LILAC='#cbc8f1'
SAGE='#d9e6bf'

webp() {
  # q88 en vez de q90: a 2x en pantallas retina la diferencia es
  # imperceptible y mantiene cada derivado bajo el límite de 15 KB.
  cwebp -quiet -q 88 -alpha_q 100 -m 6 -sharp_yuv "$1" -o "$2"
}

# --- Logo horizontal (header, footer) ---
for w in 180 360; do
  magick "$SRC/logo-horizontal.png" -trim +repage -resize "${w}x" "$TMP/a.png"
  webp "$TMP/a.png" "$OUT/logo-horizontal-$w.webp"
done

# --- Logo principal (SetupGuard, og-image) ---
for w in 160 320; do
  magick "$SRC/logo-principal.png" -trim +repage -resize "${w}x" "$TMP/a.png"
  webp "$TMP/a.png" "$OUT/logo-principal-$w.webp"
done

# --- Isotipo e isotipo monocromo: lienzo cuadrado, recortado y centrado ---
square() { # $1 maestro, $2 lado, $3 destino
  magick "$1" -trim +repage -resize "$2x$2" -background none -gravity center -extent "$2x$2" "$TMP/s.png"
  webp "$TMP/s.png" "$3"
}
for s in 96 192 320; do square "$SRC/isotipo.png" "$s" "$OUT/isotipo-$s.webp"; done
for s in 64 128; do square "$SRC/isotipo-monocromo.png" "$s" "$OUT/isotipo-monocromo-$s.webp"; done

# --- favicon.ico: isotipo dentro de un cuadrado redondeado blush ---
tile() { # $1 lado, $2 relleno interior, $3 radio
  local s=$1 pad=$2 r=$3
  local inner=$((s - 2 * pad))
  magick -size "${s}x${s}" xc:none -fill "$BLUSH" -draw "roundrectangle 0,0,$((s - 1)),$((s - 1)),$r,$r" \
    \( "$SRC/isotipo.png" -trim +repage -resize "${inner}x${inner}" \) -gravity center -composite "PNG32:$TMP/t$s.png"
}
tile 16 1 4
tile 32 2 7
tile 48 3 10
magick "$TMP/t16.png" "$TMP/t32.png" "$TMP/t48.png" "$PUB/favicon.ico"

# --- apple-touch-icon.png: fondo blush a sangre, sin transparencia ---
magick -size 180x180 "xc:$BLUSH" \( "$SRC/isotipo.png" -trim +repage -resize 124x124 \) \
  -gravity center -composite +dither -colors 64 -strip "PNG8:$PUB/apple-touch-icon.png"

# --- icon-192 / icon-512 (manifest, zona segura maskable al 60%) ---
magick -size 512x512 "xc:$BLUSH" \( "$SRC/isotipo.png" -trim +repage -resize 308x308 \) \
  -gravity center -composite -strip "$TMP/i512.png"
magick "$TMP/i512.png" +dither -colors 64 -strip "PNG8:$PUB/icon-512.png"
magick "$TMP/i512.png" -resize 192x192 +dither -colors 64 -strip "PNG8:$PUB/icon-192.png"

# --- og-image.jpg: papel + cuadrícula + blobs + logo principal ---
magick -size 24x24 "xc:$PAPER" -stroke "$GRID" -strokewidth 1 -draw "line 0,0 23,0" -draw "line 0,0 0,23" "$TMP/cell.png"
magick -size 1200x630 "tile:$TMP/cell.png" -stroke none \
  -fill "$LILAC" -draw "ellipse 1080,90 260,190 0,360" \
  -fill "$SAGE" -draw "ellipse 110,600 230,150 0,360" \
  \( "$SRC/logo-principal.png" -trim +repage -resize x440 \) -gravity center -composite \
  -strip -quality 85 "$PUB/og-image.jpg"

echo "Listo. Derivados en $OUT y $PUB."
