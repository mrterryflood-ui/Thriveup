/**
 * Flagship 3D — Water pressure / head column (PLUMBING).
 *
 * Depth earns its keep here: pressure-as-height is inherently 3D and hard to
 * feel from a flat picture. We render a transparent vertical column of water
 * of height h; a pressure gauge at the base reads the hydrostatic pressure.
 *
 * PHYSICS (correct, anti-fabrication):
 *   P = ρ · g · h  →  for water, 1 m of head ≈ 1.42 psi (matches the lesson's
 *   own key term: "1 m head ≈ 1.42 psi"). We label the base gauge with the
 *   psi computed from the column height, and the column top with the head in m.
 *
 * Vanilla Three.js only (three is a dependency). Mount in useEffect, dispose
 * on unmount, cap pixel ratio, handle resize, touch-rotate via OrbitControls.
 */
import { useEffect, useRef } from "react";
import { THREE, OrbitControls, createRendererSafe } from "./three-lib";

export interface Diagram3DProps {
  /** Called if WebGL is unavailable or the renderer throws — parent shows 2D. */
  onError?: () => void;
}

// 1 m of water head → psi. ρg for water = 9.81 kPa/m; 1 psi = 6.895 kPa.
const PSI_PER_M = 9.81 / 6.895; // ≈ 1.4227

function makeLabel(text: string, color: string, size = 30): THREE.Sprite {
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
  s.scale.set(4, 1, 1);
  return s;
}

export default function ThreeWaterHead({ onError }: Diagram3DProps = {}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || 320;
    const H = mount.clientHeight || 300;

    // Fail soft: never let a missing/broken WebGL context throw and take down
    // the whole lesson page. Probe first, then guard construction.
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
    camera.position.set(4.5, 3.5, 6.5);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 4;
    controls.maxDistance = 14;
    controls.target.set(0, 2.4, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(5, 8, 5);
    scene.add(key);

    // Column height in metres (head). Chosen realistic residential head.
    const headM = 5;
    const psi = headM * PSI_PER_M; // ≈ 7.1 psi per 5 m — correct hydrostatic value

    // Transparent glass tube
    const tubeR = 0.9;
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(tubeR, tubeR, headM, 40, 1, true),
      new THREE.MeshPhongMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.18, side: THREE.DoubleSide }),
    );
    tube.position.y = headM / 2;
    scene.add(tube);

    // Water fill inside (slightly smaller radius)
    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(tubeR * 0.92, tubeR * 0.92, headM, 40),
      new THREE.MeshPhongMaterial({ color: 0x2563eb, transparent: true, opacity: 0.55 }),
    );
    water.position.y = headM / 2;
    scene.add(water);

    // Base plate + gauge
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 0.3, 40),
      new THREE.MeshPhongMaterial({ color: 0x475569 }),
    );
    base.position.y = -0.15;
    scene.add(base);

    // Depth markers every 1 m with head + psi
    for (let m = 1; m <= headM; m++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(tubeR + 0.02, 0.02, 8, 40),
        new THREE.MeshBasicMaterial({ color: 0xbfdbfe }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = headM - m + 0.0001; // measured from surface downward
      scene.add(ring);
    }

    // Labels: surface (head) and base (pressure)
    const topLabel = makeLabel(`${headM} m head`, "#bfdbfe", 34);
    topLabel.position.set(0, headM + 0.7, 0);
    scene.add(topLabel);

    const baseLabel = makeLabel(`base pressure ≈ ${psi.toFixed(1)} psi`, "#fca5a5", 30);
    baseLabel.position.set(0, -1, 0);
    scene.add(baseLabel);

    const eq = makeLabel("P = ρ · g · h", "#ffffff", 30);
    eq.position.set(0, headM + 1.6, 0);
    scene.add(eq);

    // Falling drops to imply pressure at the base
    const dropGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const dropMat = new THREE.MeshPhongMaterial({ color: 0x60a5fa });
    const drops = Array.from({ length: 6 }, () => {
      const d = new THREE.Mesh(dropGeo, dropMat);
      d.position.set((Math.random() - 0.5) * 0.6, Math.random() * headM, (Math.random() - 0.5) * 0.6);
      scene.add(d);
      return d;
    });

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      for (const d of drops) {
        d.position.y -= 0.03;
        if (d.position.y < 0.1) d.position.y = headM;
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
      dropGeo.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}
