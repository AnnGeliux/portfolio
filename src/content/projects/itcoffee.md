---
title: "itCoffee"
description: "Sistema de gestión para cafetería multi-sucursal: monorepo Next.js + NestJS con PostgreSQL, Prisma y Clerk. Autenticación por sucursal con Organizations y RBAC fino, desarrollado por fases contra un PRD de 85 historias de usuario."
summary: "Sistema de gestión para cafeterías con múltiples sucursales: frontend Next.js, API NestJS modular, PostgreSQL con Prisma y autenticación Clerk — sucursales como Clerk Organizations y roles finos por sucursal en la base de datos."
technologies:
  - TypeScript
  - Next.js
  - NestJS
  - PostgreSQL
  - Prisma
  - Clerk
  - Tailwind CSS
  - Turborepo
category: "Desarrollo Web Full-Stack"
topics:
  - Arquitectura multi-sucursal
  - RBAC por sucursal
  - Monorepo
  - Autenticación con Clerk
  - Diseño por fases
coverImage: "/projects/itcoffee.svg"
pubDate: 2026-08-10
featured: false
githubUrl: "https://github.com/AnnGeliux/itCoffee"
---

## Resumen

**itCoffee** es un sistema de gestión para cafetería — web responsivo y
multi-sucursal — construido por fases contra un documento de requerimientos
con 85 historias de usuario. Un monorepo con Turborepo aloja el frontend
(Next.js App Router) y la API (NestJS como monolito modular), sobre PostgreSQL
con Prisma ORM.

## Contexto y motivación

Una cafetería con varias sucursales necesita que cada una gestione lo suyo
sin que el administrador de una vea o edite los datos de otra. Quería
construir ese aislamiento de forma explícita: sucursales como entidades de
primera clase, con roles finos por sucursal y no un simple booleano de
administrador global.

## Arquitectura

- **Monorepo:** pnpm workspaces + Turborepo — `apps/web` (Next.js) y
  `apps/api` (NestJS) comparten tipos y scripts.
- **Autenticación:** Clerk para staff y clientes; cada sucursal mapea 1:1 a
  una **Clerk Organization**, y los roles finos viven en la base de datos
  (RBAC por sucursal).
- **API modular:** NestJS como monolito modular — cada dominio es un módulo
  con sus propias rutas, DTOs y validaciones.
- **Datos:** PostgreSQL con Prisma ORM; migraciones versionadas y datos
  semilla para arrancar la sucursal Matriz.
- **Regionalización:** México — moneda MXN y IVA 16% desde el modelo de
  datos.

## Características

- Gestión multi-sucursal con aislamiento de datos por sucursal.
- Roles finos por sucursal definidos en la base de datos.
- Autenticación de staff y clientes con Clerk.
- Desarrollo por fases (fase 0: auth + RBAC + sucursales + shell) contra un
  roadmap definido en el PRD.

## Lo que aprendí

Diseñar RBAC real — donde Clerk resuelve la autenticación pero los roles
finos viven en tu propia base de datos — me enseñó a no delegar la
autorización entera a un proveedor. También a mantener disciplina de
producto: avanzar por fases contra 85 historias de usuario documentadas, en
lugar de improvisar el alcance sobre la marcha.

## Stack

TypeScript · Next.js · NestJS · PostgreSQL · Prisma · Clerk · Tailwind CSS ·
Turborepo · pnpm.