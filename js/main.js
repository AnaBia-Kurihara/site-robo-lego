// ===== Montagem do robô conforme o scroll =====
const palco = document.getElementById("palco");
const capitulos = [...document.querySelectorAll(".cap")];
const pecas = [...document.querySelectorAll(".peca")];
const hudNum = document.getElementById("hud-num");
const hudNome = document.getElementById("hud-nome");
const btnRaioX = document.getElementById("raio-x");
const ULTIMA_ETAPA = 9;
const CORES = { boot: "#ffffff", pronto: "#f5c518", arma: "#ff1a1a" };
let timerTeste = null;

// ----- detalhes repetitivos do desenho (gerados aqui para não poluir o HTML) -----
const SVG_NS = "http://www.w3.org/2000/svg";

// franja do cabelo: zigue-zague na borda de baixo
let franja = "M76 154";
for (let x = 76; x < 324; x += 16) franja += ` L${x + 8} 166 L${x + 16} 154`;
document.getElementById("franja").setAttribute("d", franja + " Z");

// agulhas coladas na ponta da barra de ataque
let pontas = "";
for (let x = 118; x < 284; x += 8) pontas += `M${x} 170 L${x + 1.5} 150 L${x + 3} 170 Z `;
document.getElementById("pontas").setAttribute("d", pontas);

// fita de LEDs
const ledRow = document.getElementById("led-row");
for (let x = 108; x <= 292; x += 14) {
    const c = document.createElementNS(SVG_NS, "circle");
    c.setAttribute("cx", x);
    c.setAttribute("cy", 347);
    c.setAttribute("r", 4.5);
    ledRow.appendChild(c);
}

// ----- etapas -----
let etapaAtual = -1;

function definirEtapa(etapa) {
    if (etapa === etapaAtual) return;
    etapaAtual = etapa;

    palco.dataset.step = etapa;
    palco.classList.toggle("escuro", etapa === 0);
    palco.classList.toggle("montando", etapa >= 2);
    palco.classList.toggle("completo", etapa >= ULTIMA_ETAPA);
    if (etapa < ULTIMA_ETAPA) desligarRaioX();

    pecas.forEach(p => {
        const s = Number(p.dataset.step);
        p.classList.toggle("on", s <= etapa);
        p.classList.toggle("atual", s === etapa && etapa < ULTIMA_ETAPA);
    });

    const cap = capitulos.find(c => Number(c.dataset.step) === etapa);
    hudNum.textContent = String(etapa).padStart(2, "0");
    hudNome.textContent = cap ? cap.dataset.nome : "";

    if (etapa === 7) mostrarLed("teste");
}

function aoRolar() {
    // etapa = último capítulo cujo topo passou da linha de leitura
    const linha = window.innerHeight * (window.innerWidth <= 900 ? 0.8 : 0.5);
    let etapa = 0;
    capitulos.forEach(c => {
        if (c.getBoundingClientRect().top < linha) etapa = Number(c.dataset.step);
    });
    definirEtapa(etapa);

    const total = document.documentElement.scrollHeight - window.innerHeight;
    document.getElementById("progresso").style.width = (window.scrollY / total) * 100 + "%";
}

window.addEventListener("scroll", aoRolar, { passive: true });
window.addEventListener("resize", aoRolar);

// ===== Raio-X =====
function desligarRaioX() {
    palco.classList.remove("raiox");
    btnRaioX.setAttribute("aria-pressed", "false");
}
btnRaioX.addEventListener("click", () => {
    const ligado = palco.classList.toggle("raiox");
    btnRaioX.setAttribute("aria-pressed", String(ligado));
});

// ===== Joystick (mixagem arcade drive, igual ao Arduino) =====
const joy = document.getElementById("joy");
const knob = document.getElementById("joy-knob");
const limitar = (v, min, max) => Math.max(min, Math.min(max, v));

function atualizarBarra(lado, valor) {
    const barra = document.getElementById("bar-" + lado);
    barra.style.width = Math.abs(valor) / 2 + "%";
    barra.style.left = valor >= 0 ? "50%" : 50 - Math.abs(valor) / 2 + "%";
    barra.style.background = valor >= 0 ? "var(--amarelo)" : "var(--rosa)";
    document.getElementById("val-" + lado).textContent = valor;
}

