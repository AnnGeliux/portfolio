---
title: "MCP Inspector"
description: "DevTools de escritorio (Electron + React) que intercepta, inspecciona y depura tráfico JSON-RPC 2.0 entre servidores y clientes MCP en tiempo real — proxy MITM con breakpoints, simulación de fallos y 157 pruebas automatizadas."
summary: "Proxy MITM para depurar conexiones MCP: captura el tráfico JSON-RPC 2.0 entre cualquier servidor y cliente MCP, con breakpoints editables, validación contra la especificación oficial y simulación de fallos, latencias y respuestas."
technologies:
  - TypeScript
  - Electron
  - React
  - Node.js
  - Model Context Protocol
category: "DevTools para IA"
topics:
  - JSON-RPC 2.0
  - Proxy MITM
  - Model Context Protocol
  - Electron IPC
  - Pruebas automatizadas
coverImage: "/projects/mcp-inspect.svg"
pubDate: 2026-09-02
featured: true
githubUrl: "https://github.com/AnnGeliux/mcp-inspect"
---

## Resumen

**MCP Inspector** es un visualizador man-in-the-middle (MITM) para conexiones
MCP: se sienta entre cualquier servidor MCP y cualquier cliente MCP, captura
todo el tráfico **JSON-RPC 2.0** y lo renderiza en una UI de chat con
timestamps, latencia por transacción, filtros y búsqueda. Permite pausar la
comunicación con breakpoints para editar peticiones y respuestas al vuelo —
enviar, modificar, descartar o responder manualmente — sin tocar ni el
servidor ni el cliente.

## Contexto y motivación

Depurar por qué un agente no recibe las respuestas correctas de un servidor
MCP suele reducirse a leer logs crudos. Quería una herramienta visual que
mostrara la conversación completa como un chat — con la latencia real de cada
transacción y la posibilidad de intervenir en vivo — y que validara cada
frame contra la especificación oficial del protocolo.

## Arquitectura

- **Proceso principal (Electron):** hace spawn del servidor MCP y monta un
  proxy STDIO bidireccional — todo el tráfico cruza un pipeline MITM antes de
  llegar a su destino, en ambas direcciones.
- **Pipeline de intercepción:** reglas por método (`tools/call`,
  `resources/read`…), holds con garantía FIFO, correlación petición↔respuesta
  por ID, pausa global con colas por dirección.
- **Parser NDJSON:** cada línea se clasifica como request, response,
  notification o error.
- **Cliente MCP real (SDK oficial):** ejecuta el handshake
  `initialize → initialized` contra el proxy.
- **Validación de especificación:** cada frame se valida contra los schemas
  zod del SDK oficial; los no conformes se marcan con una advertencia.
- **UI (React):** vista de chat con burbujas por dirección, resaltado de
  sintaxis JSON, visor formateado y crudo, y un editor inline para los
  mensajes retenidos.

## Características

- Vista de tráfico en vivo estilo chat: bloques de transacción con latencia
  en ms y burbujas sueltas para notificaciones.
- Breakpoints por dirección y por método, con edición inline: enviar,
  editar, descartar o responder manualmente.
- Simulación de comportamiento: inyección de errores JSON-RPC estándar,
  auto-mock de respuestas y throttling con retardo configurable.
- Pausa global que congela el tráfico sin matar el subproceso — los mensajes
  se re-entran en orden al reanudar.
- Gestión del proceso: iniciar, pausar, matar y reiniciar el servidor MCP
  sin reiniciar el cliente.
- Selección visual de servidores y clientes con presets, CRUD completo y
  persistencia local en JSON.

## Lo que aprendí

Construir un proxy MITM correcto es un ejercicio de orden y garantías: los
mensajes no pueden reordenarse aunque el usuario resuelva breakpoints fuera de
secuencia, y las simulaciones deben auto-resolverse sin intervención. Aprendí
a manejar procesos hijos y IPC de Electron con un pipeline probado hasta el
último caso borde — 157 pruebas automatizadas en 11 suites cubren desde el
parser hasta los componentes de UI.

## Stack

TypeScript · Electron · React · Node.js · @modelcontextprotocol/sdk · Vite.