---
title: 'Lo que aprendí construyendo mi primera red neuronal'
description: 'Errores, intuiciones y lecciones prácticas de entrenar una red neuronal desde cero con PyTorch: datos, overfitting y por qué la arquitectura importa menos de lo que crees.'
summary: 'Errores, intuiciones y lecciones prácticas de entrenar mi primera red neuronal desde cero con PyTorch.'
tags: ['Deep Learning', 'PyTorch', 'Python', 'Redes Neuronales']
pubDate: 2026-07-14
---

Cuando empecé la especialización de Deep Learning ya sabía Python y había
manejado NumPy para tareas de la universidad, pero nunca había entrenado una
red neuronal de verdad. Este post es el que me habría gustado leer antes de
escribir mi primer `nn.Module`: lo que me costó entender y lo que resultó
obvio demasiado tarde.

## Los datos mandan (y no es un cliché)

Mi primer modelo tenía una accuracy de 98% en entrenamiento y 61% en validación.
No era un problema de arquitectura: era un problema de **fugas de datos**. Había
normalizado usando estadísticas de TODO el dataset, incluyendo el set de
validación. Un solo `StandardScaler` mal colocado y el modelo "veía" información
que no debería.

La lección: el pipeline de datos es parte del modelo. Si el preprocesamiento
aprende algo de los datos de validación, tu métrica de validación es una
mentira elegante.

## Overfitting no se arregla solo con dropout

Cuando vi la brecha entre entrenamiento y validación, mi primer reflejo fue
apilar dropout y weight decay. Ayudó un poco. Lo que de verdad lo arregló fue
**más datos y menos features**. Tenía 40 columnas de las cuales 12 eran
redundantes; al eliminarlas, la brecha se cerró sin tocar la regularización.

Regla práctica que ahora uso: antes de regularizar, pregúntate si tu modelo
necesita tanta información como le estás dando.

## La arquitectura importa menos de lo que crees

Pasé dos días probando combinaciones de capas. La diferencia entre mi peor y
mejor arquitectura fue de ~3 puntos. Cambiar el learning rate de `1e-2` a `1e-3`
me dio 11 puntos en una hora. El orden de importancia, para problemas
tabulares y de visión sencillos:

1. Calidad y cantidad de datos
2. Learning rate y schedule
3. Regularización
4. Arquitectura

## Debugging de entrenamiento: tu mejor herramienta es un gráfico

Si entreno algo hoy, lo primero que hago es graficar la pérdida de
entrenamiento y validación por época. Casi todos los problemas se leen ahí:

- Pérdida de validación que sube mientras la de entrenamiento baja → overfitting
- Ambas planas desde el inicio → learning rate muy pequeño o gradiente muerto
- Pérdida que explota a NaN → learning rate muy grande o datos sin normalizar

## Cierre

Entrenar mi primera red me enseñó más que cualquier curso: los errores son
el currículum real. Hoy, cuando evalúo un proyecto de ML, primero miro el
pipeline de datos y los gráficos de pérdida — la arquitectura casi siempre es
la última cosa que hay que cambiar.