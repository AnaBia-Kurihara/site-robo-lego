# Blocktron — do papel ao 2º lugar no NEXT FIAP 2026

Site interativo que conta a trajetória do **Blocktron**, robô de batalha de balões com identidade LEGO, desde o primeiro esboço até o **2º lugar na final do NEXT FIAP 2026**.

Conforme a página é rolada, o robô (desenhado em SVG) se monta peça por peça: chassi, tração diferencial, Arduino Mega + Motor Shield, Bluetooth, sensores, LEDs, arma e carcaça.

## Destaques técnicos do robô

- **Arduino Mega** + shield de motor (4 canais; sentidos via registrador 74HC595 escrito bit a bit)
- **Bluetooth** na `Serial3` + joystick no app RoboRemo (`x`/`y` de −100 a 100) com mixagem *arcade drive* no Arduino
- **Failsafe de 250 ms**: sem comando do app, os motores param
- **Arma em MDF**: uma estrutura com um motor; engrenagem e cremalheira movem uma barra com agulhas para frente e para trás (~15 s por ciclo), via máquina de estados não bloqueante (`millis()`)
- **Carcaça-dobradiça**: base de MDF, estrutura de papelão e laterais de EVA presas só no teto — qualquer toque na lateral aciona os 4 sensores (2 por lado) e dispara a arma
- **60 LEDs endereçáveis** indicando o estado do robô, com brilho limitado para direcionar energia à arma e poupar bateria
- Correção de latência: `delay(1)` → `delayMicroseconds(2)` no envio ao 74HC595 (~1000× mais rápido)

## Interações do site

- Montagem do robô sincronizada com o scroll
- Joystick que simula a mixagem de motores do Arduino
- Botões de estado dos LEDs e simulação da máquina de estados da arma
- Visão raio-X da carcaça

## Estrutura

```
index.html
css/styles.css
js/main.js
img/            imagens (img/real: fotos reais)
videos/         batalhas e testes
```
