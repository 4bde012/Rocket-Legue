import RAPIER from "@dimforge/rapier3d-compat";

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

const FIXED_STEP = 1 / 60;
const MAX_SUBSTEPS = 6;
let accumulator = 0;

export function stepPhysics(world, deltaSeconds) {
  // Simulación estable a 60 Hz; limita la recuperación tras tirones de FPS.
  accumulator += Math.min(Math.max(deltaSeconds, 0), 0.1);
  let steps = 0;
  while (accumulator >= FIXED_STEP && steps < MAX_SUBSTEPS) {
    world.timestep = FIXED_STEP;
    world.step();
    accumulator -= FIXED_STEP;
    steps += 1;
  }
  if (steps === MAX_SUBSTEPS && accumulator >= FIXED_STEP) accumulator = 0;
}
