/**
 * Three.js is intentionally used as a vanilla, untyped boundary in this
 * project. Keep the declaration local so every visualization shares one
 * explicit boundary without weakening the rest of the compiler.
 */
declare module "three" {
  export const AmbientLight: any;
  export type AmbientLight = any;
  export const BoxGeometry: any;
  export type BoxGeometry = any;
  export const BufferAttribute: any;
  export type BufferAttribute = any;
  export const BufferGeometry: any;
  export type BufferGeometry = any;
  export const CanvasTexture: any;
  export type CanvasTexture = any;
  export const CatmullRomCurve3: any;
  export type CatmullRomCurve3 = any;
  export const Color: any;
  export type Color = any;
  export const ConeGeometry: any;
  export type ConeGeometry = any;
  export const CylinderGeometry: any;
  export type CylinderGeometry = any;
  export const DirectionalLight: any;
  export type DirectionalLight = any;
  export const DoubleSide: any;
  export const ExtrudeGeometry: any;
  export type ExtrudeGeometry = any;
  export const Fog: any;
  export type Fog = any;
  export const GridHelper: any;
  export type GridHelper = any;
  export const Line: any;
  export type Line = any;
  export const LineBasicMaterial: any;
  export type LineBasicMaterial = any;
  export const LineLoop: any;
  export type LineLoop = any;
  export const Material: any;
  export type Material = any;
  export const Mesh: any;
  export type Mesh = any;
  export const MeshBasicMaterial: any;
  export type MeshBasicMaterial = any;
  export const MeshPhongMaterial: any;
  export type MeshPhongMaterial = any;
  export const MeshStandardMaterial: any;
  export type MeshStandardMaterial = any;
  export const Object3D: any;
  export type Object3D = any;
  export const PerspectiveCamera: any;
  export type PerspectiveCamera = any;
  export const PlaneGeometry: any;
  export type PlaneGeometry = any;
  export const PointLight: any;
  export type PointLight = any;
  export const Points: any;
  export type Points = any;
  export const PointsMaterial: any;
  export type PointsMaterial = any;
  export const QuadraticBezierCurve3: any;
  export type QuadraticBezierCurve3 = any;
  export const Scene: any;
  export type Scene = any;
  export const Shape: any;
  export type Shape = any;
  export const SphereGeometry: any;
  export type SphereGeometry = any;
  export const Sprite: any;
  export type Sprite = any;
  export const SpriteMaterial: any;
  export type SpriteMaterial = any;
  export const Texture: any;
  export type Texture = any;
  export const TorusGeometry: any;
  export type TorusGeometry = any;
  export const TubeGeometry: any;
  export type TubeGeometry = any;
  export const Vector3: any;
  export type Vector3 = any;
  export const WebGLRenderer: any;
  export type WebGLRenderer = any;
}

declare module "three/examples/jsm/controls/OrbitControls.js" {
  export const OrbitControls: any;
}