export function createCarBody(RAPIER, world, position = { x: 0, y: 1.1, z: 12 }) {
  const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(position.x, position.y, position.z)
    .setLinearDamping(0.25)
    .setAngularDamping(3)
    // Mantiene el coche vertical, pero permite girar sobre el eje Y.
    .setEnabledRotations(false, true, false);

  const body = world.createRigidBody(bodyDesc);
  const collider = RAPIER.ColliderDesc.cuboid(1.05, 0.45, 1.8)
    .setMass(100)
    .setFriction(1.4)
    .setRestitution(0.05);

  world.createCollider(collider, body);
  return body;
}

export function driveCar(body, input, dt) {
  const throttle = Math.max(-1, Math.min(1, input.throttle ?? 0));
  const steer = Math.max(-1, Math.min(1, input.steer ?? 0));
  const boost = Boolean(input.boost);

  const rotation = body.rotation();
  const yaw = Math.atan2(
    2 * (rotation.w * rotation.y + rotation.x * rotation.z),
    1 - 2 * (rotation.y * rotation.y + rotation.z * rotation.z)
  );
  const forward = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
  const velocity = body.linvel();
  const speed = Math.hypot(velocity.x, velocity.z);
  const force = boost ? 145 : 85;

  body.applyImpulse(
    { x: forward.x * throttle * force * dt, y: 0, z: forward.z * throttle * force * dt },
    true
  );

  if (speed > 0.5) {
    const direction = velocity.x * forward.x + velocity.z * forward.z >= 0 ? 1 : -1;
    body.applyTorqueImpulse({ x: 0, y: steer * direction * Math.min(speed / 8, 1.4) * 18 * dt, z: 0 }, true);
  }

  if (input.jumpPressed && input.grounded) {
    body.applyImpulse({ x: 0, y: 850, z: 0 }, true);
  }

  const maxSpeed = boost ? 32 : 23;
  const currentSpeed = Math.hypot(body.linvel().x, body.linvel().z);
  if (currentSpeed > maxSpeed) {
    const v = body.linvel();
    const scale = maxSpeed / currentSpeed;
    body.setLinvel({ x: v.x * scale, y: v.y, z: v.z * scale }, true);
  }
}
