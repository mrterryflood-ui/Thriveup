/**
 * Flagship 3D — Refrigeration cycle (HVAC).
 *
 * Depth earns its keep: the vapor-compression cycle is a closed loop of four
 * components where refrigerant changes phase and pressure at each stage. Seen
 * as a rotating 3D loop, the "where is it high pressure / low pressure, hot /
 * cold" relationship becomes spatial and memorable.
 *
 * THERMODYNAMICS (correct, anti-fabrication) — the four stages, in order:
 *   1. Compressor: low-pressure vapor → high-pressure, high-temp vapor.
 *   2. Condenser (outdoor): hot vapor rejects heat → high-pressure liquid.
 *   3. Metering device (TXV/orifice): pressure drops sharply → cold mix.
 *   4. Evaporator (indoor): low-pressure liquid absorbs heat → cold vapor.
 *   …back to the compressor. High-pressure side = compressor→condenser→metering
 *   inlet; low-pressure side = metering outlet→evaporator→compressor inlet.
 *   Colors: warm (red/orange) on the high side, cool (blue) on the low side —
 *   physically correct.
 *
 * Vanilla Three.js + OrbitControls (touch-rotate). Dispose on unmount.
 */
import { useEffect, useRef } from "react";
import { THREE, OrbitControls, createRendererSafe } from "./three-lib";
import type { Diagram3DProps } from "./three-water-head";

function makeLabel(text: string, color: string, size = 26): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.font = `bold ${size}px sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const s = new THREE.Sprite(mat);
  s.scale.set(3.6, 0.9, 1);
  return s;
}

export default function ThreeRefrigeration({ onError }: Diagram3DProps = {}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || 320;
    const H = mount.clientHeight || 300;

    // Fail soft: probe WebGL and guard construction so a missing/broken
    // context can never throw and take down the lesson page.
    const renderer = createRendererSafe({ antialias: true, alpha: true });
    if (!renderer) {
      onError?.();
      return;
    }
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0b1220, 1);
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = "pan-y"; // horizontal drag rotates; vertical swipe still scrolls the page

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 4, 9);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 6;
    controls.maxDistance = 18;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 0.8);
    key.position.set(5, 8, 6);
    scene.add(key);

    // Four corners of the cycle loop (clockwise, viewed from front):
    //   compressor (bottom-left) → condenser (top-left) → metering (top-right)
    //   → evaporator (bottom-right) → back to compressor.
    const P = {
      compressor: new THREE.Vector3(-3, -1.8, 0),
      condenser: new THREE.Vector3(-3, 1.8, 0),
      metering: new THREE.Vector3(3, 1.8, 0),
      evaporator: new THREE.Vector3(3, -1.8, 0),
    };
    // Ordered loop for the refrigerant path.
    const order = [P.compressor, P.condenser, P.metering, P.evaporator];
    const curve = new THREE.CatmullRomCurve3(order, true, "catmullrom", 0);
    const loopPts = curve.getPoints(240);
    const pipeGeo = new THREE.BufferGeometry().setFromPoints(loopPts);
    scene.add(new THREE.LineLoop(pipeGeo, new THREE.LineBasicMaterial({ color: 0x94a3b8 })));

    // High side (compressor→condenser→metering) warm; low side cool.
    // Draw a warm segment along top and a cool segment along bottom.
    const box = (color: number) => new THREE.MeshPhongMaterial({ color });
    const comp = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.9, 20), box(0x334155));
    comp.position.copy(P.compressor);
    scene.add(comp);
    const cond = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 0.7), box(0xdc2626));
    cond.position.copy(P.condenser);
    scene.add(cond);
    const meter = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.9, 16), box(0x64748b));
    meter.position.copy(P.metering);
    meter.rotation.z = Math.PI;
    scene.add(meter);
    const evap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 0.7), box(0x2563eb));
    evap.position.copy(P.evaporator);
    scene.add(evap);

    // Labels — each names the stage + its pressure/temperature state.
    const labels: Array<[THREE.Vector3, string, string]> = [
      [P.compressor, "1 Compressor", "#e2e8f0"],
      [P.condenser, "2 Condenser · HIGH P · rejects heat", "#fca5a5"],
      [P.metering, "3 Metering · pressure drops", "#cbd5e1"],
      [P.evaporator, "4 Evaporator · LOW P · absorbs heat", "#93c5fd"],
    ];
    for (const [pos, text, color] of labels) {
      const l = makeLabel(text, color, 24);
      l.position.set(pos.x, pos.y + (pos.y > 0 ? 0.95 : -0.95), pos.z);
      scene.add(l);
    }
    const title = makeLabel("Vapor-compression cycle", "#ffffff", 28);
    title.position.set(0, 3.2, 0);
    scene.add(title);

    // Refrigerant packets change color by loop position: warm on the top
    // (high-pressure) run, cool on the bottom (low-pressure) run.
    const warm = new THREE.Color(0xf97316);
    const cool = new THREE.Color(0x38bdf8);
    const packetGeo = new THREE.SphereGeometry(0.16, 12, 12);
    const N = 16;
    const packets = Array.from({ length: N }, (_, i) => {
      const m = new THREE.Mesh(packetGeo, new THREE.MeshPhongMaterial({ color: cool.clone() }));
      scene.add(m);
      return { mesh: m, t: i / N };
    });

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      for (const pk of packets) {
        pk.t = (pk.t + 0.0016) % 1;
        const pos = curve.getPointAt(pk.t);
        pk.mesh.position.copy(pos);
        // Top half of the loop = high-pressure/warm; bottom half = low/cool.
        const warmSide = pos.y > 0;
        (pk.mesh.material as THREE.MeshPhongMaterial).color.copy(warmSide ? warm : cool);
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const nW = mount.clientWidth;
      const nH = mount.clientHeight;
      if (!nW || !nH) return;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      packetGeo.dispose();
      pipeGeo.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}