function moverJoystick(px, py) {
    const raio = joy.clientWidth / 2 - 20;
    const dist = Math.hypot(px, py);
    if (dist > raio) { px = (px / dist) * raio; py = (py / dist) * raio; }
    knob.style.transform = `translate(${px}px, ${py}px)`;

    const x = Math.round(limitar((px / raio) * 100, -100, 100));
    const y = Math.round(limitar((-py / raio) * 100, -100, 100));
    const esq = limitar(y + x, -100, 100);
    const dir = limitar(y - x, -100, 100);

    document.getElementById("joy-serial").innerHTML = `x ${x}<br>y ${y}`;
    atualizarBarra("esq", esq);
    atualizarBarra("dir", dir);
}

function posicao(e) {
    const r = joy.getBoundingClientRect();
    moverJoystick(e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2);
}

joy.addEventListener("pointerdown", e => {
    joy.setPointerCapture(e.pointerId);
    joy.classList.add("arrastando");
    posicao(e);
});
joy.addEventListener("pointermove", e => { if (joy.classList.contains("arrastando")) posicao(e); });
["pointerup", "pointercancel"].forEach(ev => joy.addEventListener(ev, () => {
    joy.classList.remove("arrastando");
    moverJoystick(0, 0);
}));

// ===== LEDs =====
function mostrarLed(modo) {
    clearInterval(timerTeste);
    document.querySelectorAll("#led-botoes button").forEach(b =>
        b.classList.toggle("ativo", b.dataset.led === modo));

    if (modo === "teste") {
        const seq = ["#ff1a1a", "#1aff4a", "#1a6bff", CORES.pronto];
        let i = 0;
        palco.style.setProperty("--led", seq[0]);
        timerTeste = setInterval(() => {
            i++;
            palco.style.setProperty("--led", seq[i]);
            if (i === seq.length - 1) clearInterval(timerTeste);
        }, 700);
    } else {
        palco.style.setProperty("--led", CORES[modo]);
    }
}

document.querySelectorAll("#led-botoes button").forEach(b =>
    b.addEventListener("click", () => mostrarLed(b.dataset.led)));

// ===== Arma: máquina de estados =====
const btnDisparar = document.getElementById("btn-disparar");
const estados = [...document.querySelectorAll("#maquina .estado")];

function marcarEstado(n) {
    estados.forEach(el => el.classList.toggle("ativo", Number(el.dataset.e) === n));
}
marcarEstado(0);

btnDisparar.addEventListener("click", () => {
    btnDisparar.disabled = true;
    // estado 1: golpe (600 ms) — LED vermelho
    marcarEstado(1);
    palco.classList.add("golpe");
    palco.style.setProperty("--led", CORES.arma);
    setTimeout(() => {
        // estado 2: travada (12,5 s no robô; acelerado aqui)
        marcarEstado(2);
        setTimeout(() => {
            // estado 3: recolhe (550 ms)
            marcarEstado(3);
            palco.classList.remove("golpe");
            setTimeout(() => {
                marcarEstado(0);
                palco.style.setProperty("--led", CORES.pronto);
                btnDisparar.disabled = false;
            }, 550);
        }, 1800);
    }, 600);
});

// ===== Final: fotos + confete =====
const secaoFinal = document.getElementById("final");
const canvas = document.getElementById("confete");
const ctx = canvas.getContext("2d");
let confeteRodou = false;

function soltarConfete() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    canvas.width = secaoFinal.clientWidth;
    canvas.height = secaoFinal.clientHeight;
    const cores = ["#f5c518", "#ff48d4", "#ffffff", "#f9c91d", "#ff8be6"];
    const pedacos = Array.from({ length: 180 }, () => ({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.4,
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 4,
        vy: 2.5 + Math.random() * 3.5,
        vx: -1 + Math.random() * 2,
        r: Math.random() * Math.PI,
        vr: -0.1 + Math.random() * 0.2,
        c: cores[Math.floor(Math.random() * cores.length)],
    }));
    const inicio = performance.now();
    (function quadro(t) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pedacos.forEach(p => {
            p.x += p.vx; p.y += p.vy; p.r += p.vr;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.r);
            ctx.fillStyle = p.c;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });
        if (t - inicio < 7000) requestAnimationFrame(quadro);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
    })(inicio);
}

new IntersectionObserver(entradas => {
    entradas.forEach(e => {
        if (!e.isIntersecting) return;
        secaoFinal.classList.add("visivel");
        if (!confeteRodou) { confeteRodou = true; soltarConfete(); }
    });
}, { threshold: 0.2 }).observe(secaoFinal);

aoRolar();
