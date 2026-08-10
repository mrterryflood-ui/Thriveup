/**
 * Flagship 3D — Weld bead / fillet-joint geometry (WELDING).
 *
 * Depth earns its keep: a fillet weld on a T-joint is a 3D triangular fillet
 * whose LEG and THROAT are perpendicular cross-section dimensions you can only
 * truly appreciate in three dimensions. Rotating the joint shows the bead
 * running along the joint and the triangular cross-section that defines
 * strength.
 *
 * GEOMETRY (correct, anti-fabrication):
 *   - Fillet weld on a T-joint of two plates.
 *   - Weld leg = the two equal sides of the triangular fillet.
 *   - Theoretical throat = 0.707 × leg (the perpendicular from the root to the
 *     hypotenuse of a symmetric fillet — exact: leg / √2). This is the value
 *     the AWS strength calculation uses.
 *   - Convex bead face rides on the fillet.
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
  s.scale.set(3.4, 0.85, 1);
  return s;
}

export default function ThreeWeldJoint({ onError }: Diagram3DProps = {}) {
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
    camera.position.set(5, 4, 6);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 5;
    controls.maxDistance = 16;
    controls.target.set(0, 0.5, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(6, 8, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-5, 2, -3);
    scene.add(fill);

    const steelMat = new THREE.MeshPhongMaterial({ color: 0x94a3b8, shininess: 40 });
    const len = 5; // joint length along Z

    // Horizontal plate (base) lying on XZ, thickness in Y.
    const hPlate = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, len), steelMat);
    hPlate.position.set(0.5, 0, 0);
    scene.add(hPlate);

    // Vertical plate standing up (the stem of the T), thickness in X.
    const vPlate = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3, len), steelMat);
    vPlate.position.set(-1.3, 1.5, 0);
    scene.add(vPlate);

    // Fillet weld: extrude a right-triangle cross-section along the joint (Z).
    // Leg = 1.2 units. The triangle sits in the inside corner of the T.
    const leg = 1.2;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); // root (inside corner)
    shape.lineTo(leg, 0); // horizontal leg along base plate
    shape.lineTo(0, leg); // vertical leg up the stem
    shape.lineTo(0, 0);
    const weldGeo = new THREE.ExtrudeGeometry(shape, { depth: len, bevelEnabled: false });
    const weldMat = new THREE.MeshPhongMaterial({ color: 0xf59e0b, emissive: 0x7c2d12, emissiveIntensity: 0.25, shininess: 80 });
    const weld = new THREE.Mesh(weldGeo, weldMat);
    // Place the triangle root at the inside corner: top of base plate (y=0.2),
    // face of the vertical plate (x = -1.1).
    weld.position.set(-1.1, 0.2, -len / 2);
    scene.add(weld);

    // Convex bead ripples (a few tori) riding the hypotenuse for realism.
    for (let z = -len / 2 + 0.4; z < len / 2; z += 0.5) {
      const ripple = new THREE.Mesh(
        new THREE.TorusGeometry(0.12, 0.05, 6, 12),
        new THREE.MeshPhongMaterial({ color: 0xfbbf24 }),
      );
      // midpoint of the hypotenuse in the joint's local frame
      ripple.position.set(-1.1 + leg / 2 - 0.15, 0.2 + leg / 2 - 0.15, z);
      ripple.rotation.y = Math.PI / 2;
      scene.add(ripple);
    }

    // Dimension labels: leg + throat = 0.707 × leg.
    const legLabel = makeLabel("leg", "#86efac", 26);
    legLabel.position.set(-0.2, 0.15, len / 2 + 0.6);
    scene.add(legLabel);
    const throatLabel = makeLabel("throat ≈ 0.707 × leg", "#93c5fd", 24);
    throatLabel.position.set(-0.4, 1.2, len / 2 + 0.6);
    scene.add(throatLabel);
    const title = makeLabel("Fillet weld · T-joint", "#ffffff", 28);
    title.position.set(0, 3.4, 0);
    scene.add(title);

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
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
      weldGeo.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}
