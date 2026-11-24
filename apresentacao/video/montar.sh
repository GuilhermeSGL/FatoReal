#!/usr/bin/env bash
# Montagem do vídeo Fato Real (banca PI Senac) — 1920x1080, 24 fps.
# Uso: coloque os arquivos na pasta "entrada/" com os nomes abaixo e rode:  bash montar.sh
# O que faltar vira uma tela provisória com aviso, para dar para ver o tempo todo.
#
#   entrada/clipe0.mp4   Brasília + voo do passarinho (Kling 4.0)
#   entrada/clipe1.mp4   amiga chega e se debruça
#   entrada/clipe2.mp4   desabafo no travesseiro
#   entrada/clipe3.mp4   levanta e senta na cama
#   entrada/clipe4.mp4   por cima do ombro, clique em VERIFICAR (8 s)
#   entrada/clipe5.mp4   gravação de tela do site (12 s depois de editada)
#   entrada/cartela.png  cartela final
#   entrada/locucao.wav  (opcional) TODAS as vozes num arquivo só, já no tempo do vídeo
#   entrada/musica.mp3   (opcional) trilha
#   entrada/sfx.wav      (opcional) efeitos sonoros num arquivo só, já no tempo do vídeo
set -euo pipefail
cd "$(dirname "$0")"
E=entrada; T=tmp; mkdir -p $T saida
FPS=24
FONTE=/usr/share/fonts/opentype/inter/Inter-Bold.otf
COD="-c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p -r $FPS -an"

provisorio() { # $1 saída, $2 duração, $3 texto
  ffmpeg -v error -y -f lavfi -i "color=c=0x1A1A1A:s=1920x1080:r=$FPS:d=$2" \
    -vf "drawtext=fontfile=$FONTE:text='$3':fontcolor=0xC6F135:fontsize=64:x=(w-tw)/2:y=(h-th)/2" $COD "$1"
}

# Zoom uniforme de 107% (clipes 1 a 4): corta 63 px embaixo, onde ficam as marcas d'água (Media.io/Kling).
ZOOM105="scale=2054:1156:flags=lanczos,crop=1920:1080:67:13,setsar=1"

# Clipe 0 é 1332x676. Medido com OpenCV: Clipe1 = 1,514 x Clipe0 + (0, 5 px). Escala 1,62 + recorte (67,7)
# deixa o último quadro do Clipe 0 no MESMO enquadramento do 1º quadro do Clipe 1 (corte invisível).
# A marca "KlingAI 4.0" que sobra na borda é apagada com delogo.
if [ -f $E/clipe0.mp4 ]; then
  ffmpeg -v error -y -i $E/clipe0.mp4 -t 5.9 -vf "delogo=x=1165:y=620:w=162:h=40,minterpolate=fps=240/7:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,setpts=PTS/0.7,scale=2158:1095:flags=lanczos,crop=1920:1080:67:7,setsar=1" -t 8.4 $COD $T/c0.mp4
else provisorio $T/c0.mp4 8.4 'CLIPE 0 - Brasilia (falta)'; fi

for n in 1 2 3; do
  if [ -f $E/clipe$n.mp4 ]; then ffmpeg -v error -y -i $E/clipe$n.mp4 -t 10 -vf "$ZOOM105" $COD $T/c$n.mp4
  else provisorio $T/c$n.mp4 10 "CLIPE $n (falta)"; fi
done
# Clipe 4 (8 s): nos últimos 0,7 s a câmera "mergulha" na tela do notebook (centro ~1110,565 depois do zoom 107%).
if [ -f $E/clipe4.mp4 ]; then ffmpeg -v error -y -i $E/clipe4.mp4 -t 8 -vf "$ZOOM105,scale=3840:2160:flags=lanczos,zoompan=z='if(gte(in_time,7.3),1+(in_time-7.3)/0.7*1.2,1)':x='2220-iw/zoom/2':y='1130-ih/zoom/2':d=1:s=1920x1080:fps=$FPS" $COD $T/c4.mp4
else provisorio $T/c4.mp4 8 'CLIPE 4 - clique em VERIFICAR (falta)'; fi

if [ -f $E/clipe5.mp4 ]; then
  ffmpeg -v error -y -i $E/clipe5.mp4 -t 12.5 -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x09090b,setsar=1" $COD $T/c5.mp4
