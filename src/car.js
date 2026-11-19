export function createCarBody(RAPIER, world, position = { x: 0, y: 1.1, z: 12 }) {
  const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(position.x, position.y, position.z)
    .setLinearDamping(0.22)
    .setAngularDamping(1.8);

  const body = world.createRigidBody(bodyDesc);
  const collider = RAPIER.ColliderDesc.cuboid(1.05, 0.45, 1.8)
    .setMass(100)
    .setFriction(1.4)
    .setRestitution(0.05);

  world.createCollider(collider, body);
  return body;
}

export function applySurfaceDriveAssist(body, dt, bounds = {}) {
  const halfWidth = bounds.halfWidth ?? 18;
  const halfLength = bounds.halfLength ?? 30;
  const ceilingHeight = bounds.ceilingHeight ?? 13.5;
  const p = body.translation();
  let surface = "floor";
  let inward = null;

  // Asistencia arcade de adherencia para recorrer paredes y techo.
  if (p.y >= ceilingHeight - 1.15) {
    surface = "ceiling";
    inward = { x: 0, y: -1, z: 0 };
  } else if (Math.abs(p.x) >= halfWidth - 1.45 && p.y > 0.8) {
    surface = "wall";
    inward = { x: -Math.sign(p.x), y: 0, z: 0 };
  } else if (Math.abs(p.z) >= halfLength - 1.45 && p.y > 0.8 && Math.abs(p.x) > 6.5) {
    surface = "wall";
    inward = { x: 0, y: 0, z: -Math.sign(p.z) };
  }

  if (inward) {
    body.setGravityScale(0.08, true);
    body.applyImpulse({
      x: inward.x * 22 * dt,
      y: inward.y * 22 * dt,
      z: inward.z * 22 * dt
    }, true);
  } else {
    body.setGravityScale(1, true);
  }
  return surface;
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

  if (input.doubleJumpPressed && !input.grounded) {
    // Segundo salto/dodge: combina impulso vertical con dirección elegida.
    const right = { x: Math.cos(yaw), z: -Math.sin(yaw) };
    const forwardInput = Math.max(-1, Math.min(1, input.throttle ?? 0));
    const sideInput = Math.max(-1, Math.min(1, input.steer ?? 0));
    const dodgeStrength = 360;
    body.applyImpulse({
      x: forward.x * forwardInput * dodgeStrength + right.x * sideInput * dodgeStrength,
      y: 540,
      z: forward.z * forwardInput * dodgeStrength + right.z * sideInput * dodgeStrength
    }, true);
    if (Math.abs(forwardInput) + Math.abs(sideInput) > 0.1) {
      // Voltereta completa: el segundo salto combina dodge y rotación.
      const flipPitch = forwardInput || (sideInput === 0 ? 1 : 0);
      const flipRoll = sideInput;
      body.applyTorqueImpulse({
        x: -flipPitch * 165,
        y: sideInput * 35,
        z: -flipRoll * 165
      }, true);
    }
  }

  const maxSpeed = boost ? 32 : 23;
  const currentVelocity = body.linvel();
  const currentSpeed = Math.hypot(currentVelocity.x, currentVelocity.z);
  if (currentSpeed > maxSpeed) {
    const scale = maxSpeed / currentSpeed;
    body.setLinvel({ x: currentVelocity.x * scale, y: currentVelocity.y, z: currentVelocity.z * scale }, true);
  }
}
