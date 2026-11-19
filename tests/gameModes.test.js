import test from "node:test";
import assert from "node:assert/strict";
import { getGameMode, isGoalPosition } from "../src/gameModes.js";

test("el partido local tiene rival, cronómetro y goles", () => {
  assert.deepEqual(getGameMode("match"), {
    duration: 180, hasRival: true, hasTimer: true, countsGoals: true
  });
});

test("el entrenamiento no tiene rival ni cronómetro", () => {
  assert.deepEqual(getGameMode("training"), {
    duration: 0, hasRival: false, hasTimer: false, countsGoals: false
  });
});

test("un gol válido atraviesa el plano dentro del hueco de la portería", () => {
  assert.equal(isGoalPosition({ x: 0, y: 2, z: 29.3 }), true);
  assert.equal(isGoalPosition({ x: 0, y: 2, z: -29.3 }), true);
});

test("la pelota no marca si golpea un poste, el larguero o pasa por encima", () => {
  assert.equal(isGoalPosition({ x: 4, y: 2, z: 29.3 }), false);
  assert.equal(isGoalPosition({ x: 0, y: 4.6, z: 29.3 }), false);
  assert.equal(isGoalPosition({ x: 0, y: 6, z: 29.3 }), false);
  assert.equal(isGoalPosition({ x: 0, y: 2, z: 28 }), false);
});

test("un modo desconocido vuelve al partido seguro por defecto", () => {
  assert.deepEqual(getGameMode("unknown"), getGameMode("match"));
});
