/**
 * Flagship 3D — Series circuit current flow (ELECTRICAL / DC circuits).
 *
 * Depth earns its keep: current is a single stream that flows through every
 * component in a loop, at the SAME rate everywhere in a series circuit. In 3D
 * you can literally watch identical electron packets circulate the loop and
 * see the voltage "drop" across each resistor add up to the source voltage.
 *
 * PHYSICS (correct, anti-fabrication):
 *   Series: I is the same through all elements. Kirchhoff's voltage law —
 *   the resistor drops sum to the source EMF. Example loop: 12 V source, two
 *   equal resistors → 6 V drop each, one current I everywhere. Current speed
 *   of the animated packets is constant around the whole loop (correct: series
 *   current is identical at every point).
 *
 * Vanilla Three.js + OrbitControls (touch-rotate). Dispose on unmount.
 */
import { useEffect, useRef } from "react";
import { THREE, OrbitControls, createRendererSafe } from "./three-lib";
import type { Diagram3DProps } from "./three-water-head";

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
  s.scale.set(3.4, 0.85, 1);
  return s;
}

export default function ThreeSeriesCircuit({ onError }: Diagram3DProps = {}) {
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
    camera.position.set(0, 3, 8);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 5;
    controls.maxDistance = 16;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 0.8);
    key.position.set(4, 6, 8);
    scene.add(key);

    // Rectangular loop path (the wire). Corners of the series loop.
    const R = 3;
    const pts = [
      new THREE.Vector3(-R, -1.6, 0),
      new THREE.Vector3(R, -1.6, 0),
      new THREE.Vector3(R, 1.6, 0),
      new THREE.Vector3(-R, 1.6, 0),
    ];
    const curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.0);
    curve.curveType = "catmullrom";
    // Use a closed rounded rectangle via LineLoop for the wire
    const loopPts = curve.getPoints(200);
    const wireGeo = new THREE.BufferGeometry().setFromPoints(loopPts);
    const wire = new THREE.LineLoop(wireGeo, new THREE.LineBasicMaterial({ color: 0x64748b }));
    scene.add(wire);

    // Battery (source) on the left edge
    const battery = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 1.2, 0.5),
      new THREE.MeshPhongMaterial({ color: 0x1e293b }),
    );
    battery.position.set(-R, 0, 0);
    scene.add(battery);
    const srcLabel = makeLabel("9 V source", "#fbbf24", 30);
    srcLabel.position.set(-R - 0.2, 0, 0.8);
    scene.add(srcLabel);

    // Two equal 1 kΩ resistors on the top edge → 4.5 V drop each (matches the
    // lesson's worked example: 9 V ÷ 2 kΩ = 4.5 mA)
    const resMat = new THREE.MeshPhongMaterial({ color: 0xef4444 });
    const r1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.4), resMat);
    r1.position.set(-1.2, 1.6, 0);
    scene.add(r1);
    const r2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.4), resMat);
    r2.position.set(1.2, 1.6, 0);
    scene.add(r2);
    const d1 = makeLabel("R1 1 kΩ · 4.5 V drop", "#fca5a5", 26);
    d1.position.set(-1.2, 2.3, 0);
    scene.add(d1);
    const d2 = makeLabel("R2 1 kΩ · 4.5 V drop", "#fca5a5", 26);
    d2.position.set(1.2, 2.3, 0);
    scene.add(d2);

    const iLabel = makeLabel("I = 4.5 mA — the SAME everywhere", "#93c5fd", 28);
    iLabel.position.set(0, -2.6, 0);
    scene.add(iLabel);

    // Electron packets — identical spacing + identical speed around the loop
    // (series current is equal at every point). Blue spheres travel along the
    // closed loop curve.
    const packetGeo = new THREE.SphereGeometry(0.14, 12, 12);
    const packetMat = new THREE.MeshPhongMaterial({ color: 0x60a5fa, emissive: 0x1d4ed8, emissiveIntensity: 0.5 });
    const N = 12;
    const packets = Array.from({ length: N }, (_, i) => {
      const p = new THREE.Mesh(packetGeo, packetMat);
      scene.add(p);
      return { mesh: p, t: i / N };
    });

    let animId = 0;
    const speed = 0.0015; // constant — same current everywhere
    const animate = () => {
      animId = requestAnimationFrame(animate);
      for (const pk of packets) {
        pk.t = (pk.t + speed) % 1;
        const pos = curve.getPointAt(pk.t);
        pk.mesh.position.copy(pos);
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
      wireGeo.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}
