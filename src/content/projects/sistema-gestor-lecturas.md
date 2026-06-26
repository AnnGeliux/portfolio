---
title: "Sistema Gestor de Lecturas"
description: "Aplicación web con Django y MariaDB para registrar libros, metas y progreso de lectura. Incluye panel de estadísticas, control de usuarios y una interfaz moderna en HTML, CSS y JavaScript."
summary: "Aplicación web full-stack en Django y MariaDB para gestionar lecturas: catálogo de libros, metas de lectura, seguimiento de progreso y panel de estadísticas, con control de usuarios y permisos."
technologies:
  - Python
  - Django
  - MariaDB
  - HTML
  - CSS
  - JavaScript
category: "Desarrollo Web Full-Stack"
topics:
  - Django ORM
  - Modelado relacional
  - Autenticación y permisos
  - Dashboards de estadísticas
coverImage: "/projects/sistema-gestor-lecturas.svg"
pubDate: 2026-03-20
featured: true
githubUrl: "https://github.com/AnnGeliux/sistemaGestorLecturas"
---

## Resumen

**Sistema Gestor de Lecturas** es una aplicación web full-stack construida con
**Django** y **MariaDB** para registrar libros, definir metas de lectura y
seguir el progreso de cada usuario. Pensada para clubes de lectura, bibliotecas
personales y entornos educativos, centraliza en un solo lugar lo que suele
repartirse entre listas, notas y hojas de cálculo: qué estoy leyendo, cuánto
avancé y cuándo espero terminar.

## Contexto y motivación

La gestión de lecturas suele resolverse con herramientas genéricas que no
reflejan el ritmo real de un lector: una hoja de cálculo no avisa cuando una
meta se retrasa, ni muestra el avance por capítulo. Quise construir una
herramienta propia, pensada para mi flujo y para grupos de lectura, donde el
progreso sea visible de un vistazo y cada usuario tenga su propio espacio.

## Arquitectura

- **Backend:** Django (Python) con su ORM sobre **MariaDB**. Modelos para
  libros, lecturas, metas y usuarios; relaciones que representan el avance por
  título y por capítulo.
- **Autenticación y permisos:** sistema de usuarios con control de acceso por
  rol, de modo que cada lector gestiona sus propias lecturas y un administrador
  puede supervisar el catálogo y los usuarios.
- **Frontend:** interfaz moderna en **HTML, CSS y JavaScript**, integrada a las
  plantillas de Django, sin framework pesado para mantener el sitio ligero y
  rápido.
- **Estadísticas:** panel con el avance por usuario y por libro, para ver de un
  golpe el progreso global y detectar lecturas estancadas.

## Características

- Registro y catálogo de libros con metas de lectura asociadas.
- Seguimiento del progreso por título y por capítulo.
- Panel de estadísticas con el avance por usuario.
- Control de usuarios y permisos por rol.
- Interfaz moderna construida con HTML, CSS y JavaScript.

## Lo que aprendí

Este proyecto consolidó mi lado **full-stack**: modelar relaciones en MariaDB,
estructurar vistas y permisos en Django, y diseñar una interfaz usables sin
framework. Me forzó a pensar en la experiencia del lector (qué información
necesita en cada pantalla) y en mantener el código reproducible con entornos
virtuales y control de versiones con Git.

## Stack

Python · Django · MariaDB · HTML · CSS · JavaScript · Git.