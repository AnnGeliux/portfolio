---
title: 'Construí un sistema gestor de lecturas (y el architecture review me cambió el plan)'
description: 'Cómo un sistema de gestión de lecturas de agua evolucionó de prototipo a arquitectura seria: Django + React, decisiones de diseño y el error de escalar antes de tiempo.'
summary: 'Cómo el sistema gestor de lecturas pasó de prototipo a arquitectura seria — decisiones de diseño y errores de escalado temprano.'
tags: ['Django', 'React', 'Python', 'Full-Stack', 'PostgreSQL']
pubDate: 2026-09-15
---

El proyecto más reciente de mi portafolio es un sistema de gestión de lecturas
de agua: captura de tomas, cálculo de consumos, facturación estimada y reportes
para administración. Suena simple. No lo es — y ese es precisamente el post.

## El origen: un prototipo que sobrevivió

Empezó como script de consola en Python para un problema real. Funcionaba, pero
cada reporte nuevo era copiar/pegar el anterior. Cuando el prototipo llegó a
tres consumidores distintos de reportes, quedó claro que necesitaba estructura:
esquema de datos normalizado, API con contratos, y una UI que no fuera la consola.

## La decisión de stack: Django + React

Elegí Django por tres razones concretas: ORM maduro con migraciones (los
esquemas de facturación cambian y las migraciones te salvan la vida), admin
autogenerado (para back-office sin escribir UI extra), y Python compartido con
mi lado de datos/ML — puedo reusar las mismas utilidades de cálculo.

React en el frente porque el proyecto tiene muchas pantallas de formulario +
tabla que comparten patrones, y los componentes compuestos se pagan solos con
la tercera pantalla. PostgreSQL en vez de SQLite porque los cálculos agregados
(por período, por zona) explotan cualquier cosa que no tenga CTEs de verdad.

## El error que me cambió el plan: escalar antes de tiempo

En la versión 2 imaginé una arquitectura de microservicios: uno para
captura, otro para facturación, otro para reportes. La escribí en un diagrama
bonito, la miré diez minutos y la tiré a la basura — era una app con cinco
usuarios concurrentes y yo ya estaba resolviendo problemas que no tenía.

La lección de arquitectura más importante que me han dado: **los
microservicios son un impuesto que pagas por escala que aún no tienes**. Un
monolito modular — boundaries claros entre apps de Django, pero un solo
despliegue — me daba el 90% del beneficio con el 10% del costo. El día que
necesite dividir, los boundaries ya están.

## Lo que hace bien el sistema hoy

- Captura de tomas con validación en el borde (no basura a la base de datos)
- Cálculo de consumo con historial de tarifas versionado (auditable)
- Reportes por zona/período con exportación a CSV/Excel
- Admin de Django para el back-office

## Cierre

El sistema gestor de lecturas me enseñó que el valor de un proyecto no está en
la tecnología elegida, sino en las decisiones que NO tomaste. La arquitectura
final es más simple que la que diseñé al inicio — y funciona mejor.

> El código está en mi GitHub y su página de detalle en la sección de proyectos
> de este portafolio. Si quieres ver el razonamiento completo, ahí está la
> versión larga.