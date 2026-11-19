export function createBallBody(RAPIER, world, position = { x: 0, y: 2, z: 0 }) {
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y, position.z)
      .setLinearDamping(0.08)
      .setAngularDamping(0.12)
  );

  world.createCollider(
    RAPIER.ColliderDesc.ball(1.5)
      .setMass(18)
      .setFriction(0.65)
      .setRestitution(0.72),
    body
  );

  return body;
}
