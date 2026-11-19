# Rocket-Legue

Juego original de fútbol con coches en 3D, desarrollado con **Three.js**, **Rapier 3D** y **Vite**.

## Ejecutar en local

Necesitas Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abre la dirección local que muestre Vite en el terminal.

## Controles

| Tecla | Acción |
|---|---|
| W / ↑ | Acelerar |
| S / ↓ | Marcha atrás |
| A / ← | Girar a la izquierda |
| D / → | Girar a la derecha |
| Espacio | Saltar en tierra / voltereta aérea en el aire |
| Shift | Turbo |\n| Control | Derrape |\n| Q / E | Control de giro en el aire |
| P | Pausar |

## Estructura

- `src/main.js`: escena 3D, interfaz, cámara y bucle de partida.
- `src/physics.js`: inicialización y actualización del mundo Rapier.
- `src/car.js`: cuerpo físico y control del coche.
- `src/ball.js`: cuerpo físico de la pelota.
- `index.html`: menú y HUD.

## Estado actual

La base jugable incluye un coche, pelota con colisiones físicas, estadio, porterías, marcador, temporizador, turbo, salto y pausa. Es todavía un prototipo: faltan IA más competitiva, cámara más avanzada, agarre real en paredes, menús de garaje, multijugador en red y pruebas de rendimiento. El control aéreo y la IA actuales son una primera versión experimental.

## Compilar

```bash
npm run build
```

El proyecto es independiente y no utiliza código ni recursos propietarios de otros videojuegos.
