export function createCarBody(RAPIER, world, position = { x: 0, y: 1.1, z: 12 }) {
  const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(position.x, position.y, position.z)
    .setLinearDamping(0.22)
    .setAngularDamping(1.8)
    // Las tres rotaciones están habilitadas para permitir maniobras aéreas.
    .setEnabledRotations(true, true, true);

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

  if (input.grounded && speed > 0.5) {
    const direction = velocity.x * forward.x + velocity.z * forward.z >= 0 ? 1 : -1;
    body.applyTorqueImpulse({ x: 0, y: steer * direction * Math.min(speed / 8, 1.4) * 18 * dt, z: 0 }, true);
  } else if (!input.grounded) {
    const pitch = Math.max(-1, Math.min(1, input.airPitch ?? 0));
    const roll = Math.max(-1, Math.min(1, input.airRoll ?? 0));
    const yawControl = Math.max(-1, Math.min(1, input.airYaw ?? 0));
    body.applyTorqueImpulse({
      x: pitch * 34 * dt,
      y: yawControl * 18 * dt,
      z: roll * 34 * dt
    }, true);
  }

  if (input.drift && input.grounded) {
    // Reduce la velocidad lateral para permitir derrapes controlados.
    const right = { x: Math.cos(yaw), z: -Math.sin(yaw) };
    const lateralSpeed = velocity.x * right.x + velocity.z * right.z;
    body.applyImpulse({ x: -right.x * lateralSpeed * 7 * dt, y: 0, z: -right.z * lateralSpeed * 7 * dt }, true);
  }

  if (input.jumpPressed && input.grounded) {
    body.applyImpulse({ x: 0, y: 850, z: 0 }, true);
  }

  if (input.flipPressed && !input.grounded) {
    body.applyImpulse({ x: forward.x * 520, y: 120, z: forward.z * 520 }, true);
    body.applyTorqueImpulse({ x: 95, y: 0, z: 0 }, true);
  }

  const maxSpeed = boost ? 32 : 23;
  const currentVelocity = body.linvel();
  const currentSpeed = Math.hypot(currentVelocity.x, currentVelocity.z);
  if (currentSpeed > maxSpeed) {
    const scale = maxSpeed / currentSpeed;
    body.setLinvel({ x: currentVelocity.x * scale, y: currentVelocity.y, z: currentVelocity.z * scale }, true);
  }
}
