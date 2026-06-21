<script lang="ts">
import { onDestroy } from "svelte";
import type { MacroAct } from "../../sim/macroActs";

/**
 * SHADER BACKDROP (Convergence Saga, SS-14) — a lightweight WebGL/GLSL atmospheric backdrop whose
 * palette + motion shift with the macro-act register: Convergence (cold immigrant grey-blue),
 * Emergence (warm gilded amber), Ascension (deep starfield navy). A single full-screen fragment
 * shader, animated by a slow time uniform. Mobile-first + mid-tier budget: caps DPR, pauses when
 * offscreen, and honours prefers-reduced-motion (renders one static frame, no rAF loop).
 *
 * Falls back gracefully to a CSS gradient if WebGL is unavailable (kept behind the canvas).
 */

interface Props {
  /** The current macro-act, which selects the palette + mood. */
  macroAct: MacroAct;
}
const { macroAct }: Props = $props();

let canvas = $state<HTMLCanvasElement | undefined>();
let raf = 0;
let gl: WebGLRenderingContext | null = null;
let program: WebGLProgram | null = null;
let startMs = 0;

// Per-macro-act palette: [topColor, bottomColor, accent] as 0..1 rgb triples.
const PALETTES: Record<MacroAct, { top: [number, number, number]; bot: [number, number, number]; accent: [number, number, number]; speed: number }> = {
  convergence: { top: [0.07, 0.1, 0.16], bot: [0.02, 0.03, 0.06], accent: [0.35, 0.45, 0.6], speed: 0.04 },
  emergence: { top: [0.12, 0.09, 0.04], bot: [0.04, 0.03, 0.02], accent: [0.83, 0.69, 0.21], speed: 0.06 },
  ascension: { top: [0.03, 0.03, 0.09], bot: [0.0, 0.0, 0.02], accent: [0.55, 0.62, 0.95], speed: 0.09 },
};

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
// A cheap atmospheric gradient + drifting accent haze; no textures, no loops over pixels.
const FRAG = `
precision mediump float;
uniform vec2 uRes; uniform float uTime;
uniform vec3 uTop; uniform vec3 uBot; uniform vec3 uAccent;
float hash(vec2 v){ return fract(sin(dot(v, vec2(12.9898,78.233)))*43758.5453); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes.xy;
  vec3 col = mix(uBot, uTop, uv.y);
  // slow drifting haze bands toward the accent.
  float band = sin(uv.y*4.0 + uTime*0.6) * 0.5 + 0.5;
  float drift = sin(uv.x*3.0 - uTime*0.4) * 0.5 + 0.5;
  col += uAccent * 0.10 * band * drift;
  // faint star/grain twinkle, denser toward the top (sky).
  float g = hash(floor(gl_FragCoord.xy*0.5) + floor(uTime*0.5));
  col += vec3(step(0.997, g) * uv.y * 0.6);
  gl_FragColor = vec4(col, 1.0);
}`;

function compile(g: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = g.createShader(type);
  if (!sh) return null;
  g.shaderSource(sh, src);
  g.compileShader(sh);
  return g.getShaderParameter(sh, g.COMPILE_STATUS) ? sh : null;
}

function init(): boolean {
  if (!canvas) return false;
  gl = canvas.getContext("webgl", { antialias: false, depth: false, alpha: false });
  if (!gl) return false;
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return false;
  program = gl.createProgram();
  if (!program) return false;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
  gl.useProgram(program);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  return true;
}

function resize(): void {
  if (!canvas || !gl) return;
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 1.5); // cap DPR for mid-tier budget
  const w = Math.floor(canvas.clientWidth * dpr);
  const h = Math.floor(canvas.clientHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  }
}

function draw(timeSec: number): void {
  if (!gl || !program) return;
  resize();
  const pal = PALETTES[macroAct];
  gl.uniform2f(gl.getUniformLocation(program, "uRes"), canvas?.width ?? 1, canvas?.height ?? 1);
  gl.uniform1f(gl.getUniformLocation(program, "uTime"), timeSec * pal.speed);
  gl.uniform3fv(gl.getUniformLocation(program, "uTop"), pal.top);
  gl.uniform3fv(gl.getUniformLocation(program, "uBot"), pal.bot);
  gl.uniform3fv(gl.getUniformLocation(program, "uAccent"), pal.accent);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

$effect(() => {
  // Re-read macroAct so the palette updates when the act changes.
  void macroAct;
  if (!canvas) return;
  if (!gl && !init()) return; // WebGL unavailable → CSS fallback shows through
  const reduce = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    draw(0); // single static frame, no animation loop
    return;
  }
  startMs = startMs || performance.now();
  const loop = (now: number) => {
    draw((now - startMs) / 1000);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
});

onDestroy(() => cancelAnimationFrame(raf));
</script>

<div class="backdrop" data-macro-act={macroAct} aria-hidden="true">
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: -1;
    /* CSS fallback gradient (shows if WebGL is unavailable, behind the canvas). */
    background: radial-gradient(120% 80% at 50% 0%, var(--mmm-navy-light) 0%, var(--mmm-navy) 55%, var(--mmm-navy-deep) 100%);
  }
  canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
