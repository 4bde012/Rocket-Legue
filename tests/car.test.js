import test from "node:test";
import assert from "node:assert/strict";
import { driveCar } from "../src/car.js";

function makeBody() {
  const impulses = [];
  const torques = [];
  return {
    impulses,
    torques,
    rotation: () => ({ x: 0, y: 0, z: 0, w: 1 }),
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
