import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createRendererSafe } from "../trade-sims/diagrams/three-lib";
import { SkylineFallback, type SkylineMapProps } from "./svg-fallbacks";

const URGENCY_COLOR: Record<string, number> = {
  stable:  0x10b981,
  watch:   0xf59e0b,
  concern: 0xf97316,
  crisis:  0xef4444,
};

function disposeMaterial(material: THREE.Material) {
  for (const key of Object.keys(material)) {
    const value = (material as unknown as Record<string, unknown>)[key];
    if (value && (value as THREE.Texture).isTexture) {
      (value as THREE.Texture).dispose();
    }
  }
  material.dispose();
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((obj: any) => {
    const renderable = obj as THREE.Object3D & {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };
    renderable.geometry?.dispose();
    if (Array.isArray(renderable.material)) {
      renderable.material.forEach(disposeMaterial);
    } else if (renderable.material) {
      disposeMaterial(renderable.material);
    }
  });
}

export default function SkylineMap({ zips, centerLat, centerLng }: SkylineMapProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    mount.replaceChildren();
    if (!zips || zips.length === 0) return;

    const W = mount.clientWidth || 800;
    const H = mount.clientHeight || 480;

    // Renderer: WebGL is unavailable in some mobile webviews and headless
    // browsers. This visualization must never take down the Community Impact
    // page when it cannot obtain a context.
    const renderer = createRendererSafe({ antialias: true });
    if (!renderer) {
      setWebglUnavailable(true);
      return;
    }
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0x0f172a);
    mount.appendChild(renderer.domElement);

    // Scene + camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0f172a, 20, 60);
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);
    camera.position.set(0, 8, 14);
    camera.lookAt(0, 2, 0);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(10, 20, 10);
    sun.castShadow = true;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x60a5fa, 0.3);
    fill.position.set(-10, 10, -10);
    scene.add(fill);

    // Grid
    const grid = new THREE.GridHelper(30, 30, 0x1e293b, 0x1e293b);
    grid.position.y = -0.05;
    scene.add(grid);

    // Columns
    const maxCost = Math.max(...zips.map((z) => z.costOfInaction), 1);
    const scale = 100;

    zips.forEach((z) => {
      const x = (z.lng - centerLng) * scale;
      const zPos = -(z.lat - centerLat) * scale;
      const h = Math.max(0.2, (z.costOfInaction / maxCost) * 8);
      const color = URGENCY_COLOR[z.urgency] || 0x64748b;
      const w = z.isCenter ? 0.5 : 0.35;

      const geo = new THREE.BoxGeometry(w, h, w);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: z.isCenter ? 0.4 : 0.15,
        roughness: 0.3,
        metalness: 0.4,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, h / 2, zPos);
      mesh.castShadow = true;
      scene.add(mesh);

      // Floating grade label (canvas sprite)
      const canvas2d = document.createElement("canvas");
      canvas2d.width = 128; canvas2d.height = 64;
      const ctx = canvas2d.getContext("2d")!;
      ctx.fillStyle = z.isCenter ? "#ffffff" : "#94a3b8";
      ctx.font = z.isCenter ? "bold 36px sans-serif" : "24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(z.isCenter ? z.grade : z.zip.slice(-3), 64, 40);
      const tex = new THREE.CanvasTexture(canvas2d);
      const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(0.8, 0.4, 1);
      sprite.position.set(x, h + 0.5, zPos);
      scene.add(sprite);
    });

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2, 0);
    controls.minPolarAngle = 0.1;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.update();

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const nW = mount.clientWidth;
      const nH = mount.clientHeight;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      disposeScene(scene);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [zips, centerLat, centerLng]);

  if (!zips || zips.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900 text-slate-400 text-sm">
        No geographic data loaded
      </div>
    );
  }

  if (webglUnavailable) {
    return (
      <div data-testid="skyline-map-fallback" className="h-full overflow-auto bg-card p-3 text-foreground">
        <SkylineFallback zips={zips} centerLat={centerLat} centerLng={centerLng} />
        <p role="status" className="mt-2 text-center text-xs text-muted-foreground">
          Interactive map view is unavailable on this device.
        </p>
      </div>
    );
  }

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}
