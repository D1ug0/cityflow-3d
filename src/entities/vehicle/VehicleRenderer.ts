import {
  Color,
  DynamicDrawUsage,
  Frustum,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Sphere,
  Vector3,
  type BufferGeometry,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ResourceManager } from '@/shared/lib/three/ResourceManager';
import { createVehicleGeometry } from './create-vehicle-geometry';
import { VehicleSimulation } from './index';
export class VehicleRenderer {
  readonly resources = new ResourceManager();
  readonly root = new Object3D();
  readonly mesh: InstancedMesh;
  private model: BufferGeometry | null = null;
  private readonly simple: BufferGeometry;
  private readonly medium: BufferGeometry;
  private readonly palette = [0x70dec8, 0xe6b86a, 0xa1b9cc, 0xe9ece9, 0x7592c6];
  private readonly color = new Color();
  private readonly transform = new Object3D();
  private readonly sphere = new Sphere(new Vector3(), 4);
  private readonly frustum = new Frustum();
  readonly visibleIds: Int32Array;
  private disposed = false;
  constructor(public readonly simulation: VehicleSimulation) {
    this.simple = this.resources.track(createVehicleGeometry('low'));
    this.medium = this.resources.track(createVehicleGeometry('medium'));
    const material = this.resources.track(
      new MeshStandardMaterial({ roughness: 0.55, metalness: 0.18 }),
    );
    this.mesh = new InstancedMesh(this.simple, material, simulation.count);
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    this.mesh.frustumCulled = false; // Individual spheres are culled before compacting the instance buffer.
    this.visibleIds = new Int32Array(simulation.count);
    this.root.add(this.mesh);
  }
  async loadModel() {
    const gltf = await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/car.gltf`);
    const loaded = new ResourceManager();
    loaded.trackObject(gltf.scene);
    if (this.disposed) {
      loaded.dispose();
      return;
    }
    let geometry: BufferGeometry | null = null;
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((node) => {
      if (node instanceof Mesh && !geometry)
        geometry = node.geometry.clone().applyMatrix4(node.matrixWorld);
    });
    loaded.dispose();
    if (!geometry) throw new Error('В модели автомобиля отсутствует Mesh.');
    this.model = this.resources.track(geometry);
  }
  update(matrix: Matrix4, detail: number) {
    this.mesh.geometry =
      detail === 2 && this.model ? this.model : detail > 0 ? this.medium : this.simple;
    const material = this.mesh.material as MeshStandardMaterial;
    const vertexColors = this.mesh.geometry.hasAttribute('color');
    if (material.vertexColors !== vertexColors) {
      material.vertexColors = vertexColors;
      material.needsUpdate = true;
    }
    this.frustum.setFromProjectionMatrix(matrix);
    let visible = 0;
    for (let i = 0; i < this.simulation.count; i++) {
      const p = this.simulation.position(i);
      this.sphere.center.set(p.x, p.y, 1);
      if (!this.frustum.intersectsSphere(this.sphere)) continue;
      this.transform.position.set(p.x, p.y, 0.12);
      this.transform.rotation.z = p.heading;
      this.transform.updateMatrix();
      this.mesh.setMatrixAt(visible, this.transform.matrix);
      this.mesh.setColorAt(visible, this.color.setHex(this.palette[i % this.palette.length]));
      this.visibleIds[visible++] = i;
    }
    this.mesh.count = visible;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    // Raycasting uses InstancedMesh's aggregate bound, which changes after compaction.
    this.mesh.boundingSphere = null;
    return visible;
  }
  dispose() {
    this.disposed = true;
    this.mesh.dispose();
    this.resources.dispose();
    this.root.clear();
  }
}