else provisorio $T/c5.mp4 12.5 'CLIPE 5 - gravacao de tela do site (falta)'; fi

ffmpeg -v error -y -loop 1 -i $E/cartela.png -t 5 -vf "scale=1920:1080,setsar=1,fade=t=in:st=0:d=0.6" $COD $T/c6.mp4

# Linha do tempo (segundos):
#  C0 0–8.0 (voo em câmera lenta, 70% da velocidade) | fusão 0.4 s | C1 8.0–18.0 | C2 18.0–28.0 | C3 28.0–38.0
#  C4 38.0–46.0 (zoom na tela no fim) | fusão 0.5 s → C5 45.5–58.0 | fusão 0.5 s → cartela 57.5–62.5
ffmpeg -v error -y -i $T/c0.mp4 -i $T/c1.mp4 -i $T/c2.mp4 -i $T/c3.mp4 -i $T/c4.mp4 -i $T/c5.mp4 -i $T/c6.mp4 -filter_complex "
[0]settb=1/$FPS,fps=$FPS[i0];[1]settb=1/$FPS,fps=$FPS[i1];[2]settb=1/$FPS,fps=$FPS[i2];[3]settb=1/$FPS,fps=$FPS[i3];
[4]settb=1/$FPS,fps=$FPS[i4];[5]settb=1/$FPS,fps=$FPS[i5];[6]settb=1/$FPS,fps=$FPS[i6];
[i0][i1]xfade=transition=fade:duration=0.4:offset=8.0[a];
[a][i2]concat=n=2:v=1:a=0,settb=1/$FPS[b];
[b][i3]concat=n=2:v=1:a=0,settb=1/$FPS[c];
[c][i4]concat=n=2:v=1:a=0,settb=1/$FPS[d];
[d][i5]xfade=transition=fade:duration=0.5:offset=45.5[e];
[e][i6]xfade=transition=fade:duration=0.5:offset=57.5,fade=t=out:st=61.8:d=0.7[v]" \
  -map "[v]" -c:v libx264 -crf 17 -preset slow -pix_fmt yuv420p -r $FPS $T/video.mp4

# Áudio: voz (com trecho abafado do travesseiro 18.0–25.0 s) + trilha com ducking + SFX.
DUR=62.5
ins=(); filt=""; mix=""
i=0
if [ -f $E/locucao.wav ]; then
  ins+=(-i $E/locucao.wav)
  filt+="[$i:a]aresample=48000,highpass=f=80,lowpass=f=800:enable='between(t,18.0,25.0)',lowpass=f=800:enable='between(t,18.0,25.0)',apad,atrim=0:$DUR,asplit=2[voz][vozsc];"
  mix+="[voz]"; i=$((i+1))
fi
if [ -f $E/musica.mp3 ]; then
  ins+=(-i $E/musica.mp3)
  filt+="[$i:a]aresample=48000,volume=0.35,afade=t=in:d=2,afade=t=out:st=59.5:d=3,apad,atrim=0:$DUR[mus0];"
  if [ -f $E/locucao.wav ]; then filt+="[mus0][vozsc]sidechaincompress=threshold=0.03:ratio=6:attack=50:release=400[mus];"
  else filt+="[mus0]anull[mus];"; fi
  mix+="[mus]"; i=$((i+1))
elif [ -f $E/locucao.wav ]; then filt+="[vozsc]anullsink;"
fi
if [ -f $E/sfx.wav ]; then
  ins+=(-i $E/sfx.wav); filt+="[$i:a]aresample=48000,apad,atrim=0:$DUR[sfx];"; mix+="[sfx]"; i=$((i+1))
fi

if [ $i -gt 0 ]; then
  ffmpeg -v error -y "${ins[@]}" -filter_complex "${filt}${mix}amix=inputs=$i:normalize=0,loudnorm=I=-14:TP=-1:LRA=11[a]" \
    -map "[a]" -c:a pcm_s16le -ar 48000 $T/audio.wav
  ffmpeg -v error -y -i $T/video.mp4 -i $T/audio.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -shortest -movflags +faststart saida/fato_real_final.mp4
else
  ffmpeg -v error -y -i $T/video.mp4 -c copy -movflags +faststart saida/fato_real_final.mp4
fi
echo "Pronto: saida/fato_real_final.mp4"
