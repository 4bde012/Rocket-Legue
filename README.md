# NEON STRIKE

Juego original de fútbol con coches en 3D, desarrollado con **Three.js**, **Rapier 3D** y **Vite**.

## Ejecutar en local

Necesitas Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abre la dirección local que muestre Vite en el terminal.

## Controles

| Tecla / mando | Acción |
|---|---|
| W / ↑ | Acelerar |
| S / ↓ | Marcha atrás |
| A / ← | Girar a la izquierda |
| D / → | Girar a la derecha |
| Espacio / A (mando) | Primer salto; pulsa de nuevo en el aire para el segundo salto/dodge |
| Shift / B (mando) | Turbo |
| Control / X (mando) | Derrape |
| Q / E | Control de giro en el aire |
| C | Cambiar entre cámara del coche y de la pelota |
| R (entrenamiento) | Recolocar la pelota en el centro |
| P | Pausar |
| Stick izquierdo | Dirección y control aéreo |
| Gatillos LT / RT | Marcha atrás / aceleración |

El mando utiliza la Gamepad API del navegador. La asignación exacta puede variar según el dispositivo.

## Estructura

- `src/main.js`: escena 3D, interfaz, cámara, entrada y bucle de partida.
- `src/physics.js`: inicialización y actualización del mundo Rapier.
- `src/car.js`: cuerpo físico y control del coche.
- `src/ball.js`: cuerpo físico de la pelota.
- `index.html`: menú y HUD.

## Estado de desarrollo

### Ya implementado en esta fase

- Partido local contra un rival controlado por IA básica.
- Coche conducible, aceleración, frenado/marcha atrás, dirección y derrape.
- Turbo con reserva de energía.
- Primer salto y segundo salto/dodge direccional en el aire.
- Entrenamiento libre sin rival ni cronómetro; goles de práctica y reinicio de pelota con R.
- Pelota 3D con colisiones, rebotes y rotación.
- Estadio con límites físicos, porterías, marcador y cronómetro. La detección de gol tiene en cuenta el radio de la pelota y el hueco útil entre postes.
- Pausa, reinicio tras gol y protección al cambiar de pestaña.
- Cámara dinámica del coche y modo de seguimiento de pelota.
- Entrada de teclado y compatibilidad inicial con mandos mediante Gamepad API.
- Paso de física fijo a 60 Hz con límite de recuperación ante caídas de FPS.
- Pruebas unitarias de modos y detección de goles (`npm test`).
- Compilación de producción con Vite.

### Pendiente: siguientes fases

1. **Jugabilidad y físicas:** volteretas direccionales más completas, adherencia física real a paredes/techo, tuning de impactos y pruebas de equilibrio.
2. **Partidas locales:** equipos 2v2 y 3v3, entrenamiento avanzado, selección de estadios y sus respectivas colisiones.
3. **Interfaz y personalización:** garaje funcional, coches y pinturas originales, ajustes persistentes de controles/gráficos/sonido, pantallas de resultado.
4. **Multijugador online:** servicio de servidor dedicado autoritativo, salas con códigos, matchmaking, sincronización, reconexión y medición de ping. No está implementado todavía; no se presenta el juego local como online.
5. **Calidad y validación:** pruebas automatizadas de físicas y lógica, pruebas en navegadores/dispositivos, rendimiento, accesibilidad y revisión de errores.

## Compilar

```bash
npm run build
```

El proyecto es independiente y no utiliza nombres, logotipos, modelos ni recursos propietarios de otros videojuegos.
