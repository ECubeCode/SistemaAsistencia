# Asistencia - Prácticas Profesionalizantes

Aplicación web de asistencia para la materia **Prácticas Profesionalizantes** del
E.T. N°3 D.E. 9° "María Sánchez de Thompson". Permite a los alumnos registrar su
propia asistencia (con conteo automático de horas en módulos de 30 minutos), a
los profesores consultar el estado de todos los alumnos, y a un administrador
gestionar usuarios y corregir asistencias pasadas. Incluye un log de auditoría
de todas las acciones relevantes del sistema.

## Horarios y conteo de horas

| Día      | Horario       | Módulos (30min) | Horas acreditadas |
|----------|---------------|:---:|:---:|
| Martes   | 21:10 a 22:40 | 3 | 3hs |
| Jueves   | 18:00 a 19:30 | 3 | 3hs |
| Viernes  | 20:40 a 22:10 | 3 | 3hs |

- El botón para registrar asistencia se habilita recién cuando la clase del día
  ya comenzó, y se deshabilita cuando termina el horario de ese día (después de
  eso solo el administrador puede cargarla/corregirla, como una clase pasada).
- Un alumno no puede registrar asistencia de una clase que todavía no sucedió,
  ni ver habilitado el botón fuera del horario de clase.
- En el primer inicio de sesión, cada alumno puede cargar una única vez la
  cantidad de horas que ya tenía acumuladas antes de que existiera el sistema.
  Después de esa carga, solo el administrador puede modificarlas.

## Roles

- **Alumno**: inicia sesión con DNI + contraseña, registra su propia
  asistencia y ve su historial y total de horas.
- **Profesor**: ve información de solo lectura de todos los alumnos (listado,
  totales de horas, historial de asistencias). No puede modificar nada.
- **Administrador**: todo lo del profesor, más gestión de usuarios (alta de
  alumnos/profesores/admins, reseteo de contraseñas, activar/desactivar
  cuentas), corrección de asistencias de clases ya sucedidas, edición de horas
  iniciales, y visualización del log de auditoría del sistema.

## Stack técnico

- Next.js 14 (App Router) + TypeScript, todo en un único proyecto
  (frontend + backend vía API routes).
- Base de datos SQLite embebida (vía Prisma ORM), persistida en un volumen
  Docker — no requiere un servidor de base de datos aparte.
- Autenticación con NextAuth (Credentials: DNI + contraseña, sesiones JWT).
- Tailwind CSS con la paleta de colores del logo del colegio.

## Desarrollo local

```bash
npm install
cp .env.example .env   # completar DATABASE_URL, NEXTAUTH_SECRET, ADMIN_*
npx prisma migrate dev
npm run dev
```

La primera vez que se corre `prisma migrate dev` (o al levantar el contenedor
en producción) se ejecuta automáticamente el seed (`prisma/seed.js`), que crea
el usuario administrador inicial definido por las variables `ADMIN_DNI` /
`ADMIN_PASSWORD` / `ADMIN_NOMBRE` / `ADMIN_APELLIDO`, si todavía no existe un
usuario con ese DNI. **Cambiá esa contraseña (o creá otro admin y desactivá
este) después del primer ingreso en producción.**

## Deploy con Dockploy

1. Subí este repositorio a tu proveedor de git (GitHub/GitLab/etc).
2. En Dockploy, creá una nueva aplicación de tipo "Docker Compose" (o
   "Dockerfile") apuntando a este repo.
3. Configurá las variables de entorno (ver `.env.example`):
   - `NEXTAUTH_SECRET`: generar con `openssl rand -base64 32`.
   - `NEXTAUTH_URL`: la URL pública final de la app (con https).
   - `ADMIN_DNI`, `ADMIN_PASSWORD`, `ADMIN_NOMBRE`, `ADMIN_APELLIDO`: datos del
     administrador inicial.
4. Asegurate de que el volumen `asistencia_data` (definido en
   `docker-compose.yml`, montado en `/app/data`) sea persistente entre
   despliegues — ahí vive el archivo SQLite con todos los datos.
5. Desplegá. Al iniciar, el contenedor aplica las migraciones de Prisma
   (`prisma migrate deploy`) y corre el seed del admin automáticamente antes
   de levantar el servidor Next.js.

## Notas de seguridad

- Las contraseñas se guardan hasheadas con bcrypt, nunca en texto plano.
- Cambiá `NEXTAUTH_SECRET` y la contraseña del admin inicial antes de dar la
  app por operativa en producción.
- Next.js se mantiene en la última versión parcheada de la rama 14.x
  (`14.2.35`) disponible al momento de este desarrollo. Revisá periódicamente
  si hay actualizaciones de seguridad (`npm audit`) y aplicalas.
