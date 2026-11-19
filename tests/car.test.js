import test from "node:test";
import assert from "node:assert/strict";
import { driveCar, applySurfaceDriveAssist } from "../src/car.js";

function makeBody() {
  const impulses = [];
  const torques = [];
  const gravityScales = [];
  return {
    impulses,
    torques,
    gravityScales,
    rotation: () => ({ x: 0, y: 0, z: 0, w: 1 }),
    translation: () => ({ x: 0, y: 0, z: 0 }),
    setGravityScale: (value) => gravityScales.push(value),
    linvel: () => ({ x: 0, y: 0, z: 0 }),
    applyImpulse: (value) => impulses.push(value),
    applyTorqueImpulse: (value) => torques.push(value),
    setLinvel: () => {}
  };
}

test("el primer salto aplica impulso vertical en tierra", () => {
  const body = makeBody();
  driveCar(body, { grounded: true, jumpPressed: true }, 1 / 60);
  assert.ok(body.impulses.some((impulse) => impulse.y === 850));
});

test("el segundo salto aplica impulso vertical y dodge hacia delante", () => {
  const body = makeBody();
  driveCar(body, {
    grounded: false,
    doubleJumpPressed: true,
    throttle: 1,
    steer: 0
  }, 1 / 60);
  assert.ok(body.impulses.some((impulse) => impulse.y === 540 && impulse.z === -360));
});

test("el segundo salto permite dodge lateral", () => {
  const body = makeBody();
  driveCar(body, {
    grounded: false,
    doubleJumpPressed: true,
    throttle: 0,
    steer: 1
  }, 1 / 60);
  assert.ok(body.impulses.some((impulse) => impulse.y === 540 && impulse.x === 360));
});

test("el segundo salto aplica una voltereta completa hacia delante", () => {
  const body = makeBody();
  driveCar(body, { grounded: false, doubleJumpPressed: true, throttle: 1, steer: 0 }, 1 / 60);
  assert.ok(body.torques.some((torque) => torque.x === -165));
});

test("la asistencia de superficie se activa junto a una pared", () => {
  const body = makeBody();
  body.translation = () => ({ x: 17, y: 4, z: 0 });
  assert.equal(applySurfaceDriveAssist(body, 1 / 60), "wall");
  assert.equal(body.gravityScales.at(-1), 0.08);
  assert.ok(body.impulses.some((impulse) => impulse.x < 0));
});

test("la asistencia de superficie se activa en el techo", () => {
  const body = makeBody();
  body.translation = () => ({ x: 0, y: 13, z: 0 });
  assert.equal(applySurfaceDriveAssist(body, 1 / 60), "ceiling");
  assert.equal(body.gravityScales.at(-1), 0.08);
  assert.ok(body.impulses.some((impulse) => impulse.y < 0));
});

test("la asistencia restaura la gravedad en el suelo", () => {
  const body = makeBody();
  assert.equal(applySurfaceDriveAssist(body, 1 / 60), "floor");
  assert.equal(body.gravityScales.at(-1), 1);
});
