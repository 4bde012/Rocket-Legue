import RAPIER from "@dimforge/rapier3d";

export async function createPhysicsWorld() {
  await RAPIER.init();
  const gravity = { x: 0, y: -9.81, z: 0 };
  const world = new RAPIER.World(gravity);
  world.timestep = 1 / 60;

  const groundBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0)
  );
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(18, 0.5, 30)
      .setFriction(1.2),
    groundBody
  );

  return { RAPIER, world };
}

export function stepPhysics(world, deltaSeconds) {
  const maxStep = 1 / 60;
  const steps = Math.max(1, Math.ceil(deltaSeconds / maxStep));
  const dt = Math.min(deltaSeconds / steps, maxStep);
  for (let i = 0; i < steps; i += 1) {
    world.timestep = dt;
    world.step();
  }
}
